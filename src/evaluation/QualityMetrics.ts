import { ItemId } from "../types";

export class QualityMetrics {
  static precisionAtK(recommended: ItemId[], relevant: Set<ItemId>, k: number): number {
    const slice = recommended.slice(0, k);
    const hits = slice.filter((item) => relevant.has(item)).length;
    return slice.length > 0 ? hits / slice.length : 0;
  }

  static recallAtK(recommended: ItemId[], relevant: Set<ItemId>, k: number): number {
    const slice = recommended.slice(0, k);
    const hits = slice.filter((item) => relevant.has(item)).length;
    return relevant.size > 0 ? hits / relevant.size : 0;
  }

  static f1AtK(precision: number, recall: number): number {
    return precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  }

  static ndcgAtK(recommended: ItemId[], relevant: Set<ItemId>, k: number): number {
    const slice = recommended.slice(0, k);
    let dcg = 0;
    for (let i = 0; i < slice.length; i += 1) {
      if (relevant.has(slice[i])) {
        dcg += 1 / Math.log2(i + 2);
      }
    }

    const idealHits = Math.min(k, relevant.size);
    let idcg = 0;
    for (let i = 0; i < idealHits; i += 1) {
      idcg += 1 / Math.log2(i + 2);
    }

    return idcg > 0 ? dcg / idcg : 0;
  }

  static hitRateAtK(recommended: ItemId[], relevant: Set<ItemId>, k: number): number {
    const slice = recommended.slice(0, k);
    return slice.some((item) => relevant.has(item)) ? 1 : 0;
  }

  static coverage(recommendations: Map<string, ItemId[]>, totalItems: number): number {
    const unique = new Set<ItemId>();
    for (const items of recommendations.values()) {
      for (const item of items) {
        unique.add(item);
      }
    }
    return totalItems > 0 ? unique.size / totalItems : 0;
  }
}
