import {
  MemoryVectorIndex,
  OpenAITextEmbeddingModel,
  OpenAITextGenerationModel,
  VectorIndexRetriever,
  generateText,
  retrieve,
} from "modelfusion";
import { voiceSchema } from "./voice";
import { voices } from "./voices";

export async function selectVoice({
  story,
  speaker,
  unavailableVoiceIds,
}: {
  story: string;
  speaker: string;
  unavailableVoiceIds: string[];
}): Promise<string> {
  const voicesIndex = await MemoryVectorIndex.deserialize({
    serializedData: JSON.stringify(voices),
    schema: voiceSchema,
  });

  // generate voice descriptions for the speakers:
  const voiceDescription = await generateText(
    new OpenAITextGenerationModel({
      model: "gpt-3.5-turbo-instruct",
      temperature: 0,
      stopSequences: ['"'],
    }),
    [
      `Generate a voice description for ${speaker} from the following story for an audio book.`,
      "The voice should be appropriate for a preschooler listener.",
      "Include the gender and age in the voice description.",
      "",
      `Story: ${story}`,
      "",
      'Voice description: "',
    ].join("\n")
  );

  console.log(voiceDescription);

  // retrieve the voice vectors from the index:
  // TODO need to be able to segment male / female voices via pre-filtering
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
    (voice) => !unavailableVoiceIds.includes(voice.id)
  );

  // TODO how to avoid / handle? reuse voices?
  if (!voice) {
    throw new Error(`No voice found for ${speaker}`);
  }

  return voice.id;
}
