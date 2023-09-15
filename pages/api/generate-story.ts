import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

export const config = {
  runtime: "edge",
  api: { bodyParser: true },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  // TODO generate an event stream with 3 events

  const queue = new AsyncQueue<string>();

  queue.push("value1");
  queue.push("value2");
  queue.close();

  return new Response(createTextDeltaEventSource(queue), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Encoding": "none",
    },
  });
}

const textEncoder = new TextEncoder();

const textDeltaEventDataSchema = z.object({
  textDelta: z.string().optional(),
  isFinished: z.boolean(),
});

type TextDeltaEventData = z.infer<typeof textDeltaEventDataSchema>;

function enqueueData(
  controller: ReadableStreamDefaultController<unknown>,
  data: TextDeltaEventData
) {
  controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

function createTextDeltaEventSource(
  textDeltas: AsyncIterable<string | undefined>
) {
  return new ReadableStream({
    async start(controller) {
      for await (const textDelta of textDeltas) {
        enqueueData(controller, { textDelta, isFinished: false });
      }

      enqueueData(controller, { isFinished: true });
    },
  });
}

/**
 * @internal
 */
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
