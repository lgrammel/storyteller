import { z } from "zod";

export function readEventSource<T>({
  url,
  eventSchema,
  onEvent,
  onError,
}: {
  url: string;
  eventSchema: z.ZodSchema<T>;
  onEvent: (event: T, eventSource: EventSource) => void;
  onError: (error: unknown, eventSource: EventSource) => void;
}) {
  const eventSource = new EventSource(url);

  eventSource.onmessage = (e) => {
    try {
      // TODO secureJSON
      const event = eventSchema.parse(JSON.parse(e.data));
      onEvent(event, eventSource);
    } catch (error) {
      onError(error, eventSource);
    }
  };

  eventSource.onerror = (e) => {
    onError(e, eventSource);
  };
}
