import {
  OpenAIChatMessage,
  OpenAIChatModel,
  OpenAICompletionModel,
  OpenAITranscriptionModel,
  StabilityImageGenerationModel,
  ZodStructureDefinition,
  generateImage,
  generateSpeech,
  generateText,
  generateTranscription,
  getAudioFileExtension,
  streamStructure,
} from "modelfusion";
import { DefaultFlow } from "modelfusion/fastify-server";
import { z } from "zod";
import { VoiceManager } from "./VoiceManager";
import { storytellerSchema } from "./storytellerSchema";

export const storyTellerFlow = new DefaultFlow({
  schema: storytellerSchema,
  async process({ input: { mimeType, audioData }, run }) {
    // Transcribe the user voice input:
    const transcription = await generateTranscription(
      new OpenAITranscriptionModel({ model: "whisper-1" }),
      {
        type: getAudioFileExtension(mimeType),
        data: Buffer.from(audioData, "base64"),
      },
      { functionId: "transcribe" }
    );

    run.publishEvent({ type: "transcribed-input", input: transcription });

    // Generate a story based on the transcription:
    const story = await generateText(
      new OpenAICompletionModel({
        model: "gpt-3.5-turbo-instruct",
        temperature: 1.2,
        maxCompletionTokens: 1000,
      }),
      "Generate a story aimed at preschoolers on the following topic: \n" +
        `'${transcription}'.`,
      { functionId: "generate-story" }
    );

    // Run in parallel:
    await Promise.allSettled([
      // Generate title:
      (async () => {
        const title = await generateText(
          new OpenAICompletionModel({
            model: "gpt-3.5-turbo-instruct",
            temperature: 0.7,
            maxCompletionTokens: 200,
            stopSequences: ['"'],
          }),
          "Generate a short title for the following story for pre-school children: \n\n" +
            `'${story}'.\n\n` +
            'Title: "',
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
          }).withInstructionPrompt(),
          {
            instruction:
              "Generate a short image generation prompt " +
              "(only abstract keywords, max 8 keywords) for the following story:",
            input: story,
          },
          { functionId: "generate-story-image-prompt" }
        );

        const storyImage = await generateImage(
          new StabilityImageGenerationModel({
            model: "stable-diffusion-xl-1024-v1-0",
            cfgScale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 30,
          }).withBasicPrompt(),
          `${imagePrompt} style of colorful illustration for a preschooler story`,
          { functionId: "generate-story-image" }
        );

        const imagePath = await run.storeBinaryAsset({
          name: "story.png",
          data: storyImage,
          contentType: "image/png",
        });

        run.publishEvent({ type: "generated-image", url: imagePath });
      })(),

      // expand and narrate story:
      (async () => {
        const voiceManager = await VoiceManager.fromFile({
          voicesPath: "./data/voices.index.json",
          narrator: {
            voiceId: "c8ea4f2a-06e6-4d7b-9484-db941bf7c657",
            name: "Joe",
            provider: "lmnt",
            gender: "M",
            description: "Male voice. Middle-aged.",
          },
        });

        const narratedStoryPartSchema = z.object({
          type: z
            .enum(["narration", "dialogue"])
            .describe("Type of story part. Either 'narration' or 'dialogue'."),
          speaker: z
            .string()
            .describe(
              "Speaker of a dialogue (direct speech) part. Must be a single speaker."
            ),
          content: z.string().describe("Content of the story part"),
        });

        type NarratedStoryPart = z.infer<typeof narratedStoryPartSchema>;

        const structuredStorySchema = z.object({
          parts: z.array(narratedStoryPartSchema),
        });

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

            const narrationAudio = await generateSpeech(
              await voiceManager.getSpeechModel({ speaker, story }),
              part.content,
              { functionId: "narrate-story-part" }
            );

            const path = await run.storeBinaryAsset({
              name: `story-part-${index}.mp3`,
              data: narrationAudio,
              contentType: "audio/mpeg",
            });

            run.publishEvent({
              type: "generated-audio-part",
              index,
              url: path,
            });
          }
        }
      })(),
    ]);
  },
});
