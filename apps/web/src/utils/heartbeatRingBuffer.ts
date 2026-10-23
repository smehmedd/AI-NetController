import { HeartbeatMetrics } from '../types';

export class HeartbeatRingBuffer {
  private buffer: number[];
  private capacity: number;
  private head: number = 0;
  private count: number = 0;

  constructor(capacity = 20, initialValues: number[] = [14, 16, 15, 18, 14, 15, 17, 16, 14, 15]) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(0);
    for (const val of initialValues) {
      this.push(val);
    }
  }

  public push(value: number): void {
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  public toArray(): number[] {
    if (this.count === 0) return [15];
    const result: number[] = new Array(this.count);
    const start = this.count < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      result[i] = this.buffer[(start + i) % this.capacity];
    }
    return result;
  }

  public getMetrics(currentLatency: number | null, status: 'idle' | 'healthy' | 'warning' | 'unreachable'): HeartbeatMetrics {
    const history = this.toArray();
    const current = currentLatency ?? history[history.length - 1] ?? 15;
    let min = history[0];
    let max = history[0];
    let sum = 0;

    for (let i = 0; i < history.length; i++) {
      const v = history[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }

    const avg = Math.round(sum / history.length);

    let jitterSum = 0;
    for (let i = 1; i < history.length; i++) {
      jitterSum += Math.abs(history[i] - history[i - 1]);
    }
    const jitter = history.length > 1 ? Math.round((jitterSum / (history.length - 1)) * 10) / 10 : 1.5;

    return {
      currentLatencyMs: current,
      history,
      jitterMs: jitter,
      minLatencyMs: min,
      maxLatencyMs: max,
      avgLatencyMs: avg,
      status
    };
  }
}
