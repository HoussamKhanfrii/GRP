export interface PerformanceSample {
  runtimeMs: number;
  propagationMs: number;
  rankingMs: number;
  visitedNodes: number;
  candidateCount: number;
  propagatedEdges: number;
}

export interface PerformanceSummary {
  avgRuntimeMs: number;
  avgPropagationMs: number;
  avgRankingMs: number;
  avgVisitedNodes: number;
  avgCandidateCount: number;
  avgPropagatedEdges: number;
}

export class PerformanceMetrics {
  private samples: PerformanceSample[] = [];

  add(sample: PerformanceSample): void {
    this.samples.push(sample);
  }

  summarize(): PerformanceSummary {
    if (this.samples.length === 0) {
      return {
        avgRuntimeMs: 0,
        avgPropagationMs: 0,
        avgRankingMs: 0,
        avgVisitedNodes: 0,
        avgCandidateCount: 0,
        avgPropagatedEdges: 0
      };
    }

    const totals = this.samples.reduce(
      (acc, sample) => {
        acc.runtimeMs += sample.runtimeMs;
        acc.propagationMs += sample.propagationMs;
        acc.rankingMs += sample.rankingMs;
        acc.visitedNodes += sample.visitedNodes;
        acc.candidateCount += sample.candidateCount;
        acc.propagatedEdges += sample.propagatedEdges;
        return acc;
      },
      {
        runtimeMs: 0,
        propagationMs: 0,
        rankingMs: 0,
        visitedNodes: 0,
        candidateCount: 0,
        propagatedEdges: 0
      }
    );

    const count = this.samples.length;
    return {
      avgRuntimeMs: totals.runtimeMs / count,
      avgPropagationMs: totals.propagationMs / count,
      avgRankingMs: totals.rankingMs / count,
      avgVisitedNodes: totals.visitedNodes / count,
      avgCandidateCount: totals.candidateCount / count,
      avgPropagatedEdges: totals.propagatedEdges / count
    };
  }
}
