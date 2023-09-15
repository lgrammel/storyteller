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

/**
 * @internal
 */
// TODO figure out how to remove the undefined
export class AsyncQueue<T> implements AsyncIterable<T | undefined> {
  queue: T[];
  resolvers: Array<(options: { value: T | undefined; done: boolean }) => void> =
    [];
  closed: boolean;

  constructor() {
    this.queue = [];
    this.resolvers = [];
    this.closed = false;
  }

  push(value: T) {
    if (this.closed) {
      throw new Error("Pushing to a closed queue");
    }

    const resolve = this.resolvers.shift();
    if (resolve) {
      resolve({ value, done: false });
    } else {
      this.queue.push(value);
    }
  }

  close() {
    while (this.resolvers.length) {
      const resolve = this.resolvers.shift();
      resolve?.({ value: undefined, done: true });
    }
    this.closed = true;
  }

  [Symbol.asyncIterator]() {
    return {
      next: (): Promise<IteratorResult<T | undefined, T | undefined>> => {
        if (this.queue.length > 0) {
          return Promise.resolve({ value: this.queue.shift(), done: false });
        } else if (this.closed) {
          return Promise.resolve({ value: undefined, done: true });
        } else {
          return new Promise((resolve) => this.resolvers.push(resolve));
        }
      },
    };
  }
}
