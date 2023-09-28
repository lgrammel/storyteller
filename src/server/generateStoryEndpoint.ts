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
import { selectVoice } from "@/story/selectVoice";
import { OpenAITranscriptionModel, transcribe } from "modelfusion";
import { z } from "zod";
import { Endpoint } from "./Endpoint";

export const generateStoryEndpoint: Endpoint<
  z.infer<typeof applicationEventSchema>
> = {
  name: "generate-story",

  eventSchema: applicationEventSchema,

  async processRequest({ input, run }) {
    const transcription = await transcribe(
      new OpenAITranscriptionModel({ model: "whisper-1" }),
      { type: "mp3", data: input },
      { run }
    );

    run.publishEvent({
      type: "transcribed-input",
      input: transcription,
    });

    const story = await generateStory(transcription);

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
        const audioStoryStream = await generateAudioStory(story);

        const processedParts: Array<NarratedStoryPart> = [];
        const speakerToVoiceId = new Map<string, string>();

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
            const story = part.value;

            await run.storeTextAsset({
              name: "story.json",
              contentType: "application/json",
              text: JSON.stringify(story),
            });

            await processNewParts(story.parts);
          }
        }

        async function processNewParts(parts: NarratedStoryPart[]) {
          const newParts = parts.slice(processedParts.length);

          processedParts.push(...newParts);
          for (const part of newParts) {
            const index = processedParts.indexOf(part);
            const speaker = part.speaker;

            let voiceId = speakerToVoiceId.get(speaker);

            if (voiceId == null) {
              voiceId = await selectVoice({
                speaker,
                story: story,
                unavailableVoiceIds: Array.from(speakerToVoiceId.values()),
              });

              speakerToVoiceId.set(speaker, voiceId);
            }

            const narrationAudio = await narrateStoryPart({
              storyPart: part,
              voiceId,
            });

            const path = await run.storeDataAsset({
              name: `story-part-${index}.mp3`,
              data: narrationAudio,
              contentType: "audio/mpeg",
            });

            run.publishEvent({
              type: "generated-audio-part",
              index,
              path,
            });
          }
        }
      })(),
    ]);
  },
};
