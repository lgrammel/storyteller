import dotenv from "dotenv";
import fs from "node:fs";
import { generateNarrationArcTextExamples } from "./generateNarrationArc.examples";
import { generateStoryImage } from "./generateStoryImage";

dotenv.config();

async function main() {
  const story = generateNarrationArcTextExamples[0];
  const image = await generateStoryImage(story);

  const path = `./stability-image-example.png`;
  fs.writeFileSync(path, Buffer.from(image, "base64"));
  console.log(`Image saved to ${path}`);
}

main().catch(console.error);
