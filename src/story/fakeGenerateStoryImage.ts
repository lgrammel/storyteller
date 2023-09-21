import { readFileSync } from "fs";

export async function fakeGenerateStoryImage(path: string): Promise<string> {
  return readFileSync(path).toString("base64");
}
