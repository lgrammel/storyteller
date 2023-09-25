import { ParsedEvent } from "eventsource-parser";
import { EventSourceParserStream } from "eventsource-parser/stream";
import { convertReadableStreamToAsyncIterable } from "./convertReadableStreamToAsyncIterable";

export async function parseEventSourceReadableStream({
  stream,
}: {
  stream: ReadableStream<Uint8Array>;
}): Promise<AsyncIterable<ParsedEvent>> {
  const eventStream = stream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream());

  return convertReadableStreamToAsyncIterable(eventStream);
}
