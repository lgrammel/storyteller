import dotenv from "dotenv";
import { generateAudioStory } from "./generateAudioStory";
import { generateStoryExamples } from "./generateStory.examples";

dotenv.config();

async function main() {
  const storyStream = await generateAudioStory(generateStoryExamples[0]);

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
