import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { Endpoint } from "./Endpoint";
import { EndpointRun } from "./EndpointRun";
import { saveEndpointRunAssets } from "./saveEndpointRunAssets";
import { Readable } from "stream";

async function streamToBuffer(readable: Readable) {
  let chunks = [];
  for await (let chunk of readable) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function runEndpointServer<EVENT>({
  endpoint,
  host = "0.0.0.0",
  port = 3001,
}: {
  endpoint: Endpoint<EVENT>;
  host?: string;
  port?: number;
}) {
  const server = Fastify();

  await server.register(cors, {});
  await server.register(multipart, {});

  const runs: Record<string, EndpointRun<EVENT>> = {};

  server.post(`/${endpoint.name}`, async (request) => {
    // load audio input into buffer:
    const data = await request.file();
    if (data == null) {
      throw new Error("No file provided");
    }
    const file = data.file;
    const buffer = await streamToBuffer(file);

    const run = new EndpointRun<EVENT>({
      endpointName: endpoint.name,
    });

    runs[run.runId] = run;

    // start longer-running process (no await):
    endpoint
      .processRequest({
        input: buffer, // endpoint.inputSchema.parse(request.body),
        storeAsset: async (asset) => {
          return run.storeDataAsset(asset);
        },
        publishEvent: (event) => {
          run.publishEvent(event);
        },
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(async () => {
        run.finish();

        try {
          await saveEndpointRunAssets({
            basePath: "stories",
            run,
          });
        } catch (err) {
          console.error(err);
        }
      });

    return {
      id: run.runId,
      path: `/${endpoint.name}/${run.runId}/events`,
    };
  });

  server.get(
    `/${endpoint.name}/:runId/assets/:assetName`,
    async (request, reply) => {
      const runId = (request.params as any).runId;
      const assetName = (request.params as any).assetName;

      const asset = runs[runId]?.assets[assetName];

      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Length": asset.data.length,
        "Content-Type": asset.contentType,
        "Cache-Control": "no-cache",
      };

      reply.raw.writeHead(200, headers);

      reply.raw.write(asset.data);
      reply.raw.end();
    }
  );

  server.get(`/${endpoint.name}/:id/events`, async (request, reply) => {
    const runId = (request.params as any).id;

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
    server.log.error("Failed to start server");
    server.log.error(err);
    process.exit(1);
  }
}
