export class Timer {
  private startTime = 0;

  start(): void {
    this.startTime = Timer.nowMs();
  }

  stop(): number {
    const end = Timer.nowMs();
    return end - this.startTime;
  }

  static nowMs(): number {
    if (typeof performance !== "undefined" && performance.now) {
      return performance.now();
    }
    return Number(process.hrtime.bigint()) / 1_000_000;
  }
}
