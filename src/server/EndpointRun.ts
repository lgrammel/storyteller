import { AsyncQueue, DefaultRun, FunctionEvent } from "modelfusion";
import { promises as fs } from "node:fs";
import { join } from "node:path";

export type Asset = {
  data: Buffer;
  contentType: string;
  name: string;
};

export class EndpointRun<EVENT> extends DefaultRun {
  readonly eventQueue: AsyncQueue<EVENT> = new AsyncQueue();
  readonly assets: Record<string, Asset> = {};

  readonly endpointName: string;
  private readonly logPath: null | ((run: EndpointRun<unknown>) => string);
  private readonly assetPath: null | ((run: EndpointRun<unknown>) => string);

  constructor({
    endpointName,
    logPath,
    assetPath,
  }: {
    endpointName: string;
    logPath: null | ((run: EndpointRun<unknown>) => string);
    assetPath: null | ((run: EndpointRun<unknown>) => string);
  }) {
    super();

    this.endpointName = endpointName;
    this.logPath = logPath;
    this.assetPath = assetPath;
  }

  readonly functionObserver = {
    onFunctionEvent: async (event: FunctionEvent) => {
      if (this.logPath != null) {
        const timestamp = event.startTimestamp.getTime();
        try {
          const logPath = this.logPath(this);
          await fs.mkdir(logPath, { recursive: true });
          await fs.writeFile(
            join(
              logPath,
              `${timestamp}-${event.callId}-${event.functionType}-${event.eventType}.json`
            ),
            JSON.stringify(event, null, 2)
          );
        } catch (error) {
          console.error(`Failed to write event log ${event.callId}`);
          console.error(error);
        }
      }
    },
  };

  publishEvent(event: EVENT) {
    this.eventQueue.push(event);
  }

  async storeBinaryAsset(asset: Asset): Promise<string> {
    this.assets[asset.name] = asset;

    if (this.assetPath != null) {
      try {
        const assetPath = this.assetPath(this);
        await fs.mkdir(assetPath, { recursive: true });
        await fs.writeFile(join(assetPath, asset.name), asset.data);
      } catch (error) {
        console.error(`Failed to write asset ${asset.name}`);
        console.error(error);
      }
    }

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
