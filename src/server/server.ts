import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import dotenv from "dotenv";
import Fastify from "fastify";
import { setGlobalFunctionLogging } from "modelfusion";
import path from "node:path";
import { generateStoryEndpoint } from "../storyteller/generateStoryEndpoint";
import { createEndpointPlugin } from "./createEndpointPlugin";

dotenv.config();

setGlobalFunctionLogging("basic-text");

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const host = process.env.HOST;

export async function main() {
  try {
    const server = Fastify();

    await server.register(cors, {});
    await server.register(fastifyStatic, {
      root: path.join(__dirname, "..", "..", "out"),
      prefix: "/",
    });

    server.register(createEndpointPlugin({ endpoint: generateStoryEndpoint }));

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
