import dotenv from "dotenv";
import { generateNarrationArcTextExamples } from "./generateNarrationArc.examples";
import { generateTitle } from "./generateTitle";

dotenv.config();

async function main() {
  const story = generateNarrationArcTextExamples[0];
  const title = await generateTitle(story);

  console.log(title);
}

main().catch(console.error);
