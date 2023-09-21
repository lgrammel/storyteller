import { readFileSync } from "fs";

export function fakeNarrateStory(path: string) {
  return readFileSync(path);
}
