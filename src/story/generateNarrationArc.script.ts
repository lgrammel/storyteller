import { generateNarrationArc } from "@/story/generateNarrationArc";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const narrationArcs = await generateNarrationArc(
    "a tale about a prince and a pirate finding a great treasure"
  );

  console.log(JSON.stringify(narrationArcs, null, 2));
}

main().catch(console.error);
