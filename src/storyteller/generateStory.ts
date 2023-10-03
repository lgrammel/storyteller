import { OpenAITextGenerationModel, Run, generateText } from "modelfusion";

export async function generateStory(topic: string, { run }: { run: Run }) {
  return generateText(
    new OpenAITextGenerationModel({
      model: "gpt-3.5-turbo-instruct",
      temperature: 1.2,
      maxCompletionTokens: 1000,
    }),
    [
      "Generate a story aimed at preschoolers on the following topic: ",
      `'${topic}'.`,
    ].join("\n"),
    { functionId: "generate-story", run }
  );
}