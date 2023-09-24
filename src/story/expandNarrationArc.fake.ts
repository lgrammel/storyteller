import { delay } from "@/lib/delay";
import { expandNarrationArcExamples } from "./expandNarrationArc.examples";
import { NarratedStoryParts } from "./expandNarrationArc";

export async function expandNarrationArcFake({
  index,
  delayInMs = 2000,
}: {
  index: number;
  delayInMs?: number;
}): Promise<{
  introduction: NarratedStoryParts;
  risingAction: NarratedStoryParts;
  climax: NarratedStoryParts;
  fallingAction: NarratedStoryParts;
  conclusion: NarratedStoryParts;
}> {
  await delay(delayInMs);
  return expandNarrationArcExamples[index] as {
    introduction: NarratedStoryParts;
    risingAction: NarratedStoryParts;
    climax: NarratedStoryParts;
    fallingAction: NarratedStoryParts;
    conclusion: NarratedStoryParts;
  };
}
