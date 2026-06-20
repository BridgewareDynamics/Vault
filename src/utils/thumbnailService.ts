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
 * Build the cache/dedup key for a thumbnail request. Size-dependent renders
 * (e.g. PDF page previews at 240px vs 480px) must NOT collide on `filePath`
 * alone, so the requested max size is folded into the key when provided. File
 * thumbnails that have a single canonical size pass no size and key on the path.
 */
function buildThumbnailKey(filePath: string, maxSize?: number): string {
  return maxSize == null ? filePath : `${filePath}@${maxSize}`;
}

/**
 * Shared thumbnail loader: memory cache, inflight dedup, and bounded concurrency.
 *
 * @param maxSize Optional pixel size that distinguishes differently-sized renders
 *   of the same file so they are cached and deduped independently.
 */
export async function requestThumbnail(
  filePath: string,
  loader: () => Promise<string>,
  maxSize?: number,
): Promise<string> {
  const key = buildThumbnailKey(filePath, maxSize);

  const cached = memoryCache.get(key);
  if (cached) {
    return cached;
  }

  const existing = inflight.get(key);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    await acquireSlot();
    try {
      const cachedAfterWait = memoryCache.get(key);
      if (cachedAfterWait) {
        return cachedAfterWait;
      }

      const thumbnail = await loader();
      memoryCache.set(key, thumbnail);
      return thumbnail;
    } finally {
      releaseSlot();
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Test-only reset helper. */
export function resetThumbnailServiceForTests(): void {
  memoryCache.clear();
  inflight.clear();
  activeLoads = 0;
  waitQueue.length = 0;
}
