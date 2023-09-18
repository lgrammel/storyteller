import dotenv from "dotenv";
import {
  ElevenLabsSpeechSynthesisModel,
  LmntSpeechSynthesisModel,
  synthesizeSpeech,
} from "modelfusion";
import fs from "node:fs";
import { expandNarrationArcExamples } from "./expandNarrationArc.examples";

dotenv.config();

async function main() {
  const story = expandNarrationArcExamples[0];
  const storyParts = [
    ...story.introduction,
    ...story.risingAction,
    ...story.climax,
    ...story.fallingAction,
    ...story.conclusion,
  ];

  // {
  //   Narrator: "pNInz6obpgDQGcFmaJgB", // Adam
  //   "Princess Poppy": "jBpfuIE2acCO8z3wKNLl", // Gigi
  //   "Ellie Elephant": "zrHiDhphv9ZnVXBqCLjz", // Mimi
  // };

  const speakerToVoice = {
    Narrator: "c8ea4f2a-06e6-4d7b-9484-db941bf7c657",
    Lily: "9db02220-4029-40f1-a807-55d645386d2b",
    "Sergeant Baize": "abb4aea5-bc72-467d-82bb-c3169a528cde",
    Bluebeak: "4e95c4a7-95aa-4b1d-bc23-00f7d1d484ea",
    "Bluebeak's Parents": "maurice",
  };

  for (let i = 0; i < storyParts.length; i++) {
    const part = storyParts[i];

    const speech = await synthesizeSpeech(
      new LmntSpeechSynthesisModel({
        voice: speakerToVoice[part.speaker as keyof typeof speakerToVoice],
      }),
      part.content
    );

    const path = `./parts/story-002-${i}.mp3`;
    fs.writeFileSync(path, speech);
  }
}

main().catch(console.error);
