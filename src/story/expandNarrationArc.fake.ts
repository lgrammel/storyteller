import { delay } from "@/lib/delay";
import { NarratedStoryPart } from "./NarratedStoryPart";
import { expandNarrationArcExamples } from "./expandNarrationArc.examples";

export async function expandNarrationArcFake({
  index,
  delayInMs = 2000,
}: {
  index: number;
  delayInMs?: number;
}): Promise<{
  introduction: NarratedStoryPart[];
  risingAction: NarratedStoryPart[];
  climax: NarratedStoryPart[];
  fallingAction: NarratedStoryPart[];
  conclusion: NarratedStoryPart[];
}> {
  await delay(delayInMs);
  return expandNarrationArcExamples[index] as {
    introduction: NarratedStoryPart[];
    risingAction: NarratedStoryPart[];
    climax: NarratedStoryPart[];
    fallingAction: NarratedStoryPart[];
    conclusion: NarratedStoryPart[];
  };
}
