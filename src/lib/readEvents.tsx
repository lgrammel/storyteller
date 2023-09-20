import { AsyncQueue } from "@/lib/AsyncQueue";
import { parseEventSourceReadableStream } from "@/lib/parseEventSourceReadableStream";

export function readEvents<T>(
  stream: ReadableStream<Uint8Array>,
  schema: Zod.Schema<T>,
  options?: {
    errorHandler: (error: any) => void;
  }
): AsyncIterable<T | undefined> {
  const queue = new AsyncQueue<T | undefined>();

  // run async (no await on purpose):
  parseEventSourceReadableStream({
    stream,
    callback: {
      onClose() {
        queue.close();
      },
      onError(error) {
        options?.errorHandler(error);
        queue.close();
      },
      onEvent(event) {
        try {
          // TODO SecureJSON
          queue.push(schema.parse(JSON.parse(event.data)));
        } catch (error) {
          options?.errorHandler(error);
          queue.close();
        }
      },
    },
  });

  return queue;
}
