import { AsyncQueue, DefaultRun, FunctionEvent } from "modelfusion";
import { Asset } from "./Asset";
import type { Storage } from "./Storage";

export class FlowRun<EVENT> extends DefaultRun {
  readonly eventQueue: AsyncQueue<EVENT> = new AsyncQueue();
  readonly assets: Record<string, Asset> = {};

  readonly flowName: string;
  private readonly storage: Storage;

  constructor({ flowName, storage }: { flowName: string; storage: Storage }) {
    super();

    this.flowName = flowName;
    this.storage = storage;
  }

  readonly functionObserver = {
    onFunctionEvent: async (event: FunctionEvent) => {
      this.storage.logFunctionEvent({
        run: this,
        event,
      });
    },
  };

  publishEvent(event: EVENT) {
    this.eventQueue.push(event);
  }

  async storeBinaryAsset(asset: Asset): Promise<string> {
    this.assets[asset.name] = asset;

    this.storage.storeAsset({
      run: this,
      asset,
    });

    return `/${this.flowName}/${this.runId}/assets/${asset.name}`;
  }

  async storeTextAsset(asset: {
    text: string;
    contentType: string;
    name: string;
  }) {
    return this.storeBinaryAsset({
      data: Buffer.from(asset.text),
      contentType: asset.contentType,
      name: asset.name,
    });
  }

  finish() {
    this.eventQueue.close();
  }
}
