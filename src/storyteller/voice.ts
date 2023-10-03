import { z } from "zod";

export const voiceSchema = z.object({
  provider: z.enum(["lmnt", "elevenlabs"]),
  voiceId: z.string(),
  name: z.string(),
  gender: z.enum(["M", "F"]),
  description: z.string(),
});

export type Voice = z.infer<typeof voiceSchema>;
