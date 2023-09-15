import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { AsyncQueue } from "@/lib/AsyncQueue";

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
