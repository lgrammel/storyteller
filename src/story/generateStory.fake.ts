import { delay } from "@/lib/delay";
import { generateStoryExamples } from "./generateStory.examples";

export async function generateStoryFake({
  index,
  delayInMs = 2000,
}: {
  index: number;
  delayInMs?: number;
}) {
  await delay(delayInMs);
  return generateStoryExamples[index];
}
