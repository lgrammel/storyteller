import dotenv from "dotenv";
import fs from "fs/promises";
import {
  MemoryVectorIndex,
  OpenAITextEmbeddingModel,
  upsertIntoVectorIndex,
} from "modelfusion";
import { z } from "zod";

dotenv.config();

const voiceSchema = z.object({
  id: z.string(),
  gender: z.enum(["M", "F"]),
  tags: z.array(z.string()),
  description: z.string(),
});

type Voice = z.infer<typeof voiceSchema>;

async function main() {
  try {
    const data = await fs.readFile("./data/voices.json", "utf8");
    const voices: Voice[] = Object.values(JSON.parse(data).voices);

    const vectorIndex = new MemoryVectorIndex<Voice>();

    await upsertIntoVectorIndex({
      vectorIndex,
      embeddingModel: new OpenAITextEmbeddingModel({
        model: "text-embedding-ada-002",
      }),
      objects: voices,
      getValueToEmbed: (voice) =>
        (voice.gender === "M" ? "Male voice. " : "Female voice. ") +
        voice.description,
    });

    await fs.writeFile("./data/voices.index.json", vectorIndex.serialize());
  } catch (err) {
    console.error("Error reading file", err);
  }
}

main();
