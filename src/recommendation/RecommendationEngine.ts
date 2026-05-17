import { CandidateFilter } from "./CandidateFilter";
import { RankingEngine } from "./RankingEngine";
import { RecommendationPathTracer } from "./RecommendationPathTracer";
import {
  PropagationConfig,
  PropagationMethod,
  RecommendationOutput,
  RecommendationStats,
  RankedRecommendation,
  UserId
} from "../types";
import { GraphStorage } from "../graph/GraphStorage";
import { PropagationEngine } from "../propagation/PropagationEngine";
import { Timer } from "../utils/Timer";

export interface RecommendationOptions {
  topK: number;
  minScore?: number;
  useHeap?: boolean;
  includePaths?: boolean;
  maxPathDepth?: number;
}

export class RecommendationEngine {
  private propagationEngine = new PropagationEngine();

  constructor(private graph: GraphStorage) {}

  recommend(
    userId: UserId,
    method: PropagationMethod,
    config: PropagationConfig,
    options: RecommendationOptions
  ): RecommendationOutput {
    const start = Timer.nowMs();

    const propagationTimer = new Timer();
    propagationTimer.start();
    const propagationResult = this.propagationEngine.run(method, this.graph, userId, config);
    const propagationMs = propagationTimer.stop();

    const seenItems = new Set(
      this.graph.getUserInteractions(userId).map((interaction) => interaction.itemId)
    );

    const filtered = CandidateFilter.filter(
      propagationResult.scores,
      seenItems,
      options.minScore ?? 0
    );

    const rankingTimer = new Timer();
    rankingTimer.start();
    const rankedCandidates = RankingEngine.rank(
      filtered,
      options.topK,
      options.useHeap ?? true
    );
    const rankingMs = rankingTimer.stop();

    const results: RankedRecommendation[] = rankedCandidates.map((candidate, index) => {
      const path = propagationResult.paths.get(candidate.itemId);
      return {
        itemId: candidate.itemId,
        score: candidate.score,
        rank: index + 1,
        method,
        path
      };
    });

    if (options.includePaths !== false) {
      for (const result of results) {
        if (!result.path) {
          result.path = RecommendationPathTracer.trace(
            this.graph,
            userId,
            result.itemId,
            options.maxPathDepth ?? 6
          );
        }
      }
    }

    const stats: RecommendationStats = {
      propagationMs,
      rankingMs,
      totalMs: Timer.nowMs() - start,
      visitedNodes: propagationResult.visitedNodes,
      candidateCount: filtered.size,
      propagatedEdges: propagationResult.propagatedEdges
    };

    return {
      userId,
      method,
      results,
      stats
    };
  }
}
