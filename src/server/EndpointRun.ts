import { AsyncQueue } from "@/lib/AsyncQueue";
import { nanoid as createId } from "nanoid";
import { Run } from "modelfusion";

type Asset = {
  data: Buffer;
  contentType: string;
  name: string;
};

export class EndpointRun<EVENT> implements Run {
  readonly runId = createId();
  readonly eventQueue: AsyncQueue<EVENT> = new AsyncQueue();
  readonly assets: Record<string, Asset> = {};
  readonly endpointName: string;

  constructor({ endpointName }: { endpointName: string }) {
    this.endpointName = endpointName;
  }

  publishEvent(event: EVENT) {
    this.eventQueue.push(event);
  }

  async storeDataAsset(asset: Asset): Promise<string> {
    this.assets[asset.name] = asset;
    return `/${this.endpointName}/${this.runId}/assets/${asset.name}`;
  }

  async storeTextAsset(asset: {
    text: string;
    contentType: string;
    name: string;
  }) {
    return this.storeDataAsset({
      data: Buffer.from(asset.text),
      contentType: asset.contentType,
      name: asset.name,
    });
  }

  finish() {
    this.eventQueue.close();
  }
}
