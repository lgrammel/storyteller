import { AsyncQueue, DefaultRun, FunctionEvent } from "modelfusion";
import { Asset } from "./Asset";
import { PathProvider } from "./PathProvider";
import type { Storage } from "./Storage";

export class FlowRun<EVENT> extends DefaultRun {
  readonly eventQueue: AsyncQueue<EVENT> = new AsyncQueue();
  readonly assets: Record<string, Asset> = {};

  private readonly storage: Storage;
  private readonly paths: PathProvider;

  constructor({ paths, storage }: { paths: PathProvider; storage: Storage }) {
    super();

    this.paths = paths;
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

    return this.paths.getAssetPath(this.runId, asset.name);
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
