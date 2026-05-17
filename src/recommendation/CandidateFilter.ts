import { ItemId } from "../types";

export class CandidateFilter {
  static filter(
    candidates: Map<ItemId, number>,
    seenItems: Set<ItemId>,
    minScore = 0
  ): Map<ItemId, number> {
    const filtered = new Map<ItemId, number>();
    for (const [itemId, score] of candidates.entries()) {
      if (seenItems.has(itemId)) {
        continue;
      }
      if (score < minScore) {
        continue;
      }
      filtered.set(itemId, score);
    }
    return filtered;
  }
}
