import {
  ElevenLabsSpeechSynthesisModel,
  LmntSpeechSynthesisModel,
  synthesizeSpeech,
} from "modelfusion";
import { NarratedStoryPart } from "./NarratedStoryPart";
import { Voice } from "./voice";

export async function narrateStoryPart({
  part,
  voice,
}: {
  part: NarratedStoryPart;
  voice: Voice;
}) {
  return synthesizeSpeech(
    voice.provider === "elevenlabs"
      ? new ElevenLabsSpeechSynthesisModel({
          voice: voice.voiceId,
        })
      : new LmntSpeechSynthesisModel({
          voice: voice.voiceId,
        }),
    part.content
  );
}
