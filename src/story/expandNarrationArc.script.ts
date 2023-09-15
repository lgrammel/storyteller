import dotenv from "dotenv";
import { expandNarrationArc } from "./expandNarrationArc";
import { generateNarrationArcExamples } from "./generateNarrationArc.examples";

dotenv.config();

async function main() {
  const expandedStory = await expandNarrationArc(
    generateNarrationArcExamples[0]
  );

  console.log(JSON.stringify(expandedStory, null, 2));
}

main().catch(console.error);
