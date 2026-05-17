import { DataGenerator } from "../data/DataGenerator";
import { TrainTestSplitter } from "../data/TrainTestSplitter";
import { GraphBuilder } from "../graph/GraphBuilder";
import { RecommendationEngine } from "../recommendation/RecommendationEngine";
import { PropagationConfig } from "../types";
import { CsvWriter } from "../utils/CsvWriter";
import { MemoryProfiler } from "../evaluation/MemoryProfiler";

export class GraphSizeExperiment {
  run(outputPath: string): void {
    const configs = [
      { users: 100, items: 50, interactions: 500 },
      { users: 1000, items: 500, interactions: 10000 },
      { users: 5000, items: 2000, interactions: 50000 },
      { users: 10000, items: 5000, interactions: 100000 }
    ];

    const rows: Array<Array<string | number>> = [];

    for (const config of configs) {
      const beforeGraph = MemoryProfiler.snapshot("before_graph");
      const interactions = DataGenerator.generate({
        users: config.users,
        items: config.items,
        interactions: config.interactions,
        degreeDistribution: "uniform",
        weightRange: [0.5, 1.0],
        seed: 42
      });
      const split = TrainTestSplitter.split(interactions, 0.2, 101);
      const graph = GraphBuilder.build(split.train);
      const afterGraph = MemoryProfiler.snapshot("after_graph");

      const engine = new RecommendationEngine(graph);
      const userId = split.train[0]?.userId ?? graph.getAllUsers()[0];
      const configProp: PropagationConfig = {
        depth: 3,
        decay: 0.7,
        restartProbability: 0.15,
        maxIterations: 30,
        convergenceThreshold: 1e-6,
        minActivation: 0.001,
        weightExponent: 1.5
      };

      const output = engine.recommend(userId, "randomWalkRestart", configProp, {
        topK: 10,
        includePaths: false
      });
      const afterRun = MemoryProfiler.snapshot("after_run");

      const graphMemory = MemoryProfiler.diff(beforeGraph, afterGraph).heapUsedMB;
      const runMemory = MemoryProfiler.diff(afterGraph, afterRun).heapUsedMB;

      rows.push([
        config.users,
        config.items,
        config.interactions,
        graphMemory,
        runMemory,
        output.stats.totalMs,
        output.stats.rankingMs,
        output.stats.candidateCount,
        output.stats.visitedNodes
      ]);
    }

    CsvWriter.writeCsv(
      outputPath,
      [
        "users",
        "items",
        "interactions",
        "graph_memory_mb",
        "run_memory_mb",
        "latency_ms",
        "ranking_ms",
        "candidate_count",
        "visited_nodes"
      ],
      rows
    );
  }
}
