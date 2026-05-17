import { ItemId } from "../types";

export class PropagationVisualizer {
  static topScores(scores: Map<ItemId, number>, topK = 10): Array<{ itemId: ItemId; score: number }> {
    return Array.from(scores.entries())
      .map(([itemId, score]) => ({ itemId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  static scoreHistogram(scores: Map<ItemId, number>, bins = 5): Array<{ bucket: string; count: number }> {
    const values = Array.from(scores.values());
    if (values.length === 0) {
      return [];
    }
    const max = Math.max(...values);
    const min = Math.min(...values);
    const step = (max - min) / bins || 1;
    const buckets = Array.from({ length: bins }, () => 0);

    for (const value of values) {
      const index = Math.min(bins - 1, Math.floor((value - min) / step));
      buckets[index] += 1;
    }

    return buckets.map((count, index) => {
      const start = min + index * step;
      const end = start + step;
      return { bucket: `${start.toFixed(2)}-${end.toFixed(2)}`, count };
    });
  }
}
