import dotenv from "dotenv";
import {
  OpenAIChatFunctionPrompt,
  OpenAIChatMessage,
  OpenAIChatModel,
  ZodStructureDefinition,
  generateStructure,
} from "modelfusion";
import { z } from "zod";

dotenv.config();

async function main() {
  const storyArch = {
    title: "List and Found",
    beginning:
      "A character loses something dear to them or gets lost themselves.",
    middle:
      "They search for the missing item or their way back home, facing mild obstacles or challenges.",
    end: "The character eventually finds what they were looking for or is found by friends/family, leading to a joyful reunion.",
  };

  const outline = await generateStructure(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 1,
    }),
    new ZodStructureDefinition({
      name: "storyOutline",
      description: "Write an outline for a kids story.",
      schema: z.object({
        title: z.string().describe("Title of the story"),
        characters: z.array(
          z.object({
            name: z.string().describe("Name of the character"),
            description: z.string().describe("Description of the character"),
            gender: z.string().optional().describe("Gender of the character"),
            age: z.number().optional().describe("Age of the character"),
            role: z
              .string()
              .optional()
              .describe("Role of the character in the story"),
            backstory: z
              .string()
              .optional()
              .describe("Backstory of the character"),
          })
        ),
        setting: z.string().describe("Setting of the story"),
        plotSummary: z.string().describe("High-level plot of the story"),
      }),
    }),
    OpenAIChatFunctionPrompt.forStructureCurried([
      OpenAIChatMessage.system(
        "You are an esteemed children's story author. " +
          "You are writing a new story for preschoolers that will be narrated as a short audio story." +
          "The target length of the story is 300-800 words. " +
          "The stroy can introduce more complex narratives, but should still have straightforward themes and structures." +
          "This is the abstract story arc that you want to use:"
      ),
      OpenAIChatMessage.functionResult(
        "abstractStoryArc",
        JSON.stringify(storyArch)
      ),
      OpenAIChatMessage.user(
        "Write the outline of a rich, detailed story about: 'a tale about an elephant and a princess exploring the world'. " +
          "The story should follow the abstract story arc above. " +
          "It should be engaging and, if possible, educational. "
      ),
    ])
  );

  console.log(JSON.stringify(outline, null, 2));
}

main().catch(console.error);
