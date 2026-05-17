import { ItemId, RecommendationCandidate } from "../types";

interface HeapItem {
  itemId: ItemId;
  score: number;
}

class MinHeap {
  private data: HeapItem[] = [];

  get size(): number {
    return this.data.length;
  }

  peek(): HeapItem | undefined {
    return this.data[0];
  }

  push(item: HeapItem): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): HeapItem | undefined {
    if (this.data.length === 0) {
      return undefined;
    }
    const root = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0 && last) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return root;
  }

  private bubbleUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.data[parent].score <= this.data[current].score) {
        break;
      }
      [this.data[parent], this.data[current]] = [this.data[current], this.data[parent]];
      current = parent;
    }
  }

  private bubbleDown(index: number): void {
    let current = index;
    const length = this.data.length;
    while (true) {
      const left = current * 2 + 1;
      const right = current * 2 + 2;
      let smallest = current;

      if (left < length && this.data[left].score < this.data[smallest].score) {
        smallest = left;
      }
      if (right < length && this.data[right].score < this.data[smallest].score) {
        smallest = right;
      }
      if (smallest === current) {
        break;
      }
      [this.data[current], this.data[smallest]] = [this.data[smallest], this.data[current]];
      current = smallest;
    }
  }
}

export class RankingEngine {
  static rank(
    candidates: Map<ItemId, number>,
    topK: number,
    useHeap = true
  ): RecommendationCandidate[] {
    if (!useHeap || candidates.size <= topK * 5) {
      return Array.from(candidates.entries())
        .map(([itemId, score]) => ({ itemId, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    }

    const heap = new MinHeap();
    for (const [itemId, score] of candidates.entries()) {
      if (heap.size < topK) {
        heap.push({ itemId, score });
      } else if ((heap.peek()?.score ?? 0) < score) {
        heap.pop();
        heap.push({ itemId, score });
      }
    }

    const result: RecommendationCandidate[] = [];
    while (heap.size > 0) {
      const item = heap.pop();
      if (item) {
        result.push(item);
      }
    }
    return result.sort((a, b) => b.score - a.score);
  }
}
