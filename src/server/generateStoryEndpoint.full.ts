import { applicationEventSchema } from "@/lib/ApplicationEvent";
import {
  NarratedStoryPart,
  narratedStoryPartSchema,
} from "@/story/NarratedStoryPart";
import {
  expandNarrationArc,
  structuredStorySchema,
} from "@/story/expandNarrationArc";
import { generateNarrationArc } from "@/story/generateNarrationArc";
import { generateStoryImage } from "@/story/generateStoryImage";
import { generateTitle } from "@/story/generateTitle";
import { narrateStoryPart } from "@/story/narrateStoryPart";
import { selectVoice } from "@/story/selectVoice";
import { z } from "zod";
import { Endpoint } from "./Endpoint";
import { OpenAITranscriptionModel, transcribe } from "modelfusion";

export const generateStoryEndpoingFull: Endpoint<
  z.infer<typeof applicationEventSchema>
> = {
  name: "generate-story",

  eventSchema: applicationEventSchema,

  // TODO error handling
  async processRequest({ input, run }) {
    await run.storeDataAsset({
      name: `input.mp3`,
      data: input,
      contentType: "audio/mpeg",
    });

    // transcribe:
    const transcription = await transcribe(
      new OpenAITranscriptionModel({ model: "whisper-1" }),
      { type: "mp3", data: input }
    );

    await run.storeTextAsset({
      name: "topic.txt",
      contentType: "text/plain",
      text: transcription,
    });

    run.publishEvent({
      type: "transcribed-input",
      input: transcription,
    });

    // generate high-level story arc:
    const narrationArc = await generateNarrationArc(transcription);
    // const narrationArc = await generateNarrationArcFake({ index: 0 });

    await run.storeTextAsset({
      name: "narration-arc.txt",
      contentType: "text/plain",
      text: narrationArc,
    });

    // Run image generation and story expansion in parallel:
    await Promise.all([
      // generate title
      (async () => {
        const title = await generateTitle(narrationArc);

        run.publishEvent({ type: "generated-title", title });

        await run.storeTextAsset({
          name: "title.txt",
          contentType: "text/plain",
          text: title,
        });
      })(),
      // generate image that represents story:
      (async () => {
        const storyImageBase64 = await generateStoryImage(narrationArc);
        // const storyImageBase64 = await generateStoryImageFake({
        //   path: "stories/002/story-002.png",
        // });

        const imagePath = await run.storeDataAsset({
          name: "story.png",
          data: Buffer.from(storyImageBase64, "base64"),
          contentType: "image/png",
        });

        run.publishEvent({ type: "generated-image", path: imagePath });
      })(),

      // expand and narrate story:
      (async () => {
        const storyStream = await expandNarrationArc(narrationArc);
        // const storyStream = await expandNarrationArcFakeStream({
        //   delayInMs: 500,
        // });

        const processedParts: Array<NarratedStoryPart> = [];
        const speakerToVoiceId = new Map<string, string>();

        async function processNewPart(
          storyPart: NarratedStoryPart,
          index: number
        ) {
          const speaker = storyPart.speaker;

          let voiceId = speakerToVoiceId.get(speaker);
          if (voiceId == null) {
            voiceId = await selectVoice({
              speaker,
              story: narrationArc,
              unavailableVoiceIds: Array.from(speakerToVoiceId.values()),
            });
            speakerToVoiceId.set(speaker, voiceId);
          }

          const narrationAudio = await narrateStoryPart({ storyPart, voiceId });
          // const narrationAudio = await narrateStoryPartFake({
          //   path: `stories/002/story-002-${i}.mp3`,
          //   delayInMs: 250,
          // });

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

        for await (const part of storyStream) {
          if (!part.isComplete) {
            const parseResult = structuredStorySchema
              .deepPartial()
              .safeParse(part.value);

            if (parseResult.success) {
              const partialStory = parseResult.data;

              let partialStoryParts = [
                ...(partialStory.introduction ?? []),
                ...(partialStory.risingAction ?? []),
                ...(partialStory.climax ?? []),
                ...(partialStory.fallingAction ?? []),
                ...(partialStory.conclusion ?? []),
              ];

              // the last story part might not be complete yet:
              partialStoryParts = partialStoryParts.slice(0, -1);

              // the remaining story parts should be complete:
              const partsParseResult = z
                .array(narratedStoryPartSchema)
                .safeParse(partialStoryParts);

              if (partsParseResult.success) {
                const completeParts = partsParseResult.data;

                // limit to new ones:
                const newParts = completeParts.slice(processedParts.length);

                processedParts.push(...newParts);
                for (const part of newParts) {
                  await processNewPart(part, processedParts.indexOf(part));
                }
              }
            }
          } else {
            const story = part.value;

            await run.storeTextAsset({
              name: "story.json",
              contentType: "application/json",
              text: JSON.stringify(story),
            });

            const storyParts = [
              ...story.introduction,
              ...story.risingAction,
              ...story.climax,
              ...story.fallingAction,
              ...story.conclusion,
            ];

            const newParts = storyParts.slice(processedParts.length);

            processedParts.push(...newParts);
            for (const part of newParts) {
              await processNewPart(part, processedParts.indexOf(part));
            }
          }
        }
      })(),
    ]);
  },
};
