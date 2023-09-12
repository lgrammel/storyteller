import { ParsedEvent, createParser } from "eventsource-parser";

async function* convertReadableStreamToAsyncIterable<T>(
  reader: ReadableStreamDefaultReader<T>
): AsyncIterable<T> {
  while (true) {
    const result = await reader.read();

    if (result.done) {
      break;
    }

    yield result.value;
  }
}

export async function parseEventSourceReadableStream({
  stream,
  callback,
}: {
  stream: ReadableStream<Uint8Array>;
  callback: {
    onOpen?: () => void;
    onClose?: () => void;
    onEvent: (event: ParsedEvent) => void;
    onError: (error: unknown) => void;
  };
}) {
  try {
    const parser = createParser((event) => {
      if (event.type === "reconnect-interval") {
        return; // ignore reconnect interval events
      }
      callback.onEvent(event);
    });
    const decoder = new TextDecoder();
    const iterable = convertReadableStreamToAsyncIterable(stream.getReader());

    callback.onOpen?.();
    for await (const value of iterable) {
      parser.feed(decoder.decode(value));
    }
    callback.onClose?.();
  } catch (error) {
    callback.onError(error);
  }
}
