import fs from "fs";
import path from "path";
import { DataGenerator } from "./data/DataGenerator";
import { TrainTestSplitter } from "./data/TrainTestSplitter";
import { GraphBuilder } from "./graph/GraphBuilder";
import { GraphAnalyzer } from "./graph/GraphAnalyzer";
import { RecommendationEngine } from "./recommendation/RecommendationEngine";
import { BenchmarkRunner } from "./evaluation/BenchmarkRunner";
import { ExperimentRunner } from "./evaluation/ExperimentRunner";
import { CsvWriter } from "./utils/CsvWriter";
import { MemoryProfiler } from "./evaluation/MemoryProfiler";
import { GraphAnalysis, PropagationConfig, PropagationMethod } from "./types";

const resultsDir = path.resolve("results");
fs.mkdirSync(resultsDir, { recursive: true });

const args = process.argv.slice(2);
const runBenchmarks = args.length === 0 || args.includes("--benchmarks");
const runExperiments = args.length === 0 || args.includes("--experiments");
const exportDashboard = args.length === 0 || args.includes("--export-dashboard");

interface DashboardRecommendationItem {
  itemId: string;
  score: number;
  path?: string[];
}

interface DashboardRecommendationSet {
  userId: string;
  method: PropagationMethod;
  items: DashboardRecommendationItem[];
}

interface DashboardExport {
  generatedAt: string;
  users: string[];
  methods: PropagationMethod[];
  graphStats: {
    users: number;
    items: number;
    interactions: number;
    density: number;
    sparsity: number;
    averageDegree: number;
    memoryMB: number;
  };
  recommendations: DashboardRecommendationSet[];
}

const generatorConfig = {
  users: 1000,
  items: 500,
  interactions: 10000,
  degreeDistribution: "power-law" as const,
  weightRange: [0.3, 1.2] as [number, number],
  seed: 42
};

const memoryBefore = MemoryProfiler.snapshot("before_graph");
const interactions = DataGenerator.generate(generatorConfig);
const split = TrainTestSplitter.split(interactions, 0.2, 42);
const graph = GraphBuilder.build(split.train);
const memoryAfterGraph = MemoryProfiler.snapshot("after_graph");

const analysis = GraphAnalyzer.analyze(graph);
console.log("Graph summary:");
console.log(analysis);

const propagationConfig: PropagationConfig = {
  depth: 3,
  decay: 0.7,
  restartProbability: 0.15,
  maxIterations: 30,
  convergenceThreshold: 1e-6,
  minActivation: 0.001,
  weightExponent: 1.5
};

const engine = new RecommendationEngine(graph);
const sampleUser = split.train[0]?.userId ?? graph.getAllUsers()[0];
const methods: PropagationMethod[] = [
  "neighborhood",
  "randomWalkRestart",
  "spreadingActivation",
  "weightedInfluence"
];

console.log(`Sample recommendations for ${sampleUser}:`);
for (const method of methods) {
  const output = engine.recommend(sampleUser, method, propagationConfig, {
    topK: 10,
    includePaths: true
  });
  console.log(method, output.results.slice(0, 5));
}

const memoryAfterSample = MemoryProfiler.snapshot("after_sample");

if (exportDashboard) {
  const dashboardTopK = 10;
  const dashboardData = buildDashboardExport(
    analysis,
    memoryAfterGraph.heapUsedMB,
    graph.getAllUsers(),
    methods,
    engine,
    propagationConfig,
    dashboardTopK
  );

  const dashboardOutputPath = path.resolve("dashboard", "public", "engine-output.json");
  fs.mkdirSync(path.dirname(dashboardOutputPath), { recursive: true });
  fs.writeFileSync(dashboardOutputPath, JSON.stringify(dashboardData, null, 2), "utf-8");
  console.log("Dashboard data saved to dashboard/public/engine-output.json");
}

if (runBenchmarks) {
  const benchmarkResults = BenchmarkRunner.run(graph, split.train, split.test, {
    topK: 10,
    methods,
    config: propagationConfig,
    userSampleSize: 80,
    seed: 11
  });

  CsvWriter.writeCsv(
    path.join(resultsDir, "benchmark_results.csv"),
    [
      "method",
      "precision_at_k",
      "recall_at_k",
      "f1_at_k",
      "ndcg_at_k",
      "hit_rate_at_k",
      "coverage",
      "avg_runtime_ms",
      "avg_memory_mb",
      "avg_visited_nodes",
      "avg_candidate_count",
      "avg_propagated_edges"
    ],
    benchmarkResults.map((result) => [
      result.method,
      result.precisionAtK,
      result.recallAtK,
      result.f1AtK,
      result.ndcgAtK,
      result.hitRateAtK,
      result.coverage,
      result.avgRuntimeMs,
      result.avgMemoryMB,
      result.avgVisitedNodes,
      result.avgCandidateCount,
      result.avgPropagatedEdges
    ])
  );

  CsvWriter.writeCsv(
    path.join(resultsDir, "quality_results.csv"),
    [
      "experiment",
      "method",
      "precision_at_k",
      "recall_at_k",
      "f1_at_k",
      "ndcg_at_k",
      "hit_rate_at_k",
      "coverage",
      "candidate_count"
    ],
    benchmarkResults.map((result) => [
      "benchmark",
      result.method,
      result.precisionAtK,
      result.recallAtK,
      result.f1AtK,
      result.ndcgAtK,
      result.hitRateAtK,
      result.coverage,
      result.avgCandidateCount
    ])
  );

  console.log("Benchmark results saved to results/benchmark_results.csv");
}

if (runExperiments) {
  const runner = new ExperimentRunner(resultsDir);
  runner.runAll();
  console.log("Experiment results saved to results/*.csv");
}

const memoryAfterRun = MemoryProfiler.snapshot("after_run");
const memoryDeltaGraph = MemoryProfiler.diff(memoryBefore, memoryAfterGraph);
const memoryDeltaRun = MemoryProfiler.diff(memoryAfterGraph, memoryAfterRun);

CsvWriter.writeCsv(
  path.join(resultsDir, "memory_results.csv"),
  ["label", "heap_used_mb", "rss_mb", "external_mb"],
  [
    [memoryBefore.label, memoryBefore.heapUsedMB, memoryBefore.rssMB, memoryBefore.externalMB],
    [memoryAfterGraph.label, memoryAfterGraph.heapUsedMB, memoryAfterGraph.rssMB, memoryAfterGraph.externalMB],
    [memoryAfterSample.label, memoryAfterSample.heapUsedMB, memoryAfterSample.rssMB, memoryAfterSample.externalMB],
    [memoryAfterRun.label, memoryAfterRun.heapUsedMB, memoryAfterRun.rssMB, memoryAfterRun.externalMB],
    [memoryDeltaGraph.label, memoryDeltaGraph.heapUsedMB, memoryDeltaGraph.rssMB, memoryDeltaGraph.externalMB],
    [memoryDeltaRun.label, memoryDeltaRun.heapUsedMB, memoryDeltaRun.rssMB, memoryDeltaRun.externalMB]
  ]
);

console.log("Memory profile saved to results/memory_results.csv");

function buildDashboardExport(
  analysis: GraphAnalysis,
  memoryMB: number,
  users: string[],
  methods: PropagationMethod[],
  engine: RecommendationEngine,
  config: PropagationConfig,
  topK: number
): DashboardExport {
  const recommendations: DashboardRecommendationSet[] = [];

  for (const userId of users) {
    for (const method of methods) {
      const output = engine.recommend(userId, method, config, {
        topK,
        includePaths: true
      });
      recommendations.push({
        userId,
        method,
        items: output.results.map((result) => ({
          itemId: result.itemId,
          score: result.score,
          path: result.path
        }))
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    users,
    methods,
    graphStats: {
      users: analysis.users,
      items: analysis.items,
      interactions: analysis.interactions,
      density: analysis.density,
      sparsity: analysis.sparsity,
      averageDegree: analysis.averageDegree,
      memoryMB
    },
    recommendations
  };
}
