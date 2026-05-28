import type { MapListEntry } from '../types';

type MapModule = typeof import('../components/Map/MapModule');

let mapModuleImport: Promise<{ MapModule: MapModule['MapModule'] }> | null = null;

let libraryListCache: MapListEntry[] | null = null;
let libraryListCachedAt = 0;
let libraryListInflight: Promise<MapListEntry[] | null> | null = null;

export const MAP_LIBRARY_CACHE_TTL_MS = 30_000;

export function loadMapModule() {
  if (!mapModuleImport) {
    mapModuleImport = import('../components/Map/MapModule');
  }
  return mapModuleImport;
}

export function prefetchMapModule(): Promise<unknown> {
  return loadMapModule();
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
}
