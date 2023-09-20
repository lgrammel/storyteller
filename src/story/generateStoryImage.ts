import { readFile } from "fs/promises";
import {
  OpenAIChatModel,
  StabilityImageGenerationModel,
  generateImage,
  generateText,
  mapInstructionPromptToOpenAIChatFormat,
} from "modelfusion";
import { NarrationArc } from "./generateNarrationArc";

export async function generateStoryImage(story: NarrationArc) {
  const text = [
    story.title,
    story.introduction,
    story.risingAction,
    story.climax,
    story.fallingAction,
    story.conclusion,
  ].join("\n\n");

  const imagePrompt = await generateText(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 0,
      maxCompletionTokens: 500, // enough tokens for prompt
    }).withPromptFormat(mapInstructionPromptToOpenAIChatFormat()),
    {
      instruction:
        "Generate an short image generation prompt (only abstract keywords, max 8 keywords) for the following story:",
      input: text,
    }
  );

  return await generateImage(
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
      { text: "style of illustration for a preschooler story", weight: 0.8 },
    ]
  );
}

export async function fakeGenerateStoryImage(
  imagePath: string
): Promise<string> {
  const image = await readFile(imagePath);
  return image.toString("base64");
}
