import {
  ElevenLabsSpeechSynthesisModel,
  LmntSpeechSynthesisModel,
  Run,
  synthesizeSpeech,
} from "modelfusion";
import { NarratedStoryPart } from "./NarratedStoryPart";
import { Voice } from "./voice";

export async function narrateStoryPart(
  { part, voice }: { part: NarratedStoryPart; voice: Voice },
  { run }: { run: Run }
) {
  return synthesizeSpeech(getVoiceModel(voice), part.content, {
    functionId: "narrate-story-part",
    run,
  });
}

function getVoiceModel(voice: Voice) {
  switch (voice.provider) {
    case "lmnt":
      return new LmntSpeechSynthesisModel({ voice: voice.voiceId });
    case "elevenlabs":
      return new ElevenLabsSpeechSynthesisModel({ voice: voice.voiceId });
    default:
      throw new Error(`Unknown voice provider: ${voice.provider}`);
  }
}
