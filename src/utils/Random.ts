export class Random {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }

  int(min: number, max: number): number {
    const value = Math.floor(this.next() * (max - min + 1)) + min;
    return value;
  }

  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(items: T[]): T {
    return items[this.int(0, items.length - 1)];
  }

  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  weightedIndex(weights: number[]): number {
    const total = weights.reduce((sum, w) => sum + w, 0);
    if (total <= 0) {
      return this.int(0, weights.length - 1);
    }
    const r = this.next() * total;
    let acc = 0;
    for (let i = 0; i < weights.length; i += 1) {
      acc += weights[i];
      if (r <= acc) {
        return i;
      }
    }
    return weights.length - 1;
  }
}
