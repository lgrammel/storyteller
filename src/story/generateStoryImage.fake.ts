import { delay } from "@/lib/delay";
import { readFileSync } from "fs";

export async function generateStoryImageFake({
  path,
  delayInMs = 2000,
}: {
  path: string;
  delayInMs?: number;
}): Promise<string> {
  await delay(delayInMs);
  return readFileSync(path).toString("base64");
}
