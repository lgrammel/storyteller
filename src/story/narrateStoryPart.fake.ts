import { delay } from "@/lib/delay";
import { readFileSync } from "fs";

export async function fakeNarrateStoryPart({
  path,
  delayInMs = 2000,
}: {
  path: string;
  delayInMs?: number;
}) {
  await delay(delayInMs);
  return readFileSync(path);
}
