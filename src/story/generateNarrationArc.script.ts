import { generateNarrationArc } from "@/story/generateNarrationArc";
import dotenv from "dotenv";
import { setGlobalFunctionLogging } from "modelfusion";

dotenv.config();

setGlobalFunctionLogging("detailed-object");

async function main() {
  const narrationArc = await generateNarrationArc(
    "a tale about an orphan finding a home"
  );

  console.log(JSON.stringify(narrationArc, null, 2));
}

main().catch(console.error);
