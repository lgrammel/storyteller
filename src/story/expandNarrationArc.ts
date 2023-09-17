import {
  OpenAIChatMessage,
  OpenAIChatModel,
  ZodStructureDefinition,
  generateStructure,
  streamText,
} from "modelfusion";
import { z } from "zod";
import { NarrationArc } from "./generateNarrationArc";

const narratedStoryPartsSchema = z.array(
  z.object({
    type: z
      .enum(["narration", "dialogue"])
      .describe("Type of story part. Either 'narration' or 'dialogue'."),
    speaker: z
      .string()
      .optional()
      .nullable()
      .describe(
        "Speaker of a dialogue (direct speech) part. Must be a single speaker. Set to null for narration parts."
      ),
    content: z.string().describe("Content of the story part"),
  })
);

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
        introduction: narratedStoryPartsSchema,
        risingAction: narratedStoryPartsSchema,
        climax: narratedStoryPartsSchema,
        fallingAction: narratedStoryPartsSchema,
        conclusion: narratedStoryPartsSchema,
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

export async function expandNarrationArc2(narrationArc: NarrationArc) {
  return generateStructure(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 0,
    }),
    new ZodStructureDefinition({
      name: "story",
      description: "Kids story with narration.",
      schema: z.object({
        introduction: narratedStoryPartsSchema.describe(
          "Introduction. 50 - 150 words."
        ),
        risingAction: narratedStoryPartsSchema.describe(
          "Rising action. 300 - 400 words."
        ),
        climax: narratedStoryPartsSchema.describe("Climax. 300 - 400 words."),
        fallingAction: narratedStoryPartsSchema.describe(
          "Falling action. 200 - 300 words."
        ),
        conclusion: narratedStoryPartsSchema.describe(
          "Conclusion. 100 - 200 words."
        ),
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

export async function expandNarrationArcText(narrationArc: NarrationArc) {
  return streamText(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 1,
    }),
    [
      OpenAIChatMessage.user(
        [
          "Expand the following narration arc into a story.",
          "The language should be understandable by a preschooler.",
          "It should be a audio story with narrative and dialogue by the main characters.",
          "",
          "Use the following lengths:",
          "- introduction: 50-150 words",
          "- rising action: 300-400 words",
          "- climax: 300-400 words",
          "- falling action: 200-300 words",
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
