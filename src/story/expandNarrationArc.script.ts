import dotenv from "dotenv";
import { expandNarrationArc } from "./expandNarrationArc";
import { generateNarrationArcTextExamples } from "./generateNarrationArc.examples";

dotenv.config();

async function main() {
  const storyStream = await expandNarrationArc(
    generateNarrationArcTextExamples[0]
  );

  for await (const part of storyStream) {
    if (!part.isComplete) {
      const unknownPartialStructure = part.value;
      console.log("partial value", unknownPartialStructure);
    } else {
      const fullyTypedStructure = part.value;
      console.log("final value", fullyTypedStructure);
    }
  }
}

main().catch(console.error);
