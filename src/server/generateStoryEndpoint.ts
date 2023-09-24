import { applicationEventSchema } from "@/lib/ApplicationEvent";
import { expandNarrationArcFake } from "@/story/expandNarrationArc.fake";
import { generateNarrationArcFake } from "@/story/generateNarrationArc.fake";
import { generateStoryImageFake } from "@/story/generateStoryImage.fake";
import { narrateStoryPartFake } from "@/story/narrateStoryPart.fake";
import { selectVoicesExamples } from "@/story/selectVoices.examples";
import { z } from "zod";
import { Endpoint } from "./Endpoint";
import { narrateStoryPart } from "@/story/narrateStoryPart";

const inputSchema = z.object({
  topic: z.string(),
});

export const generateStoryEndpoing: Endpoint<
  z.infer<typeof inputSchema>,
  z.infer<typeof applicationEventSchema>
> = {
  name: "generate-story",

  inputSchema,
  eventSchema: applicationEventSchema,

  // TODO error handling
  async processRequest({ input, run }) {
    // generate high-level story arc:
    // const narrationArc = await generateNarrationArc(input.topic);
    const narrationArc = await generateNarrationArcFake({ index: 0 });

    await run.storeTextAsset({
      name: "narration-arc.json",
      contentType: "application/json",
      text: JSON.stringify(narrationArc),
    });

    run.publishEvent({ type: "generated-title", title: narrationArc.title });

    // Run image generation and story expansion in parallel:
    await Promise.all([
      // generate image that represents story:
      (async () => {
        // const storyImage = await generateStoryImage(narrationArc);
        const storyImageBase64 = await generateStoryImageFake({
          path: "stories/002/story-002.png",
        });

        const imagePath = await run.storeDataAsset({
          name: "story.png",
          data: Buffer.from(storyImageBase64, "base64"),
          contentType: "image/png",
        });

        run.publishEvent({ type: "generated-image", path: imagePath });
      })(),

      // expand and narrate story:
      (async () => {
        // const story = await expandNarrationArc(narrationArc);
        const story = await expandNarrationArcFake({ index: 0 });

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

        // select voices
        // const voices = await selectVoices(storyParts);
        const voices = selectVoicesExamples[0];

        // narrate the story:
        for (let i = 0; i < storyParts.length; i++) {
          const storyPart = storyParts[i];

          // const narrationAudio = await narrateStoryPart({ storyPart, voices });
          const narrationAudio = await narrateStoryPartFake({
            path: `stories/002/story-002-${i}.mp3`,
            delayInMs: 250,
          });

          const path = await run.storeDataAsset({
            name: `story-part-${i}.mp3`,
            data: narrationAudio,
            contentType: "audio/mpeg",
          });

          run.publishEvent({ type: "generated-audio-part", index: i, path });
        }
      })(),
    ]);
  },
};
