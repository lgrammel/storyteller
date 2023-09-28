import {
  MemoryVectorIndex,
  OpenAITextEmbeddingModel,
  OpenAITextGenerationModel,
  VectorIndexRetriever,
  generateText,
  retrieve,
} from "modelfusion";
import { Voice, voiceSchema } from "./voice";
import { readFileSync } from "node:fs";

export type FullVoiceId = `${"lmnt" | "elevenlabs"}:${string}`;

const voicesData = readFileSync("./data/voices.index.json", "utf8");

export async function selectVoice({
  story,
  speaker,
  unavailableVoices,
}: {
  story: string;
  speaker: string;
  unavailableVoices: FullVoiceId[];
}): Promise<Voice> {
  const voicesIndex = await MemoryVectorIndex.deserialize({
    serializedData: voicesData,
    schema: voiceSchema,
  });

  // pre-determined narrator voice:
  if (speaker.toLowerCase() === "narrator") {
    return {
      voiceId: "c8ea4f2a-06e6-4d7b-9484-db941bf7c657",
      name: "Joe",
      provider: "lmnt",
      gender: "M",
      description:
        "Male voice. middle-aged. Joe's voice, warm and full-bodied with age, resonates with an inviting timbre that instills a sense of comfort and trust. It carries the kind of wisdom you would expect from a dedicated teacher or a dependable lifelong friend, always steadied with a touch of gentle authority.",
    };
  }

  // generate voice descriptions for the speakers:
  const voiceDescription = await generateText(
    new OpenAITextGenerationModel({
      model: "gpt-3.5-turbo-instruct",
      temperature: 0,
    }),
    [
      `## Task`,
      `Generate a voice description for ${speaker} from the following story for an audio book.`,
      "The voice should be appropriate for a preschooler listener.",
      "Include the gender and age in the voice description.",
      "",
      "## Story",
      story,
      "",
      "## Speaker",
      speaker,
      "",
      "## Voice description (incl. age, gender)",
    ].join("\n")
  );

  console.log(voiceDescription);

  // retrieve the voice vectors from the index:
  const retriever = new VectorIndexRetriever({
    vectorIndex: voicesIndex,
    embeddingModel: new OpenAITextEmbeddingModel({
      model: "text-embedding-ada-002",
    }),
    maxResults: 5,
    similarityThreshold: 0.2,
  });

  const potentialVoices = await retrieve(retriever, voiceDescription);

  const voice = potentialVoices.find(
    (voice) => !unavailableVoices.includes(`${voice.provider}:${voice.voiceId}`)
  );

  // TODO how to avoid / handle? reuse voices?
  if (!voice) {
    throw new Error(`No voice found for ${speaker}`);
  }

  return voice;
}
