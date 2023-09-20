import { z } from "zod";

export const voiceSchema = z.object({
  id: z.string(),
  gender: z.enum(["M", "F"]),
  tags: z.array(z.string()),
  description: z.string(),
});

export type Voice = z.infer<typeof voiceSchema>;
