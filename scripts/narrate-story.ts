import dotenv from "dotenv";
import { ElevenLabsSpeechSynthesisModel, synthesizeSpeech } from "modelfusion";
import fs from "node:fs";

dotenv.config();

async function main() {
  const storyParts = [
    {
      text: "Once upon a time, nestled amidst a bustling kingdom with forests, mountains, deserts, and oceans, was a castle - the joyful abode of Princess Poppy. Poppy was a spirited and curious soul, with golden curls and eyes full of courage. While she had all the luxuries a princess could desire, Poppy's heart yearned for adventures beyond the castle walls.",
      speaker: "Narrator",
    },
    {
      text: "Within the deep, lush jungle on the outskirts of the kingdom, lived a wise, friendly, and remarkably unique elephant named Ellie. Loss separated her from her family during a harsh storm. Since then, she roamed alone, spreading wisdom with her tales from across the jungle.",
      speaker: "Narrator",
    },
    {
      text: "One sunny afternoon, Poppy, on one of her secret explorations, spotted Ellie in a meadow. The sight of a lonely elephant in her kingdom was strange and exciting!",
      speaker: "Narrator",
    },
    {
      text: "Hello there! You seem to be far from home. I'm Princess Poppy. Who might you be?",
      speaker: "Princess Poppy",
    },
    {
      text: "Hello, Princess Poppy. I am Ellie, the Elephant. You're right, I am lost. I have been trying to find my way back to my herd in the jungle, but it's been quite a task.",
      speaker: "Ellie Elephant",
    },
    {
      text: "Moved by Ellie's plight, Poppy proposed a daring plan. She would help Ellie return home, a real-life adventure she had always dreamt of!",
      speaker: "Narrator",
    },
    {
      text: "Don't worry, Ellie. Together, we'll embark on a journey through the kingdom to return you to your family!",
      speaker: "Princess Poppy",
    },
    {
      text: "And so, their daring journey began. They encountered quiet forests where they learned about different trees and plants. In the mountains, they battled a chilly storm and warmed themselves with stories by the fire.",
      speaker: "Narrator",
    },
    {
      text: "Oh, how beautiful the stars look tonight. They always help me find my way. Do they help you too, Poppy?",
      speaker: "Ellie Elephant",
    },
    {
      text: "Indeed, Ellie. Stars are like knights guiding us through the darkest nights. They've taught me the paths of my kingdom as well.",
      speaker: "Princess Poppy",
    },
    {
      text: "Braving the deserts, they shared stories of their homes. Poppy felt her bond with Ellie strengthening with each hardship they overcame together, each conversation making their friendship deeper.",
      speaker: "Narrator",
    },
    {
      text: "Finally, they reached the ocean. As they watched the sunset, painting the sky in hues of orange and pink, Poppy felt a sense of satisfaction, a fruitful end to her first big adventure.",
      speaker: "Narrator",
    },
    {
      text: "Look, Ellie! Across the ocean, it's your home, the jungle! Just a little more to go",
      speaker: "Princess Poppy",
    },
    {
      text: "Ah, it brings joy to my heart, Poppy. I can't thank you enough for this.",
      speaker: "Ellie Elephant",
    },
    {
      text: "Triumphantly, they crossed the sparkling ocean, with Poppy on Ellie. As they reached the jungle, Ellie rejoiced at the sight of her family. The herd cheered as they welcomed their lost member back.",
      speaker: "Narrator",
    },
    {
      text: "I am so grateful, Poppy! You helped me reunite with my family. I will always cherish this.",
      speaker: "Ellie Elephant",
    },
    {
      text: "And with a warm hug, Poppy said her goodbyes, promising to visit her friend in the jungle. She returned to her castle with a heart full of memories, prepared for more adventures, and with a deeper understanding of her kingdom. Their heartwarming tale of friendship, bravery, and the pursuit of knowledge became the bedtime story told in the kingdom every night.",
      speaker: "Narrator",
    },
  ];

  const speakerToVoice = {
    Narrator: "pNInz6obpgDQGcFmaJgB", // Adam
    "Princess Poppy": "jBpfuIE2acCO8z3wKNLl", // Gigi
    "Ellie Elephant": "zrHiDhphv9ZnVXBqCLjz", // Mimi
  };

  for (let i = 0; i < storyParts.length; i++) {
    const part = storyParts[i];

    const voice = speakerToVoice[part.speaker as keyof typeof speakerToVoice];

    const speech = await synthesizeSpeech(
      new ElevenLabsSpeechSynthesisModel({ voice }),
      part.text
    );

    const path = `./parts/${i}.mp3`;
    fs.writeFileSync(path, speech);
  }
}

main().catch(console.error);
