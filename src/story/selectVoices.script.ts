import dotenv from "dotenv";
import { expandNarrationArcExamples } from "./expandNarrationArc.examples";
import { selectVoices } from "./selectVoices";
import { NarratedStoryPart } from "./NarratedStoryPart";

dotenv.config();

async function main() {
  try {
    const story = expandNarrationArcExamples[0];

    const storyParts = [
      ...story.introduction,
      ...story.risingAction,
      ...story.climax,
      ...story.fallingAction,
      ...story.conclusion,
    ] as NarratedStoryPart[];

    const speakerToVoiceId = await selectVoices(storyParts);

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
