import { AsyncQueue, DefaultRun, FunctionEvent } from "modelfusion";
import { Asset } from "./Asset";
import type { Storage } from "./Storage";

export class EndpointRun<EVENT> extends DefaultRun {
  readonly eventQueue: AsyncQueue<EVENT> = new AsyncQueue();
  readonly assets: Record<string, Asset> = {};

  readonly endpointName: string;
  private readonly storage: Storage;

  constructor({
    endpointName,
    storage,
  }: {
    endpointName: string;
    storage: Storage;
  }) {
    super();

    this.endpointName = endpointName;
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

    return `/${this.endpointName}/${this.runId}/assets/${asset.name}`;
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
