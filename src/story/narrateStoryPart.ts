import {
  ElevenLabsSpeechSynthesisModel,
  LmntSpeechSynthesisModel,
  Run,
  synthesizeSpeech,
} from "modelfusion";
import { NarratedStoryPart } from "./NarratedStoryPart";
import { Voice } from "./voice";

export async function narrateStoryPart(
  {
    part: { content },
    voice: { voiceId, provider },
  }: {
    part: NarratedStoryPart;
    voice: Voice;
  },
  { run }: { run: Run }
) {
  switch (provider) {
    case "lmnt":
      return synthesizeSpeech(
        new LmntSpeechSynthesisModel({ voice: voiceId }),
        content,
        { functionId: "narrate-story-part", run }
      );

    case "elevenlabs":
      return synthesizeSpeech(
        new ElevenLabsSpeechSynthesisModel({ voice: voiceId }),
        content,
        { functionId: "narrate-story-part", run }
      );

    default:
      throw new Error(`Unknown voice provider: ${provider}`);
  }
}
