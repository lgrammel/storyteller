import {
  MemoryVectorIndex,
  OpenAIChatMessage,
  OpenAIChatModel,
  OpenAITextEmbeddingModel,
  Run,
  VectorIndexRetriever,
  ZodStructureDefinition,
  generateStructure,
  retrieve,
} from "modelfusion";
import { z } from "zod";
import { Voice } from "./voice";

export type FullVoiceId = `${"lmnt" | "elevenlabs"}:${string}`;

export async function selectVoice({
  story,
  speaker,
  unavailableVoices,
  voiceIndex,
}: {
  story: string;
  speaker: string;
  unavailableVoices: FullVoiceId[];
  voiceIndex: MemoryVectorIndex<Voice>;
}): Promise<Voice> {
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
  const voiceDescription = await generateStructure(
    new OpenAIChatModel({
      model: "gpt-3.5-turbo",
      temperature: 0,
    }),
    new ZodStructureDefinition({
      name: "voice",
      schema: z.object({
        gender: z.string().describe("M for male, F for female)"),
        description: z.string().describe("Voice description"),
      }),
    }),
    [
      OpenAIChatMessage.user(
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
      ),
    ],
    { functionId: "generate-voice-description" }
  );

  // retrieve the voice vectors from the index:
  const potentialVoices = await retrieve(
    new VectorIndexRetriever({
      vectorIndex: voiceIndex,
      embeddingModel: new OpenAITextEmbeddingModel({
        model: "text-embedding-ada-002",
      }),
      maxResults: 5,
      similarityThreshold: 0.2,
      filter: (indexVoice) =>
        indexVoice.provider === "elevenlabs" &&
        (["M", "F"].includes(voiceDescription.gender)
          ? indexVoice.gender === voiceDescription.gender
          : true),
    }),
    voiceDescription.description,
    { functionId: "retrieve-voice" }
  );

  const voice = potentialVoices.find(
    (voice) => !unavailableVoices.includes(`${voice.provider}:${voice.voiceId}`)
  );

  if (!voice) {
    throw new Error(`No voice found for ${speaker}`);
  }

  return voice;
}
