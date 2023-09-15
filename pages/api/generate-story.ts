import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { AsyncQueue } from "@/lib/AsyncQueue";
import { createEventSourceReadableStream } from "@/lib/createEventSourceReadableStream";

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

  const queue = new AsyncQueue<string>();

  queue.push("value1");
  queue.push("value2");
  queue.close();

  return new Response(createEventSourceReadableStream(queue), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Encoding": "none",
    },
  });
}
