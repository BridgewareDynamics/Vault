import type { NovelDocument, NovelListEntry } from '../types';
import { isVitestEnv } from './isVitestEnv';
import { LRUCache } from './lruCache';

type NovelModule = typeof import('../components/Novel/NovelModule');

let novelModuleImport: Promise<{ NovelModule: NovelModule['NovelModule'] }> | null = null;
let novelEditorImport: Promise<unknown> | null = null;

let libraryListCache: NovelListEntry[] | null = null;
let libraryListCachedAt = 0;
let libraryListInflight: Promise<NovelListEntry[] | null> | null = null;

/** Hard cap on cached novel documents so the lazy TTL cache cannot grow unbounded. */
export const NOVEL_DOCUMENT_CACHE_CAPACITY = 12;

const novelDocumentCache = new LRUCache<{ doc: NovelDocument; cachedAt: number }>(
  NOVEL_DOCUMENT_CACHE_CAPACITY,
);
const novelDocumentInflight = new Map<string, Promise<NovelDocument | null>>();

export const NOVEL_LIBRARY_CACHE_TTL_MS = 30_000;
export const NOVEL_DOCUMENT_CACHE_TTL_MS = 60_000;

export function loadNovelModule() {
  if (!novelModuleImport) {
    novelModuleImport = import('../components/Novel/NovelModule');
  }
  return novelModuleImport;
}

export function prefetchNovelModule(): Promise<unknown> {
  return loadNovelModule();
}

export function prefetchNovelEditorPage(): Promise<unknown> {
  if (!novelEditorImport) {
    novelEditorImport = import('../components/Novel/NovelEditorPage');
  }
  return novelEditorImport;
}

export function getCachedNovelDocument(novelFolderPath: string): NovelDocument | null {
  const cached = novelDocumentCache.get(novelFolderPath);
  if (!cached) {
    return null;
  }
  if (Date.now() - cached.cachedAt >= NOVEL_DOCUMENT_CACHE_TTL_MS) {
    novelDocumentCache.delete(novelFolderPath);
    return null;
  }
  return cached.doc;
}

export function setCachedNovelDocument(novelFolderPath: string, doc: NovelDocument | null): void {
  if (!doc) {
    novelDocumentCache.delete(novelFolderPath);
    return;
  }
  novelDocumentCache.set(novelFolderPath, { doc, cachedAt: Date.now() });
}

/** Drop all cached novel documents (e.g. on memory pressure). */
export function clearNovelDocumentCache(): void {
  novelDocumentCache.clear();
}

export async function prefetchNovelDocument(novelFolderPath: string): Promise<NovelDocument | null> {
  const readNovel = window.electronAPI?.readNovel;
  if (typeof readNovel !== 'function') {
    return null;
  }

  const cached = getCachedNovelDocument(novelFolderPath);
  if (cached) {
    return cached;
  }

  let inflight = novelDocumentInflight.get(novelFolderPath);
  if (!inflight) {
    inflight = Promise.resolve(readNovel(novelFolderPath))
      .then((doc) => {
        if (!doc) {
          return null;
        }
        const normalized = doc as NovelDocument;
        setCachedNovelDocument(novelFolderPath, normalized);
        return normalized;
      })
      .catch(() => null)
      .finally(() => {
        novelDocumentInflight.delete(novelFolderPath);
      });
    novelDocumentInflight.set(novelFolderPath, inflight);
  }

  return inflight;
}

export function getCachedNovelLibrary(): NovelListEntry[] | null {
  return libraryListCache;
}

export function isNovelLibraryCacheFresh(maxAgeMs = NOVEL_LIBRARY_CACHE_TTL_MS): boolean {
  if (!libraryListCache || libraryListCachedAt === 0) {
    return false;
  }
  return Date.now() - libraryListCachedAt < maxAgeMs;
}

export async function prefetchNovelLibrary(options?: {
  force?: boolean;
}): Promise<NovelListEntry[] | null> {
  if (!window.electronAPI?.listNovels) {
    return null;
  }

  if (!options?.force && isNovelLibraryCacheFresh()) {
    return libraryListCache;
  }

  if (!libraryListInflight) {
    libraryListInflight = window.electronAPI
      .listNovels()
      .then((list) => {
        libraryListCache = list as NovelListEntry[];
        libraryListCachedAt = Date.now();
        return libraryListCache;
      })
      .catch(() => null)
      .finally(() => {
        libraryListInflight = null;
      });
  }

  return libraryListInflight;
}

export function setCachedNovelLibrary(list: NovelListEntry[] | null) {
  libraryListCache = list;
  libraryListCachedAt = list ? Date.now() : 0;
}

export function warmNovelEntry(): void {
  if (isVitestEnv()) {
    return;
  }

  void prefetchNovelModule();
  void prefetchNovelLibrary();
  void prefetchNovelEditorPage();
}
