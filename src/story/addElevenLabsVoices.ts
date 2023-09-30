import fs from "fs/promises";
import {
  MemoryVectorIndex,
  OpenAITextEmbeddingModel,
  upsertIntoVectorIndex,
} from "modelfusion";
import { Voice } from "./voice";
import { ElevenLabsVoice } from "./prepareVoices.script";

export async function addElevenLabsVoices(
  vectorIndex: MemoryVectorIndex<Voice>
) {
  const data = await fs.readFile("./data/voices.11labs.json", "utf8");
  const elevenLabsVoices: ElevenLabsVoice[] = Object.values(
    JSON.parse(data).voices
  );

  const voices: Voice[] = elevenLabsVoices
    .filter((voice) => {
      return voice.labels.age !== "old";
    })

    .map((voice) => ({
      voiceId: voice.voice_id,
      name: voice.name,
      provider: "elevenlabs",
      gender: voice.labels.gender === "female" ? "F" : "M",
      description: Object.entries(voice.labels)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", "),
    }));

  await upsertIntoVectorIndex({
    vectorIndex,
    embeddingModel: new OpenAITextEmbeddingModel({
      model: "text-embedding-ada-002",
    }),
    objects: voices,
    getValueToEmbed: (voice) => voice.description,
  });
}
