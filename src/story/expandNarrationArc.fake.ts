import { delay } from "@/lib/delay";
import { AsyncQueue, StructureStreamPart } from "modelfusion";
import { StructuredStory } from "./expandNarrationArc";
import { expandNarrationArcExamples } from "./expandNarrationArc.examples";

export async function expandNarrationArcFake({
  index,
  delayInMs = 2000,
}: {
  index: number;
  delayInMs?: number;
}): Promise<StructuredStory> {
  await delay(delayInMs);
  return expandNarrationArcExamples[index] as StructuredStory;
}

export async function expandNarrationArcFakeStream({
  delayInMs = 2000,
}: {
  index: number;
  delayInMs?: number;
}): Promise<AsyncIterable<StructureStreamPart<StructuredStory>>> {
  const queue = new AsyncQueue<StructureStreamPart<StructuredStory>>();

  // run async:
  (async () => {
    queue.push({
      isComplete: false,
      value: {
        introduction: expandNarrationArcExamples[0].introduction,
      },
    });

    await delay(delayInMs);

    queue.push({
      isComplete: false,
      value: {
        introduction: expandNarrationArcExamples[0].introduction,
        risingAction: [
          {
            type: expandNarrationArcExamples[0].risingAction[0].type,
            speaker: expandNarrationArcExamples[0].risingAction[0].type,
            content:
              expandNarrationArcExamples[0].risingAction[0].content.slice(
                0,
                20
              ),
          },
        ],
      },
    });

    await delay(delayInMs);

    queue.push({
      isComplete: false,
      value: {
        introduction: expandNarrationArcExamples[0].introduction,
        risingAction: [expandNarrationArcExamples[0].risingAction[0]],
      },
    });

    await delay(delayInMs);

    queue.push({
      isComplete: false,
      value: {
        introduction: expandNarrationArcExamples[0].introduction,
        risingAction: [
          expandNarrationArcExamples[0].risingAction[0],
          expandNarrationArcExamples[0].risingAction[1],
        ],
      },
    });

    await delay(delayInMs);

    queue.push({
      isComplete: false,
      value: {
        introduction: expandNarrationArcExamples[0].introduction,
        risingAction: expandNarrationArcExamples[0].risingAction,
      },
    });

    await delay(delayInMs);

    queue.push({
      isComplete: false,
      value: expandNarrationArcExamples[0],
    });

    await delay(delayInMs);

    queue.push({
      isComplete: true,
      value: expandNarrationArcExamples[0] as StructuredStory,
    });
  })();

  return queue;
}
