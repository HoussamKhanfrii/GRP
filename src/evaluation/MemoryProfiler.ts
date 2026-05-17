import { MemorySnapshot } from "../types";

export class MemoryProfiler {
  static snapshot(label: string): MemorySnapshot {
    const usage = process.memoryUsage();
    return {
      label,
      heapUsedMB: MemoryProfiler.toMb(usage.heapUsed),
      rssMB: MemoryProfiler.toMb(usage.rss),
      externalMB: MemoryProfiler.toMb(usage.external)
    };
  }

  static diff(before: MemorySnapshot, after: MemorySnapshot): MemorySnapshot {
    return {
      label: `${before.label}_to_${after.label}`,
      heapUsedMB: after.heapUsedMB - before.heapUsedMB,
      rssMB: after.rssMB - before.rssMB,
      externalMB: after.externalMB - before.externalMB
    };
  }

  private static toMb(bytes: number): number {
    return Math.round((bytes / (1024 * 1024)) * 100) / 100;
  }
}
