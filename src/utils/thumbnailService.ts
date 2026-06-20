import { LRUCache } from './lruCache';

export const THUMBNAIL_LRU_CAPACITY = 400;
export const THUMBNAIL_CONCURRENCY = 4;

const memoryCache = new LRUCache<string>(THUMBNAIL_LRU_CAPACITY);
const inflight = new Map<string, Promise<string>>();

let activeLoads = 0;
const waitQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeLoads < THUMBNAIL_CONCURRENCY) {
    activeLoads += 1;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    waitQueue.push(() => {
      activeLoads += 1;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeLoads = Math.max(0, activeLoads - 1);
  const next = waitQueue.shift();
  if (next) {
    next();
  }
}

export function getThumbnailMemoryCache(): LRUCache<string> {
  return memoryCache;
}

export function getThumbnailFromCache(filePath: string): string | undefined {
  return memoryCache.get(filePath);
}

export function hasThumbnailInCache(filePath: string): boolean {
  return memoryCache.has(filePath);
}

export function setThumbnailInCache(filePath: string, thumbnail: string): void {
  memoryCache.set(filePath, thumbnail);
}

export function deleteThumbnailFromCache(filePath: string): void {
  memoryCache.delete(filePath);
}

export function getActiveThumbnailLoadCount(): number {
  return activeLoads;
}

export function getInflightThumbnailCount(): number {
  return inflight.size;
}

/**
 * Shared thumbnail loader: memory cache, inflight dedup, and bounded concurrency.
 */
export async function requestThumbnail(
  filePath: string,
  loader: () => Promise<string>,
): Promise<string> {
  const cached = memoryCache.get(filePath);
  if (cached) {
    return cached;
  }

  const existing = inflight.get(filePath);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    await acquireSlot();
    try {
      const cachedAfterWait = memoryCache.get(filePath);
      if (cachedAfterWait) {
        return cachedAfterWait;
      }

      const thumbnail = await loader();
      memoryCache.set(filePath, thumbnail);
      return thumbnail;
    } finally {
      releaseSlot();
      inflight.delete(filePath);
    }
  })();

  inflight.set(filePath, promise);
  return promise;
}

/** Test-only reset helper. */
export function resetThumbnailServiceForTests(): void {
  memoryCache.clear();
  inflight.clear();
  activeLoads = 0;
  waitQueue.length = 0;
}
