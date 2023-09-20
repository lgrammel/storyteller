import dotenv from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";

dotenv.config();

async function main() {
  const image = readFileSync("stories/000.png");
  const base64 = image.toString("base64");

  writeFileSync("output.txt", base64);
}

main().catch(console.error);
