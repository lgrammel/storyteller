import { AsyncQueue } from "@/lib/AsyncQueue";
import { nanoid as createId } from "nanoid";
import { Run } from "modelfusion";

export class EndpointRun<EVENT> implements Run {
  readonly runId = createId();
  readonly eventQueue: AsyncQueue<EVENT> = new AsyncQueue();
  readonly assets: Record<string, { data: Buffer; contentType: string }> = {};
  readonly endpointName: string;

  constructor({ endpointName }: { endpointName: string }) {
    this.endpointName = endpointName;
  }

  publishEvent(event: EVENT) {
    this.eventQueue.push(event);
  }

  async storeAsset(options: {
    data: Buffer;
    contentType: string;
  }): Promise<string> {
    const id = createId();
    this.assets[id] = options;
    return `/${this.endpointName}/${this.runId}/assets/${id}`;
  }

  finish() {
    this.eventQueue.close();
  }
}
