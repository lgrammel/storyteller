import {
  OpenAIChatMessage,
  OpenAIChatModel,
  ZodStructureDefinition,
  generateStructure,
} from "modelfusion";
import { z } from "zod";

export const narrationArcSchema = z.object({
  title: z.string(),
  introduction: z.string(),
  risingAction: z.string(),
  climax: z.string(),
  fallingAction: z.string(),
  conclusion: z.string(),
  characters: z.array(
    z.object({
      name: z.string(),
      gender: z.string(),
      ageInYears: z.number(),
      voice: z.string().describe("Description of the character's voice."),
    })
  ),
});

export type NarrationArc = z.infer<typeof narrationArcSchema>;

export async function generateNarrationArc(topic: string) {
  return generateStructure(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 1.2,
    }),
    new ZodStructureDefinition({
      name: "narrationArcs",
      schema: narrationArcSchema,
    }),
    [
      OpenAIChatMessage.user(
        "Generate an abstract, high level narration arc for a story aimed at preschoolers for the following topic topic: " +
          `'${topic}'.`
      ),
    ]
  );
}
