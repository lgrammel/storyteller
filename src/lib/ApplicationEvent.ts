import { z } from "zod";

export const applicationEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("titleGenerated"),
    title: z.string(),
  }),
  z.object({
    type: z.literal("imageGenerated"),
    image: z.string(),
  }),
  z.object({
    type: z.literal("audioGenerated"),
    index: z.number(),
    path: z.string(),
  }),
]);

export type ApplicationEvent = z.infer<typeof applicationEventSchema>;
