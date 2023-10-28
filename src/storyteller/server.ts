import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import dotenv from "dotenv";
import Fastify from "fastify";
import { setGlobalFunctionLogging } from "modelfusion";
import path from "node:path";
import { join } from "path";
import { FileSystemStorage } from "../server/FileSystemStorage";
import { createModelFusionFlowPlugin } from "../server/createModelFusionFlowPlugin";
import { generateStoryFlow } from "./generateStoryFlow";

dotenv.config();

setGlobalFunctionLogging("basic-text");

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const host = process.env.HOST;
const basePath = process.env.BASE_PATH || "runs";

export async function main() {
  try {
    const server = Fastify();

    await server.register(cors, {});
    await server.register(fastifyStatic, {
      root: path.join(__dirname, "..", "..", "out"),
      prefix: "/",
    });

    server.register(
      createModelFusionFlowPlugin({
        path: "/generate-story",
        flow: generateStoryFlow,
        storage: new FileSystemStorage({
          assetPath: (run) => join(basePath, run.runId, "assets"),
          logPath: (run) => join(basePath, run.runId, "logs"),
        }),
      })
    );

    console.log(`Starting server on port ${port}...`);
    await server.listen({ port, host });
    console.log("Server started");
  } catch (error) {
    console.error("Failed to start server");
    console.error(error);
    process.exit(1);
  }
}

main();
