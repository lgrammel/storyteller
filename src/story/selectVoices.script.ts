import dotenv from "dotenv";
import fs from "fs/promises";
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
    //       Object.fromEntries(
    //         speakers.map((speaker) => [
    //           speaker,
    //           z.object({
    //             gender: z.enum(["M", "F"]),
    //             voice: z.string(),
    //           }),
    //         ])
    //       )
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

    // console.log(JSON.stringify(voiceDescriptions, null, 2));

    const voiceDescriptions: Record<
      string,
      {
        gender: "M" | "F";
        voice: string;
      }
    > = {
      Narrator: {
        gender: "M",
        voice:
          "A warm, soothing voice with a gentle pace, perfect for storytelling. The voice should be clear and articulate, with a friendly tone that can express a range of emotions.",
      },
      Lily: {
        gender: "F",
        voice:
          "A soft, youthful voice that reflects her innocence and kindness. The voice should be high-pitched, but not squeaky, with a cheerful undertone.",
      },
      "Sergeant Baize": {
        gender: "M",
        voice:
          "A deep, authoritative voice that reflects his role as a guard. The voice should be firm but not scary, with a hint of gruffness.",
      },
      Bluebeak: {
        gender: "M",
        voice:
          "A light, chirpy voice that reflects his small size and bird-like nature. The voice should be high-pitched and lively, with a playful undertone.",
      },
      "Bluebeak's Parents": {
        gender: "M",
        voice:
          "A pair of voices that are warm and loving, reflecting their parental role. The voices should be gentle and comforting, with a tone of gratitude and joy.",
      },
    };

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

    console.log(JSON.stringify(speakerToVoiceId, null, 2));

    // {
    //   "Narrator": "c8ea4f2a-06e6-4d7b-9484-db941bf7c657",
    //   "Lily": "9db02220-4029-40f1-a807-55d645386d2b",
    //   "Sergeant Baize": "abb4aea5-bc72-467d-82bb-c3169a528cde",
    //   "Bluebeak": "4e95c4a7-95aa-4b1d-bc23-00f7d1d484ea",
    //   "Bluebeak's Parents": "maurice"
    // }
  } catch (err) {
    console.error("Error reading file", err);
  }
}

main();
