import { ApplicationEvent } from "@/lib/ApplicationEvent";
import { AsyncQueue } from "@/lib/AsyncQueue";
import { createEventSourceReadableStream } from "@/lib/createEventSourceReadableStream";
import { generateNarrationArc } from "@/story/generateNarrationArc";
import { fakeGenerateStoryImage } from "@/story/fakeGenerateStoryImage";
import { NextApiRequest, NextApiResponse } from "next";
import { expandNarrationArc } from "@/story/expandNarrationArc";
import { selectVoices } from "@/story/selectVoices";
import { LmntSpeechSynthesisModel, synthesizeSpeech } from "modelfusion";

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

  const storyRequest = await readStreamAsString(req.body);

  const queue = new AsyncQueue<ApplicationEvent>();

  const narrationArc = await generateNarrationArc(storyRequest);

  queue.push({
    type: "titleGenerated",
    title: narrationArc.title,
  });

  // TODO error handling
  // TODO parallelize
  // const storyImage = await generateStoryImage(narrationArc);
  const storyImage = await fakeGenerateStoryImage(narrationArc);

  queue.push({
    type: "imageGenerated",
    image: storyImage,
  });

  const expandedNarrationArc = await expandNarrationArc(narrationArc);
  const voices = await selectVoices(expandedNarrationArc);

  const storyParts = [
    ...expandedNarrationArc.introduction,
    ...expandedNarrationArc.risingAction,
    ...expandedNarrationArc.climax,
    ...expandedNarrationArc.fallingAction,
    ...expandedNarrationArc.conclusion,
  ];

  for (let i = 0; i < storyParts.length; i++) {
    const part = storyParts[i];

    const narration = await synthesizeSpeech(
      new LmntSpeechSynthesisModel({
        voice: voices[part.speaker as keyof typeof voices],
      }),
      part.content
    );

    // TODO send narration to client
    // TODO store in file (later, Fastify server)
  }

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

async function readStreamAsString(
  stream: ReadableStream<Uint8Array>
): Promise<string> {
  const reader = stream.getReader();
  const chunks: string[] = [];

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(new TextDecoder().decode(value));
  }

  return chunks.join("");
}
