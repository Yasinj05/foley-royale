import "dotenv/config";
import { connectDb } from "../db/connect.js";
import { Prompt } from "../models/Prompt.js";

const prompts = [
  {
    phrase: "A flat tire deflating",
    category: "Machines",
    difficulty: "easy",
    acceptedSynonyms: ["flat tire", "tire deflating", "punctured tire"],
  },
  {
    phrase: "Microwave finishing",
    category: "Household",
    difficulty: "easy",
    acceptedSynonyms: ["microwave beep", "microwave done", "microwave timer"],
  },
  {
    phrase: "Mosquito buzzing near an ear at 3 AM",
    category: "Animals",
    difficulty: "medium",
    acceptedSynonyms: ["mosquito buzzing", "mosquito in ear", "bug buzzing"],
  },
  {
    phrase: "Cat coughing up a hairball",
    category: "Animals",
    difficulty: "medium",
    acceptedSynonyms: ["cat hairball", "hairball", "cat coughing"],
  },
  {
    phrase: "Popcorn popping",
    category: "Household",
    difficulty: "easy",
    acceptedSynonyms: ["popcorn", "popping corn"],
  },
  {
    phrase: "Old dial-up modem connecting",
    category: "Machines",
    difficulty: "hard",
    acceptedSynonyms: ["dial up modem", "modem handshake", "dial-up"],
  },
  {
    phrase: "Someone walking on sticky gum",
    category: "Absurd",
    difficulty: "medium",
    acceptedSynonyms: ["sticky gum", "gum on shoe", "stepping in gum"],
  },
  {
    phrase: "Coffee machine gurgling",
    category: "Household",
    difficulty: "easy",
    acceptedSynonyms: ["coffee maker", "coffee brewing", "espresso machine"],
  },
  {
    phrase: "Balloon slowly leaking air",
    category: "Household",
    difficulty: "easy",
    acceptedSynonyms: ["balloon leak", "deflating balloon", "balloon hiss"],
  },
  {
    phrase: "Duck quacking angrily",
    category: "Animals",
    difficulty: "easy",
    acceptedSynonyms: ["angry duck", "duck quack", "quacking duck"],
  },
  {
    phrase: "Zipper getting stuck",
    category: "Household",
    difficulty: "medium",
    acceptedSynonyms: ["stuck zipper", "jammed zipper", "broken zipper"],
  },
  {
    phrase: "Robot vacuum bumping into a wall",
    category: "Machines",
    difficulty: "medium",
    acceptedSynonyms: ["roomba", "robot vacuum", "vacuum bumping"],
  },
  {
    phrase: "Soda can opening",
    category: "Household",
    difficulty: "easy",
    acceptedSynonyms: ["opening a can", "can tab", "fizzy can"],
  },
  {
    phrase: "Horse galloping on cobblestones",
    category: "Animals",
    difficulty: "medium",
    acceptedSynonyms: ["horse galloping", "galloping horse", "hooves on stone"],
  },
  {
    phrase: "Printer jamming dramatically",
    category: "Machines",
    difficulty: "medium",
    acceptedSynonyms: ["printer jam", "paper jam", "broken printer"],
  },
  {
    phrase: "Someone sneaking on creaky floorboards",
    category: "Absurd",
    difficulty: "medium",
    acceptedSynonyms: ["creaky floor", "sneaking upstairs", "creaky floorboards"],
  },
  {
    phrase: "Bee trapped in a window",
    category: "Animals",
    difficulty: "medium",
    acceptedSynonyms: ["bee buzzing", "trapped bee", "bee at window"],
  },
  {
    phrase: "Toilet flushing",
    category: "Household",
    difficulty: "easy",
    acceptedSynonyms: ["flushing toilet", "flush", "toilet"],
  },
  {
    phrase: "Helicopter taking off",
    category: "Machines",
    difficulty: "easy",
    acceptedSynonyms: ["helicopter", "chopper", "helicopter blades"],
  },
  {
    phrase: "Ghost knocking on a table",
    category: "Absurd",
    difficulty: "hard",
    acceptedSynonyms: ["ghost knock", "poltergeist", "knocking ghost"],
  },
  {
    phrase: "Dog shaking off water",
    category: "Animals",
    difficulty: "easy",
    acceptedSynonyms: ["wet dog", "dog shaking", "dog drying off"],
  },
  {
    phrase: "Velcro ripping apart",
    category: "Household",
    difficulty: "easy",
    acceptedSynonyms: ["velcro", "ripping velcro", "opening velcro"],
  },
  {
    phrase: "Typewriter typing furiously",
    category: "Machines",
    difficulty: "medium",
    acceptedSynonyms: ["typewriter", "typing on typewriter", "old typewriter"],
  },
  {
    phrase: "Someone slurping the last of a milkshake",
    category: "Absurd",
    difficulty: "easy",
    acceptedSynonyms: ["slurping milkshake", "empty milkshake", "straw slurping"],
  },
  {
    phrase: "Owl hooting in a forest",
    category: "Animals",
    difficulty: "easy",
    acceptedSynonyms: ["owl hoot", "hooting owl", "owl at night"],
  },
  {
    phrase: "Washing machine spinning unbalanced",
    category: "Machines",
    difficulty: "medium",
    acceptedSynonyms: ["unbalanced washer", "washing machine", "washer spinning"],
  },
  {
    phrase: "Bacon sizzling in a pan",
    category: "Household",
    difficulty: "easy",
    acceptedSynonyms: ["sizzling bacon", "frying bacon", "bacon frying"],
  },
  {
    phrase: "Alien spaceship landing",
    category: "Absurd",
    difficulty: "hard",
    acceptedSynonyms: ["ufo landing", "spaceship", "alien ship"],
  },
  {
    phrase: "Frog croaking in a swamp",
    category: "Animals",
    difficulty: "easy",
    acceptedSynonyms: ["frog croak", "croaking frog", "swamp frog"],
  },
  {
    phrase: "Camera shutter clicking rapidly",
    category: "Machines",
    difficulty: "medium",
    acceptedSynonyms: ["camera shutter", "taking photos", "camera clicking"],
  },
] as const;

async function seed(): Promise<void> {
  await connectDb();
  await Prompt.deleteMany({});
  await Prompt.insertMany(
    prompts.map((p) => ({
      ...p,
      language: "en" as const,
    })),
  );
  console.log(`[seed] inserted ${prompts.length} prompts`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});
