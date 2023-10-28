import { FunctionEvent } from "modelfusion";
import { Asset } from "./Asset";
import { EndpointRun } from "./EndpointRun";

export interface Storage {
  storeAsset(options: {
    run: EndpointRun<unknown>;
    asset: Asset;
  }): Promise<void>;

  readAsset(options: {
    run: EndpointRun<unknown>;
    assetName: string;
  }): Promise<Buffer | null>;

  logFunctionEvent(options: {
    run: EndpointRun<unknown>;
    event: FunctionEvent;
  }): Promise<void>;

  logError(options: {
    run: EndpointRun<unknown>;
    error: unknown;
  }): Promise<void>;
}
