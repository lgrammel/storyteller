import dotenv from "dotenv";
import { generateStoryExamples } from "./generateStory.examples";
import { generateTitle } from "./generateTitle";

dotenv.config();

async function main() {
  const story = generateStoryExamples[0];
  const title = await generateTitle(story);

  console.log(title);
}

main().catch(console.error);
