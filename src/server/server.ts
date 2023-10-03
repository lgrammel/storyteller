import dotenv from "dotenv";
import { setGlobalFunctionLogging } from "modelfusion";
import { generateStoryEndpoint } from "./generateStoryEndpoint";
import { runEndpointServer } from "./runEndpointServer";

dotenv.config();

setGlobalFunctionLogging("basic-text");

runEndpointServer({
  endpoint: generateStoryEndpoint,
  port: +(process.env.PORT ?? "3001"),
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
