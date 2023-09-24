import { z } from "zod";

export const applicationEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("generated-title"),
    title: z.string(),
  }),
  z.object({
    type: z.literal("generated-image"),
    image: z.string(),
  }),
  z.object({
    type: z.literal("generated-audio-part"),
    index: z.number(),
    path: z.string(),
  }),
]);

export type ApplicationEvent = z.infer<typeof applicationEventSchema>;
