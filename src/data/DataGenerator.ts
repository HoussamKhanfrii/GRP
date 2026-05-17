import { DataGeneratorConfig, Interaction, TrainTestSplit } from "../types";
import { Random } from "../utils/Random";
import { TrainTestSplitter } from "./TrainTestSplitter";

export class DataGenerator {
  static generate(config: DataGeneratorConfig): Interaction[] {
    const random = new Random(config.seed);
    const userIds = DataGenerator.buildIds("U", config.users);
    const itemIds = DataGenerator.buildIds("I", config.items);

    const interactionCount = DataGenerator.resolveInteractionCount(config);
    const [minWeight, maxWeight] = config.weightRange;
    const tsStart = config.timestampStart ?? Date.now() - 1000 * 60 * 60 * 24 * 90;
    const tsEnd = config.timestampEnd ?? Date.now();

    const exponent = config.powerLawExponent ?? 1.2;
    const userWeights = DataGenerator.buildWeights(
      config.users,
      config.degreeDistribution,
      exponent
    );
    const itemWeights = DataGenerator.buildWeights(
      config.items,
      config.degreeDistribution,
      exponent
    );

    const seen = new Set<string>();
    const interactions: Interaction[] = [];
    const maxAttempts = interactionCount * 12;
    let attempts = 0;

    while (interactions.length < interactionCount && attempts < maxAttempts) {
      attempts += 1;
      const userIndex = random.weightedIndex(userWeights);
      const itemIndex = random.weightedIndex(itemWeights);
      const userId = userIds[userIndex];
      const itemId = itemIds[itemIndex];
      const key = `${userId}|${itemId}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      interactions.push({
        userId,
        itemId,
        weight: Number(random.float(minWeight, maxWeight).toFixed(4)),
        timestamp: random.int(tsStart, tsEnd)
      });
    }

    return interactions;
  }

  static generateAndSplit(config: DataGeneratorConfig, testRatio = 0.2): TrainTestSplit {
    const interactions = DataGenerator.generate(config);
    return TrainTestSplitter.split(interactions, testRatio, config.seed + 1);
  }

  private static resolveInteractionCount(config: DataGeneratorConfig): number {
    if (config.interactions && config.interactions > 0) {
      return Math.min(config.interactions, config.users * config.items);
    }

    if (config.density !== undefined) {
      return Math.max(1, Math.floor(config.users * config.items * config.density));
    }

    if (config.sparsity !== undefined) {
      const density = Math.max(0, 1 - config.sparsity);
      return Math.max(1, Math.floor(config.users * config.items * density));
    }

    return Math.max(1, Math.floor(config.users * config.items * 0.01));
  }

  private static buildIds(prefix: string, count: number): string[] {
    const ids: string[] = [];
    for (let i = 1; i <= count; i += 1) {
      ids.push(`${prefix}${i}`);
    }
    return ids;
  }

  private static buildWeights(
    count: number,
    distribution: "uniform" | "power-law",
    exponent: number
  ): number[] {
    if (distribution === "uniform") {
      return Array.from({ length: count }, () => 1);
    }
    const weights: number[] = [];
    for (let i = 1; i <= count; i += 1) {
      weights.push(1 / Math.pow(i, exponent));
    }
    return weights;
  }
}
