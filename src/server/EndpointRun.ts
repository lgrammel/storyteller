import { AsyncQueue } from "@/lib/AsyncQueue";
import { nanoid as createId } from "nanoid";
import { Run } from "modelfusion";
import { promises as fs } from "fs";
import { join } from "path";

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

  async saveAssets() {
    // Define the base directory for saving assets
    const baseDir = "./stories";
    const endpointDir = join(baseDir, this.endpointName);
    const runDir = join(endpointDir, this.runId);

    // Ensure the directory structure exists
    await fs.mkdir(runDir, { recursive: true });

    // Write each asset to the disk
    for (const assetName in this.assets) {
      const asset = this.assets[assetName];
      const assetPath = join(runDir, assetName);
      await fs.writeFile(assetPath, asset.data);
    }
  }
}
