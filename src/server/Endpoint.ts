import { z } from "zod";
import { Asset, EndpointRun } from "./EndpointRun";

export type Endpoint<EVENT> = {
  name: string;

  eventSchema: z.ZodType<EVENT>;

  processRequest: (options: {
    input: Buffer;
    storeAsset: (asset: Asset) => Promise<string>;
    publishEvent: (event: EVENT) => void;
  }) => Promise<void>;
};
