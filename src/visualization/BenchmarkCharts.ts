import { BenchmarkResult } from "../types";

export class BenchmarkCharts {
  static methodComparison(results: BenchmarkResult[]): Array<Record<string, number | string>> {
    return results.map((result) => ({
      method: result.method,
      precision: Number(result.precisionAtK.toFixed(4)),
      recall: Number(result.recallAtK.toFixed(4)),
      ndcg: Number(result.ndcgAtK.toFixed(4)),
      runtimeMs: Number(result.avgRuntimeMs.toFixed(2)),
      memoryMB: Number(result.avgMemoryMB.toFixed(2))
    }));
  }
}
