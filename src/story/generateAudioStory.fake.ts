import { delay } from "@/lib/delay";
import { AsyncQueue, StructureStreamPart } from "modelfusion";
import { StructuredStory } from "./generateAudioStory";
import { generateAudioStoryExamples } from "./generateAudioStory.examples";

export async function generateAudioStory({
  index,
  delayInMs = 2000,
}: {
  index: number;
  delayInMs?: number;
}): Promise<StructuredStory> {
  await delay(delayInMs);
  return generateAudioStoryExamples[index] as StructuredStory;
}

// export async function expandNarrationArcFakeStream({
//   delayInMs = 2000,
// }: {
//   delayInMs?: number;
// }): Promise<AsyncIterable<StructureStreamPart<StructuredStory>>> {
//   const queue = new AsyncQueue<StructureStreamPart<StructuredStory>>();

//   // run async:
//   (async () => {
//     queue.push({
//       isComplete: false,
//       value: {
//         parts: [generateAudioStoryExamples[0].parts[0]],
//       },
//     });

//     await delay(delayInMs);

//     queue.push({
//       isComplete: false,
//       value: {
//         introduction: generateAudioStoryExamples[0].introduction,
//         risingAction: [
//           {
//             type: generateAudioStoryExamples[0].risingAction[0].type,
//             speaker: generateAudioStoryExamples[0].risingAction[0].type,
//             content:
//               generateAudioStoryExamples[0].risingAction[0].content.slice(
//                 0,
//                 20
//               ),
//           },
//         ],
//       },
//     });

//     await delay(delayInMs);

//     queue.push({
//       isComplete: false,
//       value: {
//         introduction: generateAudioStoryExamples[0].introduction,
//         risingAction: [generateAudioStoryExamples[0].risingAction[0]],
//       },
//     });

//     await delay(delayInMs);

//     queue.push({
//       isComplete: false,
//       value: {
//         introduction: generateAudioStoryExamples[0].introduction,
//         risingAction: [
//           generateAudioStoryExamples[0].risingAction[0],
//           generateAudioStoryExamples[0].risingAction[1],
//         ],
//       },
//     });

//     await delay(delayInMs);

//     queue.push({
//       isComplete: false,
//       value: {
//         introduction: generateAudioStoryExamples[0].introduction,
//         risingAction: [
//           generateAudioStoryExamples[0].risingAction[0],
//           generateAudioStoryExamples[0].risingAction[1],
//           generateAudioStoryExamples[0].risingAction[2],
//         ],
//       },
//     });

//     await delay(delayInMs);

//     queue.push({
//       isComplete: false,
//       value: {
//         introduction: generateAudioStoryExamples[0].introduction,
//         risingAction: [
//           generateAudioStoryExamples[0].risingAction[0],
//           generateAudioStoryExamples[0].risingAction[1],
//           generateAudioStoryExamples[0].risingAction[2],
//           generateAudioStoryExamples[0].risingAction[3],
//         ],
//       },
//     });

//     await delay(delayInMs);

//     queue.push({
//       isComplete: false,
//       value: {
//         introduction: generateAudioStoryExamples[0].introduction,
//         risingAction: generateAudioStoryExamples[0].risingAction,
//       },
//     });

//     await delay(delayInMs);

//     queue.push({
//       isComplete: false,
//       value: generateAudioStoryExamples[0],
//     });

//     await delay(delayInMs);

//     queue.push({
//       isComplete: true,
//       value: generateAudioStoryExamples[0] as StructuredStory,
//     });
//   })();

//   return queue;
// }
