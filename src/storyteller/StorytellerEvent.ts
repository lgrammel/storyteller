import { z } from "zod";

export const storytellerEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("transcribed-input"),
    input: z.string(),
  }),
  z.object({
    type: z.literal("generated-title"),
    title: z.string(),
  }),
  z.object({
    type: z.literal("generated-image"),
    path: z.string(),
  }),
  z.object({
    type: z.literal("generated-audio-part"),
    index: z.number(),
    path: z.string(),
  }),
  z.object({
    type: z.literal("finished-generation"),
  }),
]);

export type StorytellerEvent = z.infer<typeof storytellerEventSchema>;
