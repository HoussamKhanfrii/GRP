import { DataGenerator } from "../data/DataGenerator";
import { TrainTestSplitter } from "../data/TrainTestSplitter";
import { GraphBuilder } from "../graph/GraphBuilder";
import { RecommendationEngine } from "../recommendation/RecommendationEngine";
import { QualityMetrics } from "../evaluation/QualityMetrics";
import { CsvWriter } from "../utils/CsvWriter";
import { PropagationConfig } from "../types";

export class DepthExperiment {
  run(outputPath: string): void {
    const interactions = DataGenerator.generate({
      users: 1200,
      items: 600,
      interactions: 15000,
      degreeDistribution: "uniform",
      weightRange: [0.4, 1.1],
      seed: 21
    });
    const split = TrainTestSplitter.split(interactions, 0.2, 77);
    const graph = GraphBuilder.build(split.train);
    const engine = new RecommendationEngine(graph);

    const testByUser = new Map<string, Set<string>>();
    for (const interaction of split.test) {
      if (!testByUser.has(interaction.userId)) {
        testByUser.set(interaction.userId, new Set());
      }
      testByUser.get(interaction.userId)?.add(interaction.itemId);
    }

    const users = Array.from(new Set(split.train.map((i) => i.userId))).slice(0, 80);
    const rows: Array<Array<string | number>> = [];

    for (let depth = 1; depth <= 5; depth += 1) {
      const configProp: PropagationConfig = {
        depth,
        decay: 0.7,
        restartProbability: 0.15,
        maxIterations: 20,
        convergenceThreshold: 1e-6,
        minActivation: 0.001,
        weightExponent: 1.5
      };

      let precisionSum = 0;
      let recallSum = 0;
      let runtimeSum = 0;
      let visitedSum = 0;
      let candidateSum = 0;
      let count = 0;

      for (const userId of users) {
        const relevant = testByUser.get(userId);
        if (!relevant || relevant.size === 0) {
          continue;
        }
        const output = engine.recommend(userId, "neighborhood", configProp, {
          topK: 10,
          includePaths: false
        });
        const items = output.results.map((r) => r.itemId);
        precisionSum += QualityMetrics.precisionAtK(items, relevant, 10);
        recallSum += QualityMetrics.recallAtK(items, relevant, 10);
        runtimeSum += output.stats.totalMs;
        visitedSum += output.stats.visitedNodes;
        candidateSum += output.stats.candidateCount;
        count += 1;
      }

      const denom = count === 0 ? 1 : count;
      rows.push([
        depth,
        precisionSum / denom,
        recallSum / denom,
        runtimeSum / denom,
        visitedSum / denom,
        candidateSum / denom
      ]);
    }

    CsvWriter.writeCsv(
      outputPath,
      ["depth", "precision_at_k", "recall_at_k", "runtime_ms", "visited_nodes", "candidate_count"],
      rows
    );
  }
}
