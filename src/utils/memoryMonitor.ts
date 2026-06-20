/**
 * Memory monitoring utilities for tracking and managing memory usage
 */

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Get current memory usage if available
 */
export function getMemoryInfo(): MemoryInfo | null {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize || 0,
      totalJSHeapSize: memory.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory.jsHeapSizeLimit || 0,
    };
  }
  return null;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get memory usage percentage (0-100)
 */
export function getMemoryUsagePercent(): number | null {
  const info = getMemoryInfo();
  if (!info || info.jsHeapSizeLimit === 0) {
    return null;
  }
  return Math.round((info.usedJSHeapSize / info.jsHeapSizeLimit) * 100);
}

/**
 * Check if memory usage is high (above threshold)
 */
export function isMemoryHigh(threshold: number = 80): boolean {
  const percent = getMemoryUsagePercent();
  return percent !== null && percent > threshold;
}

/**
 * Request garbage collection if available (requires --js-flags=--expose-gc)
 */
export function requestGarbageCollection(): void {
  if (typeof globalThis !== 'undefined' && (globalThis as any).gc) {
    try {
      (globalThis as any).gc();
    } catch (e) {
      // Ignore errors
    }
  }
}

export function isMemoryOverLimit(
  info: MemoryInfo,
  options: { maxUsedBytes?: number | null; thresholdPercent?: number },
): boolean {
  const maxUsedBytes = options.maxUsedBytes ?? null;
  if (maxUsedBytes !== null) {
    return info.usedJSHeapSize > maxUsedBytes;
  }
  return isMemoryHigh(options.thresholdPercent ?? 80);
}

export interface MemoryMonitorOptions {
  /** Percent of jsHeapSizeLimit (used when maxUsedBytes is not set). */
  thresholdPercent?: number;
  /** Absolute used-heap limit in bytes (preferred for user RAM settings). */
  maxUsedBytes?: number;
  intervalMs?: number;
}

/**
 * Monitor memory and trigger cleanup callbacks when threshold is exceeded
 */
export class MemoryMonitor {
  private checkInterval: number | null = null;
  private thresholdPercent: number;
  private maxUsedBytes: number | null;
  private onHighMemory: (info: MemoryInfo) => void;
  private intervalMs: number;

  constructor(
    onHighMemory: (info: MemoryInfo) => void,
    thresholdOrOptions: number | MemoryMonitorOptions = 80,
    intervalMs?: number,
  ) {
    this.onHighMemory = onHighMemory;

    if (typeof thresholdOrOptions === 'number') {
      this.thresholdPercent = thresholdOrOptions;
      this.maxUsedBytes = null;
      this.intervalMs = intervalMs ?? 5000;
      return;
    }

    this.thresholdPercent = thresholdOrOptions.thresholdPercent ?? 80;
    this.maxUsedBytes = thresholdOrOptions.maxUsedBytes ?? null;
    this.intervalMs = thresholdOrOptions.intervalMs ?? 5000;
  }

  start(): void {
    if (this.checkInterval !== null) {
      return; // Already started
    }

    this.checkInterval = window.setInterval(() => {
      const info = getMemoryInfo();
      if (!info) {
        return;
      }

      const overByteLimit =
        this.maxUsedBytes !== null &&
        isMemoryOverLimit(info, { maxUsedBytes: this.maxUsedBytes });
      const overPercentLimit =
        this.maxUsedBytes === null &&
        isMemoryOverLimit(info, { thresholdPercent: this.thresholdPercent });

      if (overByteLimit || overPercentLimit) {
        this.onHighMemory(info);
      }
    }, this.intervalMs);
  }

  stop(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  isRunning(): boolean {
    return this.checkInterval !== null;
  }
}














