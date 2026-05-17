import { DataGenerator } from "../data/DataGenerator";
import { TrainTestSplitter } from "../data/TrainTestSplitter";
import { GraphBuilder } from "../graph/GraphBuilder";
import { BenchmarkRunner } from "../evaluation/BenchmarkRunner";
import { CsvWriter } from "../utils/CsvWriter";
import { PropagationConfig } from "../types";

export class SparsityExperiment {
  run(outputPath: string): void {
    const densities = [0.001, 0.005, 0.01, 0.05];
    const rows: Array<Array<string | number>> = [];
    const configProp: PropagationConfig = {
      depth: 3,
      decay: 0.7,
      restartProbability: 0.15,
      maxIterations: 25,
      convergenceThreshold: 1e-6,
      minActivation: 0.001,
      weightExponent: 1.4
    };

    for (const density of densities) {
      const interactions = DataGenerator.generate({
        users: 2000,
        items: 800,
        density,
        degreeDistribution: "uniform",
        weightRange: [0.5, 1.0],
        seed: 7
      });
      const split = TrainTestSplitter.split(interactions, 0.2, 99);
      const graph = GraphBuilder.build(split.train);

      const benchmark = BenchmarkRunner.run(graph, split.train, split.test, {
        topK: 10,
        methods: ["spreadingActivation"],
        config: configProp,
        userSampleSize: 80,
        seed: 7
      })[0];

      rows.push([
        density,
        benchmark.precisionAtK,
        benchmark.recallAtK,
        benchmark.coverage,
        benchmark.avgCandidateCount
      ]);
    }

    CsvWriter.writeCsv(
      outputPath,
      ["density", "precision_at_k", "recall_at_k", "coverage", "candidate_count"],
      rows
    );
  }
}
