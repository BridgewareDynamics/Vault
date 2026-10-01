import type { ArchiveCase, ArchiveConfig } from '../types';

import { importModuleWithRetry } from './dynamicImportUtils';

import { isVitestEnv } from './isVitestEnv';



type ArchivePageModule = typeof import('../components/Archive/ArchivePage');



let archivePageImport: Promise<{ ArchivePage: ArchivePageModule['ArchivePage'] }> | null = null;

let heavyDepsImport: Promise<unknown> | null = null;



let configCache: ArchiveConfig | null = null;

let configCachedAt = 0;

let configInflight: Promise<ArchiveConfig | null> | null = null;



let casesCache: ArchiveCase[] | null = null;

let casesCachedAt = 0;

let casesInflight: Promise<ArchiveCase[] | null> | null = null;



export const ARCHIVE_CASES_CACHE_TTL_MS = 30_000;

export const ARCHIVE_CONFIG_CACHE_TTL_MS = 60_000;



function startArchivePageImport(): Promise<{ ArchivePage: ArchivePageModule['ArchivePage'] }> {

  const promise = importModuleWithRetry(() => import('../components/Archive/ArchivePage'));

  archivePageImport = promise.catch((error) => {

    archivePageImport = null;

    throw error;

  });

  return archivePageImport;

}



export function loadArchivePageModule() {

  if (!archivePageImport) {

    return startArchivePageImport();

  }

  return archivePageImport;

}



export function prefetchArchiveModule(): Promise<unknown> {

  return loadArchivePageModule();

}



function startHeavyDepsImport(): Promise<unknown> {

  const promise = importModuleWithRetry(() =>

    Promise.all([

      import('../components/Archive/ArchiveFileViewer'),

      import('../components/SecurityCheckerModal'),

      import('../components/PDFExtractionModal'),

    ]),

  );

  heavyDepsImport = promise.catch((error) => {

    heavyDepsImport = null;

    throw error;

  });

  return heavyDepsImport;

}



/** Prefetch PDF viewer + audit/extraction modals after the archive shell loads. */

export function prefetchArchiveHeavyDeps(): Promise<unknown> {

  if (isVitestEnv()) {

    return Promise.resolve(undefined);

  }



  if (!heavyDepsImport) {

    return startHeavyDepsImport();

  }

  return heavyDepsImport;

}



export function invalidateArchiveModuleCache(): void {

  archivePageImport = null;

  heavyDepsImport = null;

}



export function getCachedArchiveConfig(): ArchiveConfig | null {

  if (!configCache || configCachedAt === 0) {

    return null;

  }

  if (Date.now() - configCachedAt >= ARCHIVE_CONFIG_CACHE_TTL_MS) {

    configCache = null;

    configCachedAt = 0;

    return null;

  }

  return configCache;

}



export function getCachedArchiveCases(): ArchiveCase[] | null {

  return casesCache;

}



export function isArchiveCasesCacheFresh(maxAgeMs = ARCHIVE_CASES_CACHE_TTL_MS): boolean {

  if (!casesCache || casesCachedAt === 0) {

    return false;

  }

  return Date.now() - casesCachedAt < maxAgeMs;

}



export async function prefetchArchiveConfig(options?: {

  force?: boolean;

}): Promise<ArchiveConfig | null> {

  if (!window.electronAPI?.getArchiveConfig) {

    return null;

  }



  if (!options?.force) {

    const cached = getCachedArchiveConfig();

    if (cached) {

      return cached;

    }

  }



  if (!configInflight) {

    configInflight = window.electronAPI

      .getArchiveConfig()

      .then((config) => {

        configCache = config;

        configCachedAt = Date.now();

        return configCache;

      })

      .catch(() => null)

      .finally(() => {

        configInflight = null;

      });

  }



  return configInflight;

}



export async function prefetchArchiveCases(options?: {

  force?: boolean;

}): Promise<ArchiveCase[] | null> {

  if (!window.electronAPI?.listArchiveCases) {

    return null;

  }



  if (!options?.force && isArchiveCasesCacheFresh()) {

    return casesCache;

  }



  if (!casesInflight) {

    casesInflight = window.electronAPI

      .listArchiveCases()

      .then((list) => {

        casesCache = list as ArchiveCase[];

        casesCachedAt = Date.now();

        return casesCache;

      })

      .catch(() => null)

      .finally(() => {

        casesInflight = null;

      });

  }



  return casesInflight;

}



export function setCachedArchiveCases(list: ArchiveCase[] | null): void {

  casesCache = list;

  casesCachedAt = list ? Date.now() : 0;

}



export function invalidateArchiveCasesCache(): void {

  casesCache = null;

  casesCachedAt = 0;

}



export function warmArchiveEntry(): void {

  if (isVitestEnv()) {

    return;

  }



  void prefetchArchiveConfig();

  void prefetchArchiveCases();

  void prefetchArchiveModule()

    .then(() => prefetchArchiveHeavyDeps())

    .catch(() => {

      // Prefetch is best-effort; React lazy load retries when the user opens archive.

    });

}



/** Test-only reset helper. */

export function resetArchivePrefetchForTests(): void {

  invalidateArchiveModuleCache();

  configCache = null;

  configCachedAt = 0;

  configInflight = null;

  casesCache = null;

  casesCachedAt = 0;

  casesInflight = null;

}



if (import.meta.hot) {

  import.meta.hot.dispose(() => {

    invalidateArchiveModuleCache();

  });

}


