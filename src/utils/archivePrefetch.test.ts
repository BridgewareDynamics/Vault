import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCachedArchiveCases,
  invalidateArchiveCasesCache,
  isArchiveCasesCacheFresh,
  prefetchArchiveCases,
  prefetchArchiveHeavyDeps,
  resetArchivePrefetchForTests,
  setCachedArchiveCases,
  warmArchiveEntry,
} from './archivePrefetch';
import * as archivePrefetch from './archivePrefetch';

describe('archivePrefetch', () => {
  beforeEach(() => {
    invalidateArchiveCasesCache();
    window.electronAPI = {
      listArchiveCases: vi.fn().mockResolvedValue([
        { name: 'Case A', path: '/vault/case-a' },
      ]),
    } as unknown as typeof window.electronAPI;
  });

  afterEach(() => {
    resetArchivePrefetchForTests();
  });

  it('deduplicates concurrent case list prefetches', async () => {
    const first = prefetchArchiveCases({ force: true });
    const second = prefetchArchiveCases({ force: true });

    await Promise.all([first, second]);

    expect(window.electronAPI!.listArchiveCases).toHaveBeenCalledTimes(1);
    expect(getCachedArchiveCases()).toEqual([{ name: 'Case A', path: '/vault/case-a' }]);
  });

  it('returns fresh cache without refetching', async () => {
    setCachedArchiveCases([{ name: 'Cached', path: '/vault/cached' }]);
    expect(isArchiveCasesCacheFresh()).toBe(true);

    const result = await prefetchArchiveCases();

    expect(result).toEqual([{ name: 'Cached', path: '/vault/cached' }]);
    expect(window.electronAPI!.listArchiveCases).not.toHaveBeenCalled();
  });

  it('skips warmArchiveEntry under vitest', () => {
    const moduleSpy = vi.spyOn(archivePrefetch, 'prefetchArchiveModule');
    const heavySpy = vi.spyOn(archivePrefetch, 'prefetchArchiveHeavyDeps');

    warmArchiveEntry();

    expect(moduleSpy).not.toHaveBeenCalled();
    expect(heavySpy).not.toHaveBeenCalled();

    moduleSpy.mockRestore();
    heavySpy.mockRestore();
  });

  it('skips heavy dep imports under vitest', async () => {
    resetArchivePrefetchForTests();
    await expect(prefetchArchiveHeavyDeps()).resolves.toBeUndefined();
  });
});
