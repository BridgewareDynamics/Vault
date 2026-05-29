import type { MapDocument, MapListEntry } from '../types';

type MapModule = typeof import('../components/Map/MapModule');

let mapModuleImport: Promise<{ MapModule: MapModule['MapModule'] }> | null = null;
let mapEditorImport: Promise<unknown> | null = null;

let libraryListCache: MapListEntry[] | null = null;
let libraryListCachedAt = 0;
let libraryListInflight: Promise<MapListEntry[] | null> | null = null;

const mapDocumentCache = new Map<string, { doc: MapDocument; cachedAt: number }>();
const mapDocumentInflight = new Map<string, Promise<MapDocument | null>>();

export const MAP_LIBRARY_CACHE_TTL_MS = 30_000;
export const MAP_DOCUMENT_CACHE_TTL_MS = 60_000;

export function loadMapModule() {
  if (!mapModuleImport) {
    mapModuleImport = import('../components/Map/MapModule');
  }
  return mapModuleImport;
}

export function prefetchMapModule(): Promise<unknown> {
  return loadMapModule();
}

export function prefetchMapEditorPage(): Promise<unknown> {
  if (!mapEditorImport) {
    mapEditorImport = import('../components/Map/MapEditorPage');
  }
  return mapEditorImport;
}

export function getCachedMapDocument(mapFolderPath: string): MapDocument | null {
  const cached = mapDocumentCache.get(mapFolderPath);
  if (!cached) {
    return null;
  }
  if (Date.now() - cached.cachedAt >= MAP_DOCUMENT_CACHE_TTL_MS) {
    mapDocumentCache.delete(mapFolderPath);
    return null;
  }
  return cached.doc;
}

export function setCachedMapDocument(mapFolderPath: string, doc: MapDocument | null): void {
  if (!doc) {
    mapDocumentCache.delete(mapFolderPath);
    return;
  }
  mapDocumentCache.set(mapFolderPath, { doc, cachedAt: Date.now() });
}

export async function prefetchMapDocument(mapFolderPath: string): Promise<MapDocument | null> {
  const readMap = window.electronAPI?.readMap;
  if (typeof readMap !== 'function') {
    return null;
  }

  const cached = getCachedMapDocument(mapFolderPath);
  if (cached) {
    return cached;
  }

  let inflight = mapDocumentInflight.get(mapFolderPath);
  if (!inflight) {
    inflight = Promise.resolve(readMap(mapFolderPath))
      .then((doc) => {
        if (!doc) {
          return null;
        }
        const normalized = doc as MapDocument;
        setCachedMapDocument(mapFolderPath, normalized);
        return normalized;
      })
      .catch(() => null)
      .finally(() => {
        mapDocumentInflight.delete(mapFolderPath);
      });
    mapDocumentInflight.set(mapFolderPath, inflight);
  }

  return inflight;
}

export function getCachedMapLibrary(): MapListEntry[] | null {
  return libraryListCache;
}

export function isMapLibraryCacheFresh(maxAgeMs = MAP_LIBRARY_CACHE_TTL_MS): boolean {
  if (!libraryListCache || libraryListCachedAt === 0) {
    return false;
  }
  return Date.now() - libraryListCachedAt < maxAgeMs;
}

export async function prefetchMapLibrary(options?: {
  force?: boolean;
}): Promise<MapListEntry[] | null> {
  if (!window.electronAPI?.listMaps) {
    return null;
  }

  if (!options?.force && isMapLibraryCacheFresh()) {
    return libraryListCache;
  }

  if (!libraryListInflight) {
    libraryListInflight = window.electronAPI
      .listMaps()
      .then((list) => {
        libraryListCache = list as MapListEntry[];
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

export function setCachedMapLibrary(list: MapListEntry[] | null) {
  libraryListCache = list;
  libraryListCachedAt = list ? Date.now() : 0;
}

/** Warm module chunk + map library while the user is still on Welcome. */
export function warmMapEntry(): void {
  void prefetchMapModule();
  void prefetchMapLibrary();
  void prefetchMapEditorPage();
}
