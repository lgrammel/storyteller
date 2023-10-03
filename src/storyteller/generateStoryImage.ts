import {
  OpenAIChatModel,
  Run,
  StabilityImageGenerationModel,
  generateImage,
  generateText,
  mapInstructionPromptToOpenAIChatFormat,
} from "modelfusion";

export async function generateStoryImage(story: string, { run }: { run: Run }) {
  const imagePrompt = await generateText(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 0,
      maxCompletionTokens: 500,
    }).withPromptFormat(mapInstructionPromptToOpenAIChatFormat()),
    {
      instruction:
        "Generate an short image generation prompt (only abstract keywords, max 8 keywords) for the following story:",
      input: story,
    },
    { functionId: "generate-story-image-prompt", run }
  );

  return await generateImage(
    new StabilityImageGenerationModel({
      model: "stable-diffusion-xl-1024-v1-0",
      cfgScale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30,
    }),
    [
      {
        text: `${imagePrompt} style of colorful illustration for a preschooler story`,
      },
    ],
    { functionId: "generate-story-image", run }
  );
}