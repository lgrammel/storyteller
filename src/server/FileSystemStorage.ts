import { FunctionEvent } from "modelfusion";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { Asset } from "./Asset";
import { FlowRun } from "./FlowRun";
import type { Storage } from "./Storage";

export class FileSystemStorage implements Storage {
  private readonly logPath: (run: FlowRun<unknown>) => string;
  private readonly assetPath: (run: FlowRun<unknown>) => string;

  constructor({
    logPath,
    assetPath,
  }: {
    logPath: (run: FlowRun<unknown>) => string;
    assetPath: (run: FlowRun<unknown>) => string;
  }) {
    this.logPath = logPath;
    this.assetPath = assetPath;
  }

  async storeAsset({
    run,
    asset,
  }: {
    run: FlowRun<unknown>;
    asset: Asset;
  }): Promise<void> {
    try {
      const assetPath = this.assetPath(run);
      await fs.mkdir(assetPath, { recursive: true });
      await fs.writeFile(join(assetPath, asset.name), asset.data);
    } catch (error) {
      this.logError({
        run,
        message: `Failed to store asset ${asset.name}`,
        error,
      });
      throw error;
    }
  }

  readAsset(options: {
    run: FlowRun<unknown>;
    assetName: string;
  }): Promise<Buffer | null> {
    try {
      const assetPath = this.assetPath(options.run);
      return fs.readFile(join(assetPath, options.assetName));
    } catch (error) {
      this.logError({
        run: options.run,
        message: `Failed to read asset ${options.assetName}`,
        error,
      });
      throw error;
    }
  }

  async logFunctionEvent({
    run,
    event,
  }: {
    run: FlowRun<unknown>;
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
        JSON.stringify(event)
      );
    } catch (error) {
      this.logError({
        run,
        message: `Failed to write function event ${event.callId}`,
        error,
      });
    }
  }

  async logError(options: {
    run: FlowRun<unknown>;
    message: string;
    error: unknown;
  }): Promise<void> {
    const timestamp = Date.now();
    try {
      const logPath = this.logPath(options.run);
      return fs.writeFile(
        join(logPath, `${timestamp}-error.json`),
        JSON.stringify({
          timestamp: new Date(timestamp).toISOString(),
          runId: options.run.runId,
          message: options.message,
          error: options.error,
        })
      );
    } catch (error) {
      console.error(`Failed to write error log`);
      console.error(error);
    }
  }
}
