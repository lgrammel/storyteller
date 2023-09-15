export const textEncoder = new TextEncoder();

export function createEventSourceReadableStream(
  events: AsyncIterable<unknown>
) {
  return new ReadableStream({
    async start(controller) {
      for await (const event of events) {
        controller.enqueue(
          textEncoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      }
      controller.close();
      // TODO fix in main app
      // TODO distinguish finish (work finished) vs close (could be accidental)
    },
  });
}
