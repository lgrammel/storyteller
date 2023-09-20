import { ApplicationEvent } from "@/lib/ApplicationEvent";
import { AsyncQueue } from "@/lib/AsyncQueue";
import { createEventSourceReadableStream } from "@/lib/createEventSourceReadableStream";
import { NextApiRequest, NextApiResponse } from "next";

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

  const queue = new AsyncQueue<ApplicationEvent>();

  queue.push({
    type: "titleGenerated",
    title: "My Story",
  });

  // TODO
  // - generate narration arc
  // - expand narration arc
  // - select voices
  // - narrate story
  // - generate image

  // how to display the progress?
  // scaffolding? --> skeleton elements
  // streaming? --> how to stream complex structures?
  // audio controls --> complex display
  // text display

  // step 1: title & image
  // how can this be done in a parallel way?

  // queue.push({
  //   type: "progress",
  //   description: "end",
  // });
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
