import { FastifyInstance } from "fastify";
import { withRun } from "modelfusion";
import { Flow } from "./Flow.ts.js";
import { FlowRun } from "./FlowRun.js";
import type { Storage } from "./Storage.js";

export function createModelFusionFlowPlugin<INPUT, EVENT>({
  flow,
  storage,
}: {
  flow: Flow<INPUT, EVENT>;
  storage: Storage;
}) {
  return (fastify: FastifyInstance, opts: unknown, done: () => void) => {
    const runs: Record<string, FlowRun<EVENT>> = {};

    fastify.post(`/${flow.name}`, async (request) => {
      const run = new FlowRun<EVENT>({
        flowName: flow.name,
        storage,
      });

      runs[run.runId] = run;

      // body the request body is json, parse and validate it:
      const input = flow.inputSchema.parse(request.body);

      // start longer-running process (no await):
      withRun(run, async () => {
        flow
          .process({
            input,
            run,
          })
          .catch((err) => {
            console.error(err);
          })
          .finally(async () => {
            run.finish();
          });
      });

      return {
        id: run.runId,
        path: `/${flow.name}/${run.runId}/events`,
      };
    });

    fastify.get(
      `/${flow.name}/:runId/assets/:assetName`,
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

    fastify.get(`/${flow.name}/:id/events`, async (request, reply) => {
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

    done();
  };
}
