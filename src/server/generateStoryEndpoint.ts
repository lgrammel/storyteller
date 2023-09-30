import { applicationEventSchema } from "@/lib/ApplicationEvent";
import {
  NarratedStoryPart,
  narratedStoryPartSchema,
} from "@/story/NarratedStoryPart";
import {
  generateAudioStory,
  structuredStorySchema,
} from "@/story/generateAudioStory";
import { generateStory } from "@/story/generateStory";
import { generateStoryImage } from "@/story/generateStoryImage";
import { generateTitle } from "@/story/generateTitle";
import { narrateStoryPart } from "@/story/narrateStoryPart";
import { FullVoiceId, selectVoice } from "@/story/selectVoice";
import { Voice, voiceSchema } from "@/story/voice";
import {
  MemoryVectorIndex,
  OpenAITranscriptionModel,
  transcribe,
} from "modelfusion";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { Endpoint } from "./Endpoint";

const voicesData = readFileSync("./data/voices.index.json", "utf8");

export const generateStoryEndpoint: Endpoint<
  z.infer<typeof applicationEventSchema>
> = {
  name: "generate-story",

  eventSchema: applicationEventSchema,

  async processRequest({ input: audioRecording, publishEvent, storeAsset }) {
    const voiceIndex = await MemoryVectorIndex.deserialize({
      serializedData: voicesData,
      schema: voiceSchema,
    });

    const transcription = await transcribe(
      new OpenAITranscriptionModel({ model: "whisper-1" }),
      { type: "mp3", data: audioRecording }
    );

    publishEvent({
      type: "transcribed-input",
      input: transcription,
    });

    const story = await generateStory(transcription);

    // Run in parallel:
    await Promise.all([
      // generate title:
      (async () => {
        const title = await generateTitle(story);

        publishEvent({ type: "generated-title", title });
      })(),

      // generate image that represents story:
      (async () => {
        const storyImageBase64 = await generateStoryImage(story);

        const imagePath = await storeAsset({
          name: "story.png",
          data: Buffer.from(storyImageBase64, "base64"),
          contentType: "image/png",
        });

        publishEvent({ type: "generated-image", path: imagePath });
      })(),

      // expand and narrate story:
      (async () => {
        const audioStoryStream = await generateAudioStory(story);

        const speakerToVoice = new Map<string, Voice>();
        const processedParts: Array<NarratedStoryPart> = [];

        for await (const part of audioStoryStream) {
          if (!part.isComplete) {
            const parseResult = structuredStorySchema
              .deepPartial()
              .safeParse(part.value);

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
            await processNewParts(part.value.parts);
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

            const path = await storeAsset({
              name: `story-part-${index}.mp3`,
              data: narrationAudio,
              contentType: "audio/mpeg",
            });

            publishEvent({ type: "generated-audio-part", index, path });
          }
        }
      })(),
    ]);
  },
};
