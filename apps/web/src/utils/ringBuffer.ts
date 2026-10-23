/**
 * CST NetController AI - High-Performance Memory Pool & Fixed-Capacity Circular Ring Buffer
 * 
 * Provides zero-allocation, pre-allocated storage for continuous telemetry samples and logs.
 * Prevents main-thread generational GC pauses and inline-cache deoptimizations.
 */

export class CircularRingBuffer<T> {
  private buffer: (T | null)[];
  private capacity: number;
  private head: number = 0;
  private count: number = 0;

  constructor(capacity: number, initialValues: T[] = []) {
    if (capacity <= 0) {
      throw new Error('RingBuffer capacity must be strictly greater than 0');
    }
    this.capacity = capacity;
    this.buffer = new Array<T | null>(capacity).fill(null);

    for (let i = 0; i < initialValues.length; i++) {
      this.push(initialValues[i]);
    }
  }

  public push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  public get size(): number {
    return this.count;
  }

  public get maxCapacity(): number {
    return this.capacity;
  }

  public clear(): void {
    this.buffer.fill(null);
    this.head = 0;
    this.count = 0;
  }

  public latest(): T | null {
    if (this.count === 0) return null;
    const idx = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[idx];
  }

  public toArray(): T[] {
    if (this.count === 0) return [];
    const result = new Array<T>(this.count);
    const start = this.count < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      result[i] = this.buffer[(start + i) % this.capacity] as T;
    }
    return result;
  }
}
