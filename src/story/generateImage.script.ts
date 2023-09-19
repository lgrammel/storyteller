import dotenv from "dotenv";
import {
  OpenAIChatModel,
  StabilityImageGenerationModel,
  generateImage,
  generateText,
  mapInstructionPromptToOpenAIChatFormat,
} from "modelfusion";
import fs from "node:fs";
import { generateNarrationArcExamples } from "./generateNarrationArc.examples";

dotenv.config();

async function main() {
  const story = generateNarrationArcExamples[0];
  const text = [
    story.title,
    story.introduction,
    story.risingAction,
    story.climax,
    story.fallingAction,
    story.conclusion,
  ].join("\n\n");

  // generate prompt for story:
  const imagePrompt = await generateText(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 0, // remove randomness
      maxCompletionTokens: 500, // enough tokens for prompt
    }).withPromptFormat(mapInstructionPromptToOpenAIChatFormat()),
    {
      instruction:
        "Generate an short image generation prompt (only abstract keywords, max 8 keywords) for the following story:",
      input: text,
    }
  );

  console.log(imagePrompt);

  const image = await generateImage(
    new StabilityImageGenerationModel({
      model: "stable-diffusion-xl-1024-v1-0",
      cfgScale: 7,
      clipGuidancePreset: "FAST_BLUE",
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30,
    }),
    [
      { text: imagePrompt },
      { text: "style of children story illustration", weight: 0.8 },
    ]
  );

  const path = `./stability-image-example.png`;
  fs.writeFileSync(path, Buffer.from(image, "base64"));
  console.log(`Image saved to ${path}`);
}

main().catch(console.error);
