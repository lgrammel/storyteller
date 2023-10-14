import {
  NarratedStoryPart,
  narratedStoryPartSchema,
} from "@/storyteller/NarratedStoryPart";
import { storytellerEventSchema } from "@/storyteller/StorytellerEvent";
import { narrateStoryPart } from "@/storyteller/narrateStoryPart";
import { FullVoiceId, selectVoice } from "@/storyteller/selectVoice";
import { Voice, voiceSchema } from "@/storyteller/voice";
import {
  MemoryVectorIndex,
  OpenAIChatMessage,
  OpenAIChatModel,
  OpenAITextGenerationModel,
  OpenAITranscriptionModel,
  StabilityImageGenerationModel,
  ZodSchema,
  ZodStructureDefinition,
  generateImage,
  generateText,
  getAudioFileExtension,
  mapInstructionPromptToOpenAIChatFormat,
  streamStructure,
  transcribe,
} from "modelfusion";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { Endpoint } from "../server/Endpoint";

const voicesData = readFileSync("./data/voices.index.json", "utf8");

const structuredStorySchema = z.object({
  parts: z.array(narratedStoryPartSchema),
});

export const generateStoryEndpoint: Endpoint<
  z.infer<typeof storytellerEventSchema>
> = {
  name: "generate-story",

  eventSchema: storytellerEventSchema,

  async processRequest({ input: { mimetype, data: audioRecording }, run }) {
    const voiceIndex = await MemoryVectorIndex.deserialize({
      serializedData: voicesData,
      schema: new ZodSchema(voiceSchema),
    });

    // Transcribe the user voice input:
    const transcription = await transcribe(
      new OpenAITranscriptionModel({ model: "whisper-1" }),
      { type: getAudioFileExtension(mimetype), data: audioRecording },
      { functionId: "transcribe" }
    );

    run.publishEvent({ type: "transcribed-input", input: transcription });

    // Generate a story based on the transcription:
    const story = await generateText(
      new OpenAITextGenerationModel({
        model: "gpt-3.5-turbo-instruct",
        temperature: 1.2,
        maxCompletionTokens: 1000,
      }),
      [
        "Generate a story aimed at preschoolers on the following topic: ",
        `'${transcription}'.`,
      ].join("\n"),
      { functionId: "generate-story" }
    );

    // Run in parallel:
    await Promise.all([
      // Generate title:
      (async () => {
        const title = await generateText(
          new OpenAITextGenerationModel({
            model: "gpt-3.5-turbo-instruct",
            temperature: 0.7,
            maxCompletionTokens: 200,
            stopSequences: ['"'],
          }),
          [
            "Generate short title for the following story for pre-school children: ",
            "",
            `'${story}'.`,
            "",
            'Title: "',
          ].join("\n"),
          { functionId: "generate-title" }
        );

        run.publishEvent({ type: "generated-title", title });
      })(),

      // Generate image that represents story:
      (async () => {
        const imagePrompt = await generateText(
          new OpenAIChatModel({
            model: "gpt-4",
            temperature: 0,
            maxCompletionTokens: 500,
          }).withPromptFormat(mapInstructionPromptToOpenAIChatFormat()),
          {
            instruction:
              "Generate an short image generation prompt (only abstract keywords, max 8 keywords) for the following story:",
            input: story,
          },
          { functionId: "generate-story-image-prompt" }
        );

        const storyImageBase64 = await generateImage(
          new StabilityImageGenerationModel({
            model: "stable-diffusion-xl-1024-v1-0",
            cfgScale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 30,
          }),
          [
            {
              text: `${imagePrompt} style of colorful illustration for a preschooler story`,
            },
          ],
          { functionId: "generate-story-image" }
        );

        const imagePath = await run.storeDataAsset({
          name: "story.png",
          data: Buffer.from(storyImageBase64, "base64"),
          contentType: "image/png",
        });

        run.publishEvent({ type: "generated-image", path: imagePath });
      })(),

      // expand and narrate story:
      (async () => {
        const speakerToVoice = new Map<string, Voice>();
        const processedParts: Array<NarratedStoryPart> = [];

        const audioStoryFragments = await streamStructure(
          new OpenAIChatModel({
            model: "gpt-4",
            temperature: 0,
          }),
          new ZodStructureDefinition({
            name: "story",
            description: "Kids story with narration.",
            schema: structuredStorySchema,
          }),
          [
            OpenAIChatMessage.user(
              [
                "Expand the following story into a longer, narrated audio story for preschoolers.",
                "",
                "The audio story should include interesting dialogue by the main characters.",
                "The language should be understandable by a preschooler.",
                "",
                "Add details and dialoge to make the story parts longer.",
                "Add the speaker to each dialogue part. A dialogue part can only have one speaker.",
                "There must only be one narrator.",
                "Each spoken part must be a dialogue part with a speaker.",
                "",
                "Story:",
                story,
              ].join("\n")
            ),
          ],
          { functionId: "generate-audio-story" }
        );

        for await (const fragment of audioStoryFragments) {
          if (!fragment.isComplete) {
            const parseResult = structuredStorySchema
              .deepPartial()
              .safeParse(fragment.value);

            if (parseResult.success) {
              const partialParts = (parseResult.data.parts ?? [])
                // the last story part might not be complete yet:
                .slice(0, -1);

              // ensure that the remaining story parts are complete:
              const partialPartsParseResult = z
                .array(narratedStoryPartSchema)
                .safeParse(partialParts);

              if (partialPartsParseResult.success) {
                await processNewParts(partialPartsParseResult.data);
              }
            }
          } else {
            await processNewParts(fragment.value.parts);
          }
        }

        async function processNewParts(parts: NarratedStoryPart[]) {
          const newParts = parts.slice(processedParts.length);

          processedParts.push(...newParts);
          for (const part of newParts) {
            const index = processedParts.indexOf(part);
            const speaker = part.speaker;

            let voice = speakerToVoice.get(speaker);

            if (voice == null) {
              voice = await selectVoice({
                speaker,
                story,
                unavailableVoices: Array.from(speakerToVoice.values()).map(
                  (voice) => `${voice.provider}:${voice.voiceId}`
                ) as FullVoiceId[],
                voiceIndex,
              });

              speakerToVoice.set(speaker, voice);
            }

            const narrationAudio = await narrateStoryPart({ part, voice });

            const path = await run.storeDataAsset({
              name: `story-part-${index}.mp3`,
              data: narrationAudio,
              contentType: "audio/mpeg",
            });

            run.publishEvent({ type: "generated-audio-part", index, path });
          }
        }
      })(),
    ]);

    run.publishEvent({ type: "finished-generation" });
  },
};
