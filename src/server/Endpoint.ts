import { z } from "zod";
import { EndpointRun } from "./EndpointRun";

export type Endpoint<EVENT> = {
  name: string;

  eventSchema: z.ZodType<EVENT>;

  processRequest: (options: {
    input: {
      mimetype: string;
      data: Buffer;
    };
    run: EndpointRun<EVENT>;
  }) => Promise<void>;
};
