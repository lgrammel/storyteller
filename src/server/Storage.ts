import { FunctionEvent } from "modelfusion";
import { Asset } from "./Asset";
import { FlowRun } from "./FlowRun";

export interface Storage {
  storeAsset(options: { run: FlowRun<unknown>; asset: Asset }): Promise<void>;

  readAsset(options: {
    run: FlowRun<unknown>;
    assetName: string;
  }): Promise<Buffer | null>;

  logFunctionEvent(options: {
    run: FlowRun<unknown>;
    event: FunctionEvent;
  }): Promise<void>;

  logError(options: { run: FlowRun<unknown>; error: unknown }): Promise<void>;
}
