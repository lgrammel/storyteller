import { z } from "zod";

export const narratedStoryPartSchema = z.object({
  type: z
    .enum(["narration", "dialogue"])
    .describe("Type of story part. Either 'narration' or 'dialogue'."),
  speaker: z
    .string()
    .describe(
      "Speaker of a dialogue (direct speech) part. Must be a single speaker. Set to null for narration parts."
    ),
  content: z.string().describe("Content of the story part"),
});

export type NarratedStoryPart = z.infer<typeof narratedStoryPartSchema>;
