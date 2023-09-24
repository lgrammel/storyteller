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

dotenv.config();

const port = +(process.env.PORT ?? "3001");

// report progress
// generate / access assets (exposed vs internal)
// inline assets (e.g. title)?
// named assets?

const schema = z.object({
  topic: z.string(),
});

const eventSchema = applicationEventSchema;

const endpoint = {
  name: "generate-story",

  inputSchema: schema,
  eventSchema,

  async processRequest({
    input,
    storeAsset,
    publishEvent,
  }: {
    input: z.infer<typeof schema>;
    publishEvent: (event: z.infer<typeof eventSchema>) => void;
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

setGlobalFunctionLogging("detailed-object");

// TODO needs to be endpoint specific

type Storage = Record<
  string,
  {
    data: Buffer;
    contentType: string;
  }
>;

const runs: Record<
  string,
  {
    eventQueue: AsyncQueue<z.infer<typeof eventSchema>>;
    storage: Storage;
  }
> = {};

async function main() {
  const server = Fastify();

  await server.register(cors, {});

  server.post(`/${endpoint.name}`, async (request) => {
    const runId = createId();

    const eventQueue = new AsyncQueue<z.infer<typeof endpoint.eventSchema>>();
    const storage: Storage = {};

    runs[runId] = {
      eventQueue,
      storage,
    };

    // start longer-running process (no await):
    endpoint
      .processRequest({
        input: endpoint.inputSchema.parse(request.body),
        publishEvent: (event) => {
          eventQueue.push(event);
        },
        storeAsset: async (options: { data: Buffer; contentType: string }) => {
          const id = createId();
          storage[id] = options;
          return `/${endpoint.name}/${runId}/assets/${id}`;
        },
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        eventQueue.close();
      });

    return {
      id: runId,
      path: `/${endpoint.name}/${runId}/events`,
    };
  });

  server.get(
    `/${endpoint.name}/:runId/assets/:assetId`,
    async (request, reply) => {
      const runId = (request.params as any).runId; // TODO fix
      const assetId = (request.params as any).assetId; // TODO fix

      const asset = runs[runId]?.storage[assetId];

      // TODO errors
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Length": asset.data.length,
        "Content-Type": asset.contentType,
        "Cache-Control": "no-cache", // TODO
      };

      reply.raw.writeHead(200, headers);

      reply.raw.write(asset.data);
      reply.raw.end();
    }
  );

  server.get(`/${endpoint.name}/:id/events`, async (request, reply) => {
    const runId = (request.params as any).id; // TODO fix

    const eventQueue = runs[runId]?.eventQueue;

    if (!eventQueue) {
      return {
        error: `No event queue found for run ID ${runId}`,
      };
    }

    const headers = {
      "Access-Control-Allow-Origin": "*",

      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      "Content-Encoding": "none",
    };

    reply.raw.writeHead(200, headers);

    const textEncoder = new TextEncoder();
    for await (const event of eventQueue) {
      if (event == null) {
        continue;
      }

      if (reply.raw.destroyed) {
        console.log("client disconnected");
        break;
      }

      const text = textEncoder.encode(`data: ${JSON.stringify(event)}\n\n`);

      reply.raw.write(text);
    }

    reply.raw.end();
  });

  try {
    console.log(`Starting server on port ${port}...`);
    await server.listen({ port, host: "0.0.0.0" });
    console.log("Server started");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
