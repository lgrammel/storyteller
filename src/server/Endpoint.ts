import { z } from "zod";

export type Endpoint<INPUT, EVENT> = {
  name: string;

  inputSchema: z.ZodType<INPUT>;
  eventSchema: z.ZodType<EVENT>;

  processRequest: (options: {
    input: INPUT;
    publishEvent: (event: EVENT) => void;
    storeAsset: (options: {
      data: Buffer;
      contentType: string;
    }) => Promise<string>;
  }) => Promise<void>;
};
