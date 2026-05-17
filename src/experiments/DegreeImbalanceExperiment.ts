import { DataGenerator } from "../data/DataGenerator";
import { TrainTestSplitter } from "../data/TrainTestSplitter";
import { GraphBuilder } from "../graph/GraphBuilder";
import { GraphStorage } from "../graph/GraphStorage";
import { RecommendationEngine } from "../recommendation/RecommendationEngine";
import { QualityMetrics } from "../evaluation/QualityMetrics";
import { CsvWriter } from "../utils/CsvWriter";
import { PropagationConfig, PropagationMethod, ItemId } from "../types";

export class DegreeImbalanceExperiment {
  run(outputPath: string): void {
    const configs = [
      { label: "uniform", distribution: "uniform" as const },
      { label: "power_law", distribution: "power-law" as const }
    ];

    const rows: Array<Array<string | number>> = [];
    const configProp: PropagationConfig = {
      depth: 3,
      decay: 0.65,
      restartProbability: 0.2,
      maxIterations: 30,
      convergenceThreshold: 1e-6,
      minActivation: 0.001,
      weightExponent: 1.6
    };

    for (const config of configs) {
      const interactions = DataGenerator.generate({
        users: 1500,
        items: 700,
        interactions: 12000,
        degreeDistribution: config.distribution,
        weightRange: [0.4, 1.2],
        seed: 13
      });
      const split = TrainTestSplitter.split(interactions, 0.2, 55);
      const graph = GraphBuilder.build(split.train);
      const engine = new RecommendationEngine(graph);
      const method: PropagationMethod = "weightedInfluence";

      const popularSet = DegreeImbalanceExperiment.getPopularItems(graph.getAllItems(), graph);
      const users = Array.from(new Set(split.train.map((i) => i.userId))).slice(0, 80);

      let precisionSum = 0;
      let recallSum = 0;
      let popularRatioSum = 0;
      const uniqueItems = new Set<ItemId>();
      let userCount = 0;

      const testByUser = new Map<string, Set<ItemId>>();
      for (const interaction of split.test) {
        if (!testByUser.has(interaction.userId)) {
          testByUser.set(interaction.userId, new Set());
        }
        testByUser.get(interaction.userId)?.add(interaction.itemId);
      }

      for (const userId of users) {
        const relevant = testByUser.get(userId);
        if (!relevant || relevant.size === 0) {
          continue;
        }

        const output = engine.recommend(userId, method, configProp, {
          topK: 10,
          includePaths: false
        });
        const items = output.results.map((r) => r.itemId);

        const precision = QualityMetrics.precisionAtK(items, relevant, 10);
        const recall = QualityMetrics.recallAtK(items, relevant, 10);
        precisionSum += precision;
        recallSum += recall;

        const popularCount = items.filter((item) => popularSet.has(item)).length;
        popularRatioSum += items.length > 0 ? popularCount / items.length : 0;
        items.forEach((item) => uniqueItems.add(item));
        userCount += 1;
      }

      const denom = userCount === 0 ? 1 : userCount;
      const diversity = users.length > 0 ? uniqueItems.size / (users.length * 10) : 0;

      rows.push([
        config.label,
        precisionSum / denom,
        recallSum / denom,
        popularRatioSum / denom,
        diversity
      ]);
    }

    CsvWriter.writeCsv(
      outputPath,
      ["distribution", "precision_at_k", "recall_at_k", "popular_item_ratio", "diversity"],
      rows
    );
  }

  private static getPopularItems(items: ItemId[], graph: GraphStorage): Set<ItemId> {
    const itemsWithDegree = items
      .map((itemId) => ({ itemId, degree: graph.getNeighbors(itemId).length }))
      .sort((a, b) => b.degree - a.degree);
    const cutoff = Math.max(1, Math.floor(itemsWithDegree.length * 0.1));
    return new Set(itemsWithDegree.slice(0, cutoff).map((item) => item.itemId));
  }
}
