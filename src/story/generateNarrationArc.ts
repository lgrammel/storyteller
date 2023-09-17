import {
  OpenAIChatMessage,
  OpenAIChatModel,
  ZodStructureDefinition,
  generateStructure,
} from "modelfusion";
import { z } from "zod";

export const narrationArcSchema = z.object({
  title: z.string(),
  introduction: z
    .string()
    .describe(
      "Introduction. The setting, main characters, and basic situation are introduced. " +
        "It sets the stage for the reader or listener and provides context for the upcoming events. " +
        "Keep it simple and engaging. " +
        "Use clear, descriptive language, and establish the setting and characters."
    ),
  risingAction: z
    .string()
    .describe(
      "This section introduces complications and builds suspense. " +
        "It's where the main character begins to face challenges or obstacles. " +
        "Events become more tense or complicated. " +
        "Use repetitive structures or familiar patterns to make it easy to follow."
    ),
  climax: z
    .string()
    .describe(
      "This is the turning point of the story. " +
        "The main character faces their most significant challenge, and the outcome is uncertain. " +
        "It's the most exciting and emotional part of the story. " +
        "Keep it straightforward and not too intense. " +
        "The climax should be easily recognizable but age-appropriate in its tension."
    ),
  fallingAction: z
    .string()
    .describe(
      "This section wraps up the main events post-climax and leads towards the story's resolution. " +
        "Conflicts are resolved, and loose ends are tied up. " +
        "This is a great place to affirm positive messages or lessons."
    ),
  conclusion: z
    .string()
    .describe(
      "This is the final part of the story, where everything concludes, and the story reaches a sense of closure. " +
        "Aim for a comforting and positive end. Reiterate the main lesson or moral if there is one. "
    ),
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
        "Generate a narration arc for an audio story aimed at preschoolers on the following topic: " +
          `'${topic}'.`
      ),
    ]
  );
}
