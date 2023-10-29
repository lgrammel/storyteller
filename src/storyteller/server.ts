import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import dotenv from "dotenv";
import Fastify from "fastify";
import { setGlobalFunctionLogging } from "modelfusion";
import path from "node:path";
import { generateStoryFlow } from "./generateStoryFlow";
import {
  modelFusionFlowPlugin,
  FileSystemAssetStorage,
  FileSystemLogger,
} from "@modelfusion/server/fastify-plugin";

dotenv.config();

setGlobalFunctionLogging("basic-text");

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const host = process.env.HOST;
const basePath = process.env.BASE_PATH || "runs";

export async function main() {
  try {
    const fastify = Fastify();

    await fastify.register(cors, {});
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, "..", "..", "out"),
      prefix: "/",
    });

    const logger = new FileSystemLogger({
      path: (run) => path.join(basePath, run.runId, "logs"),
    });

    const assetStorage = new FileSystemAssetStorage({
      path: (run) => path.join(basePath, run.runId, "assets"),
      logger,
    });

    fastify.register(modelFusionFlowPlugin, {
      path: "/generate-story",
      flow: generateStoryFlow,
      logger,
      assetStorage,
    });

    console.log(`Starting server on port ${port}...`);
    await fastify.listen({ port, host });
    console.log("Server started");
  } catch (error) {
    console.error("Failed to start server");
    console.error(error);
    process.exit(1);
  }
}

main();
