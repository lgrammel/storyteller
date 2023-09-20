import {
  MemoryVectorIndex,
  OpenAIChatMessage,
  OpenAIChatModel,
  OpenAITextEmbeddingModel,
  VectorIndexRetriever,
  ZodStructureDefinition,
  generateStructure,
  retrieve,
} from "modelfusion";
import { voiceSchema } from "./voice";
import { voices } from "./voices";
import { z } from "zod";
import { NarratedStoryParts } from "./expandNarrationArc";

export async function selectVoices(story: {
  introduction: NarratedStoryParts;
  risingAction: NarratedStoryParts;
  climax: NarratedStoryParts;
  fallingAction: NarratedStoryParts;
  conclusion: NarratedStoryParts;
}) {
  const voicesIndex = await MemoryVectorIndex.deserialize({
    serializedData: JSON.stringify(voices),
    schema: voiceSchema,
  });

  const storyParts = [
    ...story.introduction,
    ...story.risingAction,
    ...story.climax,
    ...story.fallingAction,
    ...story.conclusion,
  ];

  // extract all unique speakers:
  const speakerSet = new Set<string>();
  for (const part of storyParts) {
    speakerSet.add(part.speaker);
  }
  const speakers = Array.from(speakerSet);

  // generate voice descriptions for the speakers:
  const voiceDescriptions = await generateStructure(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 0,
    }),
    new ZodStructureDefinition({
      name: "voices",
      description: "Voice descriptions for an audio story for kids.",
      schema: z.object(
        Object.fromEntries(
          speakers.map((speaker) => [
            speaker,
            z.object({
              gender: z.enum(["M", "F"]),
              voice: z.string(),
            }),
          ])
        )
      ),
    }),
    [
      OpenAIChatMessage.user(
        [
          "Generate voice descriptions for each speaker from the following story for an audio book.",
          "The voices should be appropriate for a preschooler listener.",
        ].join("\n")
      ),
      OpenAIChatMessage.functionResult("story", JSON.stringify(storyParts)),
    ]
  );

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

  const usedVoiceIds: string[] = [];
  const speakerToVoiceId: Record<string, string> = {};

  for (const speaker of speakers) {
    const potentialVoices = await retrieve(
      retriever,
      (voiceDescriptions[speaker].gender === "M"
        ? "Male voice. "
        : "Female voice. ") + voiceDescriptions[speaker].voice
    );

    const voice = potentialVoices.find(
      (voice) => !usedVoiceIds.includes(voice.id)
    );

    // TODO how to avoid / handle? reuse voices?
    if (!voice) {
      throw new Error(`No voice found for ${speaker}`);
    }

    usedVoiceIds.push(voice.id);
    speakerToVoiceId[speaker] = voice.id;
  }
  return speakerToVoiceId;
}
