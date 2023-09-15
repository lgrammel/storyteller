import {
  OpenAIChatMessage,
  OpenAIChatModel,
  ZodStructureDefinition,
  generateStructure,
} from "modelfusion";
import { z } from "zod";
import { NarrationArc } from "./generateNarrationArc";

export async function expandNarrationArc(narrationArc: NarrationArc) {
  return generateStructure(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 1,
    }),
    new ZodStructureDefinition({
      name: "story",
      description: "Kids story with narration.",
      schema: z.object({
        storyParts: z.array(
          z.object({
            type: z.string().describe("narration OR dialogue (direct speech)"),
            speaker: z
              .string()
              .optional()
              .nullable()
              .describe(
                "Speaker of a dialogue (direct speech) part. Set to null for narration parts."
              ),
            content: z.string().describe("Content of the story part"),
          })
        ),
      }),
    }),
    [
      OpenAIChatMessage.user(
        "Expand the following narration arc into a rich, detailed story story for preschoolers that will be narrated as a short audio story." +
          "The story can introduce more complex narratives, but should still have straightforward themes and structures." +
          "The target length of the story is 1200 words. " +
          "The language should be understandable by a preschooler. " +
          "Add the speaker to each dialogue part. A dialogue part can only have one speaker."
      ),
      OpenAIChatMessage.functionResult(
        "narrationArc",
        JSON.stringify({
          introduction: narrationArc.introduction,
          risingAction: narrationArc.risingAction,
          climax: narrationArc.climax,
          fallingAction: narrationArc.fallingAction,
          conclusion: narrationArc.conclusion,
        })
      ),
    ]
  );
}
