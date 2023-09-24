import { applicationEventSchema } from "@/lib/ApplicationEvent";
import { AsyncQueue } from "@/lib/AsyncQueue";
import { delay } from "@/lib/delay";
import {
  NarratedStoryParts,
  expandNarrationArc,
} from "@/story/expandNarrationArc";
import { expandNarrationArcExamples } from "@/story/expandNarrationArc.examples";
import { generateStoryImageFake } from "@/story/generateStoryImage.fake";
import { generateNarrationArc } from "@/story/generateNarrationArc";
import { generateNarrationArcExamples } from "@/story/generateNarrationArc.examples";
import { generateNarrationArcFake } from "@/story/generateNarrationArc.fake";
import { fakeNarrateStoryPart } from "@/story/narrateStoryPart.fake";
import { selectVoices } from "@/story/selectVoices";
import { selectVoicesExamples } from "@/story/selectVoices.examples";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import Fastify from "fastify";
import {
  LmntSpeechSynthesisModel,
  setGlobalFunctionLogging,
  synthesizeSpeech,
} from "modelfusion";
import { nanoid as createId } from "nanoid";
import { z } from "zod";
import { Endpoint } from "./Endpoint";

const schema = z.object({
  topic: z.string(),
});

export const generateStoryEndpoing: Endpoint<
  z.infer<typeof schema>,
  z.infer<typeof applicationEventSchema>
> = {
  name: "generate-story",

  inputSchema: schema,
  eventSchema: applicationEventSchema,

  async processRequest({
    input,
    storeAsset,
    publishEvent,
  }: {
    input: z.infer<typeof schema>;
    publishEvent: (event: z.infer<typeof applicationEventSchema>) => void;
    storeAsset: (options: {
      data: Buffer;
      contentType: string;
    }) => Promise<string>;
  }) {
    // generate high-level story arc
    // const narrationArc = await generateNarrationArc(input.topic);
    const narrationArc = await generateNarrationArcFake({ index: 0 });

    // TODO optionally save as asset

    publishEvent({ type: "generated-title", title: narrationArc.title });

    // TODO error handling
    // TODO parallelize

    // generate image that represents story:
    // const storyImage = await generateStoryImage(narrationArc);
    const storyImage = await generateStoryImageFake({
      path: "stories/002/story-002.png",
    });

    // TODO store as asset, get path

    publishEvent({ type: "generated-image", image: storyImage });

    // expand into story
    // const story = await expandNarrationArc(narrationArc);
    const story = expandNarrationArcExamples[0];

    await delay(2000); // delay for testing

    const storyParts = [
      ...story.introduction,
      ...story.risingAction,
      ...story.climax,
      ...story.fallingAction,
      ...story.conclusion,
    ] as NarratedStoryParts; // TODO remove

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

      const path = await storeAsset({
        data: narrationAudio,
        contentType: "audio/mpeg",
      });

      publishEvent({ type: "generated-audio-part", index: i, path });
    }
  },
};
