import { AsyncQueue } from "@/lib/AsyncQueue";
import { parseEventSourceReadableStream } from "@/lib/parseEventSourceReadableStream";

export default function Home() {
  const handleSend = async () => {
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "",
      });

      const events = readEvents(response.body!);
      for await (const event of events) {
        console.log(event);
      }
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

export function readEvents(
  stream: ReadableStream<Uint8Array>,
  options?: {
    errorHandler: (error: any) => void;
  }
): AsyncIterable<string | undefined> {
  const queue = new AsyncQueue<string | undefined>();

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
          // TODO parse with Zod
          const data = JSON.parse(event.data);

          queue.push(data.textDelta);
        } catch (error) {
          options?.errorHandler(error);
          queue.close();
        }
      },
    },
  });

  return queue;
}
