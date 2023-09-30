import {
  ElevenLabsSpeechSynthesisModel,
  LmntSpeechSynthesisModel,
  synthesizeSpeech,
} from "modelfusion";
import { NarratedStoryPart } from "./NarratedStoryPart";
import { Voice } from "./voice";

export async function narrateStoryPart({
  part: { content },
  voice: { voiceId, provider },
}: {
  part: NarratedStoryPart;
  voice: Voice;
}) {
  switch (provider) {
    case "lmnt":
      return synthesizeSpeech(
        new LmntSpeechSynthesisModel({ voice: voiceId }),
        content
      );

    case "elevenlabs":
      return synthesizeSpeech(
        new ElevenLabsSpeechSynthesisModel({ voice: voiceId }),
        content
      );

    default:
      throw new Error(`Unknown voice provider: ${provider}`);
  }
}
