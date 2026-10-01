import { describe, expect, it } from 'vitest';
import { isMemoryOverLimit } from './memoryMonitor';

describe('isMemoryOverLimit', () => {
  const info = {
    usedJSHeapSize: 600 * 1024 * 1024,
    totalJSHeapSize: 800 * 1024 * 1024,
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
  };

  it('uses maxUsedBytes when configured', () => {
    expect(isMemoryOverLimit(info, { maxUsedBytes: 512 * 1024 * 1024 })).toBe(true);
    expect(isMemoryOverLimit(info, { maxUsedBytes: 1024 * 1024 * 1024 })).toBe(false);
  });

  it('falls back to heap percentage when maxUsedBytes is not set', () => {
    const lowUsage = {
      ...info,
      usedJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
    };

    expect(isMemoryOverLimit(lowUsage, { thresholdPercent: 80 })).toBe(false);
  });
});
