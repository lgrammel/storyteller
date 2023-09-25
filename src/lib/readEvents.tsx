import { AsyncQueue } from "@/lib/AsyncQueue";
import { parseEventSourceReadableStream } from "@/lib/parseEventSourceReadableStream";
import SecureJSON from "secure-json-parse";

export function readEvents<T>(
  stream: ReadableStream<Uint8Array>,
  schema: Zod.Schema<T>,
  options?: {
    errorHandler: (error: any) => void;
  }
): AsyncIterable<T> {
  const queue = new AsyncQueue<T>();

  // run async (no await on purpose):
  parseEventSourceReadableStream({ stream })
    .then(async (events) => {
      try {
        for await (const event of events) {
          queue.push(schema.parse(SecureJSON.parse(event.data)));
        }
      } catch (error) {
        options?.errorHandler(error);
      } finally {
        queue.close();
      }
    })
    .catch((error) => {
      options?.errorHandler(error);
      queue.close();
    });

  return queue;
}
