import {
  OpenAIChatMessage,
  OpenAIChatModel,
  ZodStructureDefinition,
  generateStructure,
} from "modelfusion";
import { z } from "zod";
import { narratedStoryPartSchema } from "./NarratedStoryPart";
import { NarrationArc } from "./generateNarrationArc";

export async function expandNarrationArc(narrationArc: NarrationArc) {
  return generateStructure(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 0,
    }),
    new ZodStructureDefinition({
      name: "story",
      description: "Kids story with narration.",
      schema: z.object({
        introduction: z
          .array(narratedStoryPartSchema)
          .describe("Introduction. 50 - 150 words."),
        risingAction: z
          .array(narratedStoryPartSchema)
          .describe("Rising action. 300 - 400 words."),
        climax: z
          .array(narratedStoryPartSchema)
          .describe("Climax. 300 - 400 words."),
        fallingAction: z
          .array(narratedStoryPartSchema)
          .describe("Falling action. 200 - 300 words."),
        conclusion: z
          .array(narratedStoryPartSchema)
          .describe("Conclusion. 100 - 200 words."),
      }),
    }),
    [
      OpenAIChatMessage.user(
        [
          "Expand the following narration arc into a narrated audio story for preschoolers.",
          "The audio story should include dialogue by the main characters.",
          "The language should be understandable by a preschooler.",
          "Add the speaker to each dialogue part. A dialogue part can only have one speaker.",
          "",
          "Use the following target lengths and hints for the different story parts:",
          "- introduction: 50-150 words.",
          "- rising action: 500-800 words.",
          "- climax: 400-600 words.",
          "- falling action: 300-400 words",
          "- conclusion: 100-200 words",
          "",
        ].join("\n")
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
