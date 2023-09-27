import { LmntSpeechSynthesisModel, synthesizeSpeech } from "modelfusion";
import { NarratedStoryPart } from "./NarratedStoryPart";

export async function narrateStoryPart({
  storyPart,
  voiceId,
}: {
  storyPart: NarratedStoryPart;
  voiceId: string;
}) {
  return synthesizeSpeech(
    new LmntSpeechSynthesisModel({
      voice: voiceId,
    }),
    storyPart.content
  );
}
