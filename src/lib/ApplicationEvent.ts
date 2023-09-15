import { z } from "zod";

export const applicationEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("progress"),
    description: z.string(),
  }),
]);

export type ApplicationEvent = z.infer<typeof applicationEventSchema>;
