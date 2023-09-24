import { delay } from "@/lib/delay";
import { generateNarrationArcExamples } from "./generateNarrationArc.examples";

export async function generateNarrationArcFake({
  index,
  delayInMs = 2000,
}: {
  index: number;
  delayInMs?: number;
}) {
  await delay(delayInMs);
  return generateNarrationArcExamples[index];
}
