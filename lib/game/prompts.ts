export const GAME_PROMPTS = [
  // Food & Drink
  "Name a fruit",
  "Name a vegetable",
  "Name a pizza topping",
  "Name a breakfast food",
  "Name a dessert",
  "Name a beverage",
  "Name a type of cheese",
  "Name a fast food restaurant",
  "Name a condiment",
  "Name a type of pasta",
  "Name a candy bar",
  "Name a ice cream flavor",
  "Name a type of bread",
  "Name a Mexican food",
  "Name a Chinese food",
  "Name a seafood",
  "Name a type of meat",
  "Name a spice or herb",
  "Name a breakfast cereal",
  "Name a snack food",

  // Colors & Appearance
  "Name a color",
  "Name a shade of blue",
  "Name a shade of red",
  "Name a type of hairstyle",
  "Name a facial feature",

  // Animals & Nature
  "Name an animal",
  "Name a farm animal",
  "Name a pet",
  "Name a bird",
  "Name an insect",
  "Name a sea creature",
  "Name a reptile",
  "Name a type of dog",
  "Name a type of cat breed",
  "Name a wild animal",
  "Name a flower",
  "Name a tree",
  "Name a type of weather",
  "Name a season",
  "Name a natural disaster",

  // Time & Calendar
  "Name a day of the week",
  "Name a month",
  "Name a holiday",
  "Name a time of day",

  // Places
  "Name a country",
  "Name a U.S. state",
  "Name a city",
  "Name a European country",
  "Name a place you'd find in a city",
  "Name a tourist attraction",
  "Name a type of building",
  "Name a room in a house",
  "Name a store you'd find in a mall",
  "Name a place people go on vacation",

  // Entertainment
  "Name a video game",
  "Name a movie genre",
  "Name a TV show genre",
  "Name a board game",
  "Name a card game",
  "Name a Disney movie",
  "Name a superhero",
  "Name a supervillain",
  "Name a famous movie franchise",
  "Name a streaming service",
  "Name a video game console",
  "Name a social media platform",

  // Sports & Activities
  "Name a sport",
  "Name an Olympic sport",
  "Name a winter sport",
  "Name a water sport",
  "Name a ball sport",
  "Name a hobby",
  "Name an outdoor activity",
  "Name an exercise",
  "Name a famous athlete",

  // Music & Arts
  "Name a musical instrument",
  "Name a music genre",
  "Name a famous band",
  "Name a famous singer",
  "Name a type of dance",

  // School & Work
  "Name a school subject",
  "Name a college major",
  "Name a job/profession",
  "Name something you'd find in a classroom",
  "Name something you'd find in an office",
  "Name a school supply",

  // Transportation & Vehicles
  "Name a car brand",
  "Name a type of vehicle",
  "Name a mode of transportation",
  "Name a car model",
  "Name an airline",

  // Household & Objects
  "Name a piece of furniture",
  "Name a kitchen appliance",
  "Name something you'd find in a bathroom",
  "Name something you'd find in a bedroom",
  "Name a cleaning product",
  "Name a tool",
  "Name an electronic device",
  "Name something you plug in",

  // Clothing & Accessories
  "Name an article of clothing",
  "Name a type of shoe",
  "Name an accessory",
  "Name something you wear on your head",
  "Name a clothing brand",

  // Body & Health
  "Name a body part",
  "Name a bone in the human body",
  "Name a medical professional",
  "Name a symptom of being sick",
  "Name a type of doctor",

  // Abstract & Miscellaneous
  "Name an emotion",
  "Name a good quality in a person",
  "Name a bad habit",
  "Name something that's hot",
  "Name something that's cold",
  "Name something that's sticky",
  "Name something round",
  "Name something heavy",
  "Name something soft",
  "Name something loud",
  "Name something that smells good",
  "Name something that smells bad",
  "Name something you're afraid of",
  "Name something expensive",
  "Name something cheap",
  "Name something romantic",
  "Name a reason to call 911",
  "Name something you do every day",
  "Name something people collect",
  "Name a famous historical figure",
  "Name a U.S. president",
  "Name a language",
  "Name a book genre",
  "Name something in a wallet",
  "Name something in a purse",
  "Name a reason to be late",
  "Name a New Year's resolution",
  "Name something you do at a party",
  "Name something you'd find at a wedding",
  "Name something you'd find at a funeral",
  "Name something you'd find in a refrigerator",
  "Name a pizza chain",
  "Name a coffee shop chain",
  "Name something people argue about",
  "Name something people lie about",
  "Name a reason to miss work",
  "Name something you do before bed",
  "Name something you do in the morning",
  "Name a bad first date idea",
  "Name a good first date idea",
  "Name something kids are afraid of",
  "Name something you'd find in a garage",
  "Name something you'd find in a gym",
  "Name something you'd find at a beach",
  "Name something you'd find in a hotel room",
  "Name something you'd bring camping",
  "Name a type of natural disaster",
  "Name something people are addicted to",
  "Name a reason relationships end",
  "Name something people do when they're nervous",
  "Name something people do when they're bored",
  "Name a way to relax",
  "Name something that makes you happy",
  "Name something annoying",
];

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Creates a shuffled queue of prompts for a game session.
 * This ensures no repeats until all prompts have been used.
 */
export class PromptQueue {
  private queue: string[] = [];
  private index: number = 0;

  constructor() {
    this.refillQueue();
  }

  private refillQueue(): void {
    this.queue = shuffleArray(GAME_PROMPTS);
    this.index = 0;
  }

  /**
   * Gets the next prompt in the queue.
   * Automatically refills and reshuffles when all prompts have been used.
   */
  getNext(): string {
    if (this.index >= this.queue.length) {
      this.refillQueue();
    }
    return this.queue[this.index++];
  }

  /**
   * Returns the number of prompts remaining before reshuffle
   */
  getRemainingCount(): number {
    return this.queue.length - this.index;
  }

  /**
   * Resets the queue (useful when starting a new game session)
   */
  reset(): void {
    this.refillQueue();
  }
}
