import dotenv from "dotenv";
import { setGlobalFunctionLogging } from "modelfusion";
import { generateStoryEndpoing } from "./generateStoryEndpoint";
import { runEndpointServer } from "./runEndpointServer";

dotenv.config();

setGlobalFunctionLogging("detailed-object");

runEndpointServer({
  endpoint: generateStoryEndpoing,
  port: +(process.env.PORT ?? "3001"),
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
