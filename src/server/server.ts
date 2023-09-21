import { applicationEventSchema } from "@/lib/ApplicationEvent";
import { AsyncQueue } from "@/lib/AsyncQueue";
import { expandNarrationArcExamples } from "@/story/expandNarrationArc.examples";
import { fakeGenerateStoryImage } from "@/story/fakeGenerateStoryImage";
import { generateNarrationArc } from "@/story/generateNarrationArc";
import { generateNarrationArcExamples } from "@/story/generateNarrationArc.examples";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import Fastify from "fastify";
import { setGlobalFunctionLogging } from "modelfusion";
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

  async run({
    input,
    publishEvent,
  }: {
    input: z.infer<typeof schema>;
    publishEvent: (event: z.infer<typeof eventSchema>) => void;
  }) {
    // const narrationArc = await generateNarrationArc(input.topic);
    const narrationArc = generateNarrationArcExamples[0];

    publishEvent({
      type: "titleGenerated",
      title: narrationArc.title,
    });

    // TODO error handling
    // TODO parallelize
    // const storyImage = await generateStoryImage(narrationArc);
    const storyImage = await fakeGenerateStoryImage(
      "stories/002/story-002.png"
    );

    // TODO store as asset, get path

    publishEvent({
      type: "imageGenerated",
      image: storyImage,
    });
  },
};

setGlobalFunctionLogging("detailed-object");

// TODO needs to be endpoint specific
const store: Record<
  string,
  {
    eventQueue: AsyncQueue<z.infer<typeof eventSchema>>;
  }
> = {};

async function main() {
  const server = Fastify();

  await server.register(cors, {});

  server.post(`/${endpoint.name}`, async (request) => {
    const runId = createId();
    const eventQueue = new AsyncQueue<z.infer<typeof endpoint.eventSchema>>();

    store[runId] = {
      eventQueue,
    };

    // start longer-running process (no await):
    endpoint
      .run({
        input: endpoint.inputSchema.parse(request.body),
        publishEvent: (event) => {
          eventQueue.push(event);
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

  server.get(`/${endpoint.name}/:id/events`, async (request, reply) => {
    const runId = (request.params as any).id; // TODO fix

    const eventQueue = store[runId]?.eventQueue;

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
