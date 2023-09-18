import dotenv from "dotenv";
import fs from "fs/promises";
import {
  MemoryVectorIndex,
  OpenAIChatMessage,
  OpenAIChatModel,
  OpenAITextEmbeddingModel,
  VectorIndexRetriever,
  generateStructure,
  retrieve,
} from "modelfusion";
import { z } from "zod";
import { expandNarrationArcExamples } from "./expandNarrationArc.examples";

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
    const voicesIndex = await MemoryVectorIndex.deserialize({
      serializedData: await fs.readFile("./data/voices.index.json", "utf8"),
      schema: voiceSchema,
    });

    const story = expandNarrationArcExamples[0];
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

    console.log(speakers);

    // generate voice descriptions for the speakers:
    // const voiceDescriptions = await generateStructure(
    //   new OpenAIChatModel({
    //     model: "gpt-4",
    //     temperature: 0,
    //   }),
    //   new ZodStructureDefinition({
    //     name: "voices",
    //     description: "Voice descriptions for an audio story for kids.",
    //     schema: z.object(
    //       Object.fromEntries(speakers.map((speaker) => [speaker, z.string()]))
    //     ),
    //   }),
    //   [
    //     OpenAIChatMessage.user(
    //       [
    //         "Generate voice descriptions for each speaker from the following story for an audio book.",
    //         "The voices should be appropriate for a preschooler listener.",
    //       ].join("\n")
    //     ),
    //     OpenAIChatMessage.functionResult("story", JSON.stringify(storyParts)),
    //   ]
    // );

    const voiceDescriptions: Record<string, string> = {
      Narrator:
        "A warm, soothing voice that is clear and engaging, with a gentle pace and tone that is comforting to young listeners.",
      Lily: "A soft, youthful voice full of innocence and kindness, with a hint of determination and courage.",
      "Sergeant Baize":
        "A deep, authoritative voice with a stern yet caring tone, reflecting his role as the town guard.",
      Bluebeak:
        "A high-pitched, chirpy voice that is full of curiosity and excitement, reflecting his adventurous spirit.",
      "Bluebeak's Parents":
        "Two gentle, loving voices that are filled with warmth and gratitude, reflecting their joy at being reunited with their son and welcoming Lily into their family.",
    };

    // turn the voice descriptions into an array:
    const voiceDescriptionsArray = speakers.map((speaker) => ({
      id: speaker,
      description: voiceDescriptions[speaker],
    }));

    // retrieve the voice vectors from the index:
    const retriever = new VectorIndexRetriever({
      vectorIndex: voicesIndex,
      embeddingModel: new OpenAITextEmbeddingModel({
        model: "text-embedding-ada-002",
      }),
      maxResults: 2,
      similarityThreshold: 0.2,
    });

    const result = await Promise.all(
      voiceDescriptionsArray.map(async (voiceDescription) => ({
        name: voiceDescription.id,
        voice: await retrieve(retriever, voiceDescription.description),
      }))
    );

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error reading file", err);
  }
}

main();
