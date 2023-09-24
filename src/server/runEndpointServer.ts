import { AsyncQueue } from "@/lib/AsyncQueue";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { nanoid as createId } from "nanoid";
import { z } from "zod";
import { Endpoint } from "./Endpoint";

export async function runEndpointServer<INPUT, EVENT>({
  endpoint,
  host = "0.0.0.0",
  port = 3001,
}: {
  endpoint: Endpoint<INPUT, EVENT>;
  host?: string;
  port?: number;
}) {
  const server = Fastify();

  await server.register(cors, {});

  const runs: Record<
    string,
    {
      eventQueue: AsyncQueue<EVENT>;
      storage: Storage;
    }
  > = {};

  type Storage = Record<
    string,
    {
      data: Buffer;
      contentType: string;
    }
  >;

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
    await server.listen({ port, host });
    console.log("Server started");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
