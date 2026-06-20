import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getActiveThumbnailLoadCount,
  getInflightThumbnailCount,
  getThumbnailFromCache,
  hasThumbnailInCache,
  requestThumbnail,
  resetThumbnailServiceForTests,
  setThumbnailInCache,
  THUMBNAIL_CONCURRENCY,
  THUMBNAIL_LRU_CAPACITY,
} from './thumbnailService';

describe('thumbnailService', () => {
  afterEach(() => {
    resetThumbnailServiceForTests();
    vi.restoreAllMocks();
  });

  it('returns cached thumbnails without calling loader', async () => {
    setThumbnailInCache('/file.pdf', 'data:image/jpeg;base64,cached');
    const loader = vi.fn(async () => 'data:image/jpeg;base64,new');

    const result = await requestThumbnail('/file.pdf', loader);

    expect(result).toBe('data:image/jpeg;base64,cached');
    expect(loader).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent requests for the same path', async () => {
    let resolveLoad: ((value: string) => void) | undefined;
    const loader = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const first = requestThumbnail('/same.pdf', loader);
    const second = requestThumbnail('/same.pdf', loader);

    await vi.waitFor(() => {
      expect(getInflightThumbnailCount()).toBe(1);
      expect(loader).toHaveBeenCalledTimes(1);
    });

    resolveLoad?.('data:image/jpeg;base64,shared');
    await expect(first).resolves.toBe('data:image/jpeg;base64,shared');
    await expect(second).resolves.toBe('data:image/jpeg;base64,shared');
    expect(hasThumbnailInCache('/same.pdf')).toBe(true);
  });

  it('keys requests by maxSize so different sizes do not collide', async () => {
    const loader240 = vi.fn(async () => 'data:image/jpeg;base64,small');
    const loader480 = vi.fn(async () => 'data:image/jpeg;base64,large');

    const small = await requestThumbnail('/doc.pdf', loader240, 240);
    const large = await requestThumbnail('/doc.pdf', loader480, 480);

    expect(small).toBe('data:image/jpeg;base64,small');
    expect(large).toBe('data:image/jpeg;base64,large');
    expect(loader240).toHaveBeenCalledTimes(1);
    expect(loader480).toHaveBeenCalledTimes(1);

    // A repeat request at the same size is served from cache (no new load).
    const smallAgain = await requestThumbnail('/doc.pdf', loader240, 240);
    expect(smallAgain).toBe('data:image/jpeg;base64,small');
    expect(loader240).toHaveBeenCalledTimes(1);
  });

  it('respects concurrency cap', async () => {
    const releaseResolvers: Array<(value: string) => void> = [];
    const loader = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          releaseResolvers.push(resolve);
        }),
    );

    const pending = Array.from({ length: THUMBNAIL_CONCURRENCY + 2 }, (_, index) =>
      requestThumbnail(`/file-${index}.pdf`, loader),
    );

    await vi.waitFor(() => {
      expect(getActiveThumbnailLoadCount()).toBe(THUMBNAIL_CONCURRENCY);
    });
    expect(loader).toHaveBeenCalledTimes(THUMBNAIL_CONCURRENCY);

    while (releaseResolvers.length > 0) {
      releaseResolvers.shift()?.('data:image/jpeg;base64,done');
      await Promise.resolve();
    }

    await Promise.all(pending);
    expect(getActiveThumbnailLoadCount()).toBe(0);
  });

  it('evicts least recently used entries at capacity', async () => {
    for (let index = 0; index < THUMBNAIL_LRU_CAPACITY; index += 1) {
      setThumbnailInCache(`/file-${index}.pdf`, `thumb-${index}`);
    }

    await requestThumbnail('/file-new.pdf', async () => 'thumb-new');

    expect(getThumbnailFromCache('/file-0.pdf')).toBeUndefined();
    expect(getThumbnailFromCache('/file-new.pdf')).toBe('thumb-new');
  });
});
