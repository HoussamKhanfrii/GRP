import { Interaction, TrainTestSplit } from "../types";
import { Random } from "../utils/Random";

export class TrainTestSplitter {
  static split(interactions: Interaction[], testRatio = 0.2, seed = 1): TrainTestSplit {
    const random = new Random(seed);
    const byUser = new Map<string, Interaction[]>();
    for (const interaction of interactions) {
      if (!byUser.has(interaction.userId)) {
        byUser.set(interaction.userId, []);
      }
      byUser.get(interaction.userId)?.push(interaction);
    }

    const train: Interaction[] = [];
    const test: Interaction[] = [];

    for (const userInteractions of byUser.values()) {
      random.shuffle(userInteractions);
      const rawTestCount = Math.floor(userInteractions.length * testRatio);
      const testCount = Math.max(0, Math.min(rawTestCount, userInteractions.length - 1));
      const testSlice = userInteractions.slice(0, testCount);
      const trainSlice = userInteractions.slice(testCount);
      train.push(...trainSlice);
      test.push(...testSlice);
    }

    return { train, test };
  }
}
