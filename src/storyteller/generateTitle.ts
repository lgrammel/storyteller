import { OpenAITextGenerationModel, Run, generateText } from "modelfusion";

export async function generateTitle(story: string) {
  return generateText(
    new OpenAITextGenerationModel({
      model: "gpt-3.5-turbo-instruct",
      temperature: 0.7,
      maxCompletionTokens: 200,
      stopSequences: ['"'],
    }),
    [
      "Generate short title for the following story for pre-school children: ",
      "",
      `'${story}'.`,
      "",
      'Title: "',
    ].join("\n"),
    { functionId: "generate-title" }
  );
}
