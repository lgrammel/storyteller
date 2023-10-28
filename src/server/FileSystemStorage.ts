import { FunctionEvent } from "modelfusion";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { Asset } from "./Asset";
import { EndpointRun } from "./EndpointRun";
import type { Storage } from "./Storage";

export class FileSystemStorage implements Storage {
  private readonly logPath: (run: EndpointRun<unknown>) => string;
  private readonly assetPath: (run: EndpointRun<unknown>) => string;

  constructor({
    logPath,
    assetPath,
  }: {
    logPath: (run: EndpointRun<unknown>) => string;
    assetPath: (run: EndpointRun<unknown>) => string;
  }) {
    this.logPath = logPath;
    this.assetPath = assetPath;
  }

  async storeAsset({
    run,
    asset,
  }: {
    run: EndpointRun<unknown>;
    asset: Asset;
  }): Promise<void> {
    try {
      const assetPath = this.assetPath(run);
      await fs.mkdir(assetPath, { recursive: true });
      await fs.writeFile(join(assetPath, asset.name), asset.data);
    } catch (error) {
      console.error(`Failed to write asset ${asset.name}`);
      console.error(error);
    }
  }

  readAsset(options: {
    run: EndpointRun<unknown>;
    assetName: string;
  }): Promise<Buffer | null> {
    try {
      const assetPath = this.assetPath(options.run);
      return fs.readFile(join(assetPath, options.assetName));
    } catch (error) {
      console.error(`Failed to read asset ${options.assetName}`);
      console.error(error);
      throw error;
    }
  }

  async logFunctionEvent({
    run,
    event,
  }: {
    run: EndpointRun<unknown>;
    event: FunctionEvent;
  }): Promise<void> {
    const timestamp = event.startTimestamp.getTime();
    try {
      const logPath = this.logPath(run);
      await fs.mkdir(logPath, { recursive: true });
      await fs.writeFile(
        join(
          logPath,
          `${timestamp}-${event.callId}-${
            event.functionId ?? event.functionType
          }-${event.eventType}.json`
        ),
        JSON.stringify(event, null, 2)
      );
    } catch (error) {
      console.error(`Failed to write event log ${event.callId}`);
      console.error(error);
    }
  }

  logError(options: {
    run: EndpointRun<unknown>;
    error: unknown;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
