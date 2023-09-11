import dotenv from "dotenv";
import {
  OpenAIChatFunctionPrompt,
  OpenAIChatMessage,
  OpenAIChatModel,
  ZodStructureDefinition,
  generateStructure,
} from "modelfusion";
import { z } from "zod";

dotenv.config();

async function main() {
  const outline = {
    title: "The Adventures of Ellie Elephant and Princess Poppy",
    characters: [
      {
        name: "Ellie Elephant",
        description:
          "A friendly and wise elephant who has the ability to speak and understand the human language.",
        gender: "Female",
        age: 15,
        role: "Main character",
        backstory:
          "Once lived peacefully in the jungle until she was separated from her herd during a storm.",
      },
      {
        name: "Princess Poppy",
        description:
          "A brave and kind-hearted princess who loves to explore and learn about the world.",
        gender: "Female",
        age: 12,
        role: "Main character",
        backstory:
          "Born into a royal family but always longed for adventure outside the castle walls.",
      },
    ],
    setting:
      "A vast and vibrant kingdom, teeming with diverse ecosystems such as dense forests, rocky mountains, vast deserts, and sparkling oceans.",
    plotSummary:
      "Ellie the Elephant and Princess Poppy form an unlikely friendship after Ellie ends up lost in Poppy's kingdom. Poppy, desiring adventure and fascinated by the talking elephant, decides to help Ellie find her way back to her family in the jungle. They embark on a journey across varying terrains, learning about different habitats and the creatures that reside within them. Along the way, they must overcome small challenges such as figuring out directions and dealing with weather changes. Their bond strengthens with each shared experience. In the end, with Poppy's assistance, Ellie reunites with her herd, expressing her gratitude to her human friend. This heartfelt tale reinforces lessons about friendship, bravery, and the importance of knowledge.",
  };

  const x = await generateStructure(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 1,
    }),
    new ZodStructureDefinition({
      name: "writeStory",
      description: "Write the kids story with narration.",
      schema: z.object({
        storyParts: z.array(
          z.object({
            text: z.string().describe("Text of the story part"),
            speaker: z
              .string()
              .optional()
              .describe("Speaker of the story part"),
          })
        ),
      }),
    }),
    OpenAIChatFunctionPrompt.forStructureCurried([
      OpenAIChatMessage.system(
        "You are an esteemed children's story author. " +
          "Here is the outline of a story that you are writing:"
      ),
      OpenAIChatMessage.functionResult("storyOutline", JSON.stringify(outline)),
      OpenAIChatMessage.user(
        "Expand the outline into a rich, detailed story story for preschoolers that will be narrated as a short audio story." +
          "The story can introduce more complex narratives, but should still have straightforward themes and structures." +
          "The target length of the story is 1200 words. " +
          "Add the speakers to each dialogue part. "
      ),
    ])
  );

  console.log(JSON.stringify(x, null, 2));
}

main().catch(console.error);
