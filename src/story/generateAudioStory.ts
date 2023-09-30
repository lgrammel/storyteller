import {
  OpenAIChatMessage,
  OpenAIChatModel,
  ZodStructureDefinition,
  streamStructure,
} from "modelfusion";
import { z } from "zod";
import { narratedStoryPartSchema } from "./NarratedStoryPart";

export const structuredStorySchema = z.object({
  parts: z.array(narratedStoryPartSchema),
});

export type StructuredStory = z.infer<typeof structuredStorySchema>;

export async function generateAudioStory(story: string) {
  return streamStructure(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 0,
    }),
    new ZodStructureDefinition({
      name: "story",
      description: "Kids story with narration.",
      schema: structuredStorySchema,
    }),
    [
      OpenAIChatMessage.user(
        [
          "Expand the following story into a longer, narrated audio story for preschoolers.",
          "",
          "The audio story should include interesting dialogue by the main characters.",
          "The language should be understandable by a preschooler.",
          "",
          "Add details and dialoge to make the story parts longer.",
          "Add the speaker to each dialogue part. A dialogue part can only have one speaker.",
          "There must only be one narrator.",
          "Each spoken part must be a dialogue part with a speaker.",
          "",
          "Story:",
          story,
        ].join("\n")
      ),
    ]
  );
}
