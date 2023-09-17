import dotenv from "dotenv";
import {
  expandNarrationArc,
  expandNarrationArc2,
  expandNarrationArcText,
} from "./expandNarrationArc";
import { generateNarrationArcExamples } from "./generateNarrationArc.examples";

dotenv.config();

async function main() {
  const expandedStory = await expandNarrationArc2(
    generateNarrationArcExamples[0]
  );

  console.log(JSON.stringify(expandedStory, null, 2));
  // for await (const textFragment of expandedStory) {
  //   process.stdout.write(textFragment);
  // }
}

main().catch(console.error);
