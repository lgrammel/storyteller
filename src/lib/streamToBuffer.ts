import { Readable } from "stream";

export async function streamToBuffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
