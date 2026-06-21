import { describe, expect, it, vi } from 'vitest';
import { importModuleWithRetry, isDynamicImportFetchFailure } from './dynamicImportUtils';

describe('dynamicImportUtils', () => {
  it('detects stale dynamic import fetch failures', () => {
    expect(
      isDynamicImportFetchFailure(
        new TypeError('Failed to fetch dynamically imported module: http://localhost/src/Foo.tsx'),
      ),
    ).toBe(true);
    expect(isDynamicImportFetchFailure(new Error('Something else'))).toBe(false);
  });

  it('retries once after a stale dynamic import failure', async () => {
    const importFn = vi
      .fn<[], Promise<{ ok: true }>>()
      .mockRejectedValueOnce(
        new TypeError('Failed to fetch dynamically imported module: http://localhost/src/Foo.tsx'),
      )
      .mockResolvedValueOnce({ ok: true });

    await expect(importModuleWithRetry(importFn)).resolves.toEqual({ ok: true });
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-import errors', async () => {
    const importFn = vi.fn().mockRejectedValue(new Error('Permission denied'));

    await expect(importModuleWithRetry(importFn)).rejects.toThrow('Permission denied');
    expect(importFn).toHaveBeenCalledTimes(1);
  });
});
