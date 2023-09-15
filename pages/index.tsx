import { AsyncQueue } from "@/lib/AsyncQueue";
import { parseEventSourceReadableStream } from "@/lib/parseEventSourceReadableStream";
import { z } from "zod";

export default function Home() {
  const handleSend = async () => {
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "",
      });

      const events = readEvents(response.body!, z.string(), {
        errorHandler: console.error,
      });
      for await (const event of events) {
        console.log(event);
      }
      console.log("Done");
    } finally {
    }
  };

  return (
    <>
      <div>Hello am I a page?</div>
      <button onClick={handleSend}>Click me</button>
      <audio controls src={"/api/load-mp3?filename=0.mp3"} />
    </>
  );
}

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
