import {
  NarratedStoryPart,
  narratedStoryPartSchema,
} from "@/storyteller/NarratedStoryPart";
import { storytellerEventSchema } from "@/storyteller/StorytellerEvent";
import {
  generateAudioStory,
  structuredStorySchema,
} from "@/storyteller/generateAudioStory";
import { generateStoryImage } from "@/storyteller/generateStoryImage";
import { generateTitle } from "@/storyteller/generateTitle";
import { narrateStoryPart } from "@/storyteller/narrateStoryPart";
import { FullVoiceId, selectVoice } from "@/storyteller/selectVoice";
import { Voice, voiceSchema } from "@/storyteller/voice";
import {
  MemoryVectorIndex,
  OpenAITextGenerationModel,
  OpenAITranscriptionModel,
  ZodSchema,
  generateText,
  getAudioFileExtension,
  transcribe,
} from "modelfusion";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { Endpoint } from "../server/Endpoint";

const voicesData = readFileSync("./data/voices.index.json", "utf8");

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

    // 1. Transcribe the user voice input:
    const transcription = await transcribe(
      new OpenAITranscriptionModel({ model: "whisper-1" }),
      { type: getAudioFileExtension(mimetype), data: audioRecording },
      { functionId: "transcribe" }
    );

    run.publishEvent({
      type: "transcribed-input",
      input: transcription,
    });

    // 2. Generate a story based on the transcription:
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
      // generate title:
      (async () => {
        const title = await generateTitle(story);
        run.publishEvent({ type: "generated-title", title });
      })(),

      // generate image that represents story:
      (async () => {
        const storyImageBase64 = await generateStoryImage(story);

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

        const audioStoryFragments = await generateAudioStory(story);

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
