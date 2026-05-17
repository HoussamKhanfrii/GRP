import { BenchmarkResult, ItemId, Interaction, PropagationConfig, PropagationMethod, UserId } from "../types";
import { GraphStorage } from "../graph/GraphStorage";
import { RecommendationEngine } from "../recommendation/RecommendationEngine";
import { QualityMetrics } from "./QualityMetrics";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { MemoryProfiler } from "./MemoryProfiler";
import { Random } from "../utils/Random";

export interface BenchmarkOptions {
  topK: number;
  methods: PropagationMethod[];
  config: PropagationConfig;
  userSampleSize?: number;
  seed?: number;
}

export class BenchmarkRunner {
  static run(
    graph: GraphStorage,
    train: Interaction[],
    test: Interaction[],
    options: BenchmarkOptions
  ): BenchmarkResult[] {
    const engine = new RecommendationEngine(graph);
    const testByUser = BenchmarkRunner.groupByUser(test);
    const users = BenchmarkRunner.sampleUsers(train, options.userSampleSize ?? 50, options.seed ?? 1);

    const results: BenchmarkResult[] = [];

    for (const method of options.methods) {
      const perf = new PerformanceMetrics();
      const recommendationsByUser = new Map<UserId, ItemId[]>();
      const memoryBefore = MemoryProfiler.snapshot(`${method}_before`);

      let precisionSum = 0;
      let recallSum = 0;
      let f1Sum = 0;
      let ndcgSum = 0;
      let hitRateSum = 0;
      let count = 0;

      for (const userId of users) {
        const relevant = testByUser.get(userId);
        if (!relevant || relevant.size === 0) {
          continue;
        }
        const output = engine.recommend(userId, method, options.config, {
          topK: options.topK,
          minScore: 0,
          useHeap: true,
          includePaths: false
        });

        const recommendedItems = output.results.map((r) => r.itemId);
        recommendationsByUser.set(userId, recommendedItems);

        const precision = QualityMetrics.precisionAtK(recommendedItems, relevant, options.topK);
        const recall = QualityMetrics.recallAtK(recommendedItems, relevant, options.topK);
        const f1 = QualityMetrics.f1AtK(precision, recall);
        const ndcg = QualityMetrics.ndcgAtK(recommendedItems, relevant, options.topK);
        const hitRate = QualityMetrics.hitRateAtK(recommendedItems, relevant, options.topK);

        precisionSum += precision;
        recallSum += recall;
        f1Sum += f1;
        ndcgSum += ndcg;
        hitRateSum += hitRate;
        count += 1;

        perf.add({
          runtimeMs: output.stats.totalMs,
          propagationMs: output.stats.propagationMs,
          rankingMs: output.stats.rankingMs,
          visitedNodes: output.stats.visitedNodes,
          candidateCount: output.stats.candidateCount,
          propagatedEdges: output.stats.propagatedEdges
        });
      }

      const summary = perf.summarize();
      const memoryAfter = MemoryProfiler.snapshot(`${method}_after`);
      const memoryDiff = MemoryProfiler.diff(memoryBefore, memoryAfter);
      const coverage = QualityMetrics.coverage(recommendationsByUser, graph.getAllItems().length);
      const denom = count === 0 ? 1 : count;

      results.push({
        method,
        precisionAtK: precisionSum / denom,
        recallAtK: recallSum / denom,
        f1AtK: f1Sum / denom,
        ndcgAtK: ndcgSum / denom,
        hitRateAtK: hitRateSum / denom,
        coverage,
        avgRuntimeMs: summary.avgRuntimeMs,
        avgMemoryMB: memoryDiff.heapUsedMB,
        avgVisitedNodes: summary.avgVisitedNodes,
        avgCandidateCount: summary.avgCandidateCount,
        avgPropagatedEdges: summary.avgPropagatedEdges
      });
    }

    return results;
  }

  private static groupByUser(interactions: Interaction[]): Map<UserId, Set<ItemId>> {
    const map = new Map<UserId, Set<ItemId>>();
    for (const interaction of interactions) {
      if (!map.has(interaction.userId)) {
        map.set(interaction.userId, new Set());
      }
      map.get(interaction.userId)?.add(interaction.itemId);
    }
    return map;
  }

  private static sampleUsers(interactions: Interaction[], count: number, seed: number): UserId[] {
    const unique = Array.from(new Set(interactions.map((interaction) => interaction.userId)));
    const random = new Random(seed);
    random.shuffle(unique);
    return unique.slice(0, Math.min(count, unique.length));
  }
}
