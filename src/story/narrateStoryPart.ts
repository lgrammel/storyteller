import { LmntSpeechSynthesisModel, synthesizeSpeech } from "modelfusion";
import { NarratedStoryPart } from "./NarratedStoryPart";

export async function narrateStoryPart({
  storyPart,
  voices,
}: {
  storyPart: NarratedStoryPart;
  voices: Record<string, string>;
}) {
  return synthesizeSpeech(
    new LmntSpeechSynthesisModel({
      voice: voices[storyPart.speaker as keyof typeof voices],
    }),
    storyPart.content
  );
}
