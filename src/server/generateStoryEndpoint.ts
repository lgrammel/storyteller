import { applicationEventSchema } from "@/lib/ApplicationEvent";
import { expandNarrationArcFake } from "@/story/expandNarrationArc.fake";
import { generateNarrationArcFake } from "@/story/generateNarrationArc.fake";
import { generateStoryImageFake } from "@/story/generateStoryImage.fake";
import { fakeNarrateStoryPart } from "@/story/narrateStoryPart.fake";
import { selectVoicesExamples } from "@/story/selectVoices.examples";
import { z } from "zod";
import { Endpoint } from "./Endpoint";

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

  async processRequest({ input, run }) {
    // generate high-level story arc
    // const narrationArc = await generateNarrationArc(input.topic);
    const narrationArc = await generateNarrationArcFake({ index: 0 });

    await run.storeTextAsset({
      name: "narration-arc.json",
      contentType: "application/json",
      text: JSON.stringify(narrationArc),
    });

    run.publishEvent({ type: "generated-title", title: narrationArc.title });

    // TODO error handling
    // TODO parallelize

    // generate image that represents story:
    // const storyImage = await generateStoryImage(narrationArc);
    const storyImage = await generateStoryImageFake({
      path: "stories/002/story-002.png",
    });

    // TODO store as asset, get path

    run.publishEvent({ type: "generated-image", image: storyImage });

    // expand into story
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

      // const narration: Buffer = await synthesizeSpeech(
      //   new LmntSpeechSynthesisModel({
      //     voice: voices[part.speaker as keyof typeof voices],
      //   }),
      //   part.content
      // );
      const narrationAudio = await fakeNarrateStoryPart({
        path: `stories/002/story-002-${i}.mp3`,
        delayInMs: 1000,
      });

      const path = await run.storeDataAsset({
        name: `story-part-${i}.mp3`,
        data: narrationAudio,
        contentType: "audio/mpeg",
      });

      run.publishEvent({ type: "generated-audio-part", index: i, path });
    }

    // TODO should not be part of the run (but handled by server)
    await run.saveAssets();
  },
};
