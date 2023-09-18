import { generateNarrationArc } from "@/story/generateNarrationArc";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const narrationArcs = await generateNarrationArc(
    "a tale about an orphan finding a home"
  );

  console.log(JSON.stringify(narrationArcs, null, 2));
}

main().catch(console.error);
