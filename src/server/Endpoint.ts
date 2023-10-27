import { z } from "zod";
import { EndpointRun } from "./EndpointRun";

export type Endpoint<INPUT, EVENT> = {
  readonly name: string;

  readonly inputSchema: z.ZodType<INPUT>;
  readonly eventSchema: z.ZodType<EVENT>;

  processRequest: (options: {
    input: INPUT;
    run: EndpointRun<EVENT>;
  }) => Promise<void>;
};
