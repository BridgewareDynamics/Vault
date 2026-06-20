import type {
  TranscriptionEngineStatus,
  TranscriptionListEntry,
} from '../types';
import { isVitestEnv } from './isVitestEnv';

type TranscriptionModule = typeof import('../components/Transcription/TranscriptionModule');

let transcriptionModuleImport: Promise<{ TranscriptionModule: TranscriptionModule['TranscriptionModule'] }> | null =
  null;

let engineStatusCache: TranscriptionEngineStatus | null = null;
let engineStatusInflight: Promise<TranscriptionEngineStatus | null> | null = null;

let libraryListCache: TranscriptionListEntry[] | null = null;
let libraryListCachedAt = 0;
let libraryListInflight: Promise<TranscriptionListEntry[] | null> | null = null;

export const TRANSCRIPTION_LIBRARY_CACHE_TTL_MS = 30_000;

export function loadTranscriptionModule() {
  if (!transcriptionModuleImport) {
    transcriptionModuleImport = import('../components/Transcription/TranscriptionModule');
  }
  return transcriptionModuleImport;
}

export function prefetchTranscriptionModule(): Promise<unknown> {
  return loadTranscriptionModule();
}

export function getCachedTranscriptionEngineStatus(): TranscriptionEngineStatus | null {
  return engineStatusCache;
}

export async function prefetchTranscriptionEngineStatus(): Promise<TranscriptionEngineStatus | null> {
  if (!window.electronAPI?.getTranscriptionEngineStatus) {
    return null;
  }

  if (engineStatusCache) {
    return engineStatusCache;
  }

  if (!engineStatusInflight) {
    engineStatusInflight = window.electronAPI
      .getTranscriptionEngineStatus()
      .then((status) => {
        engineStatusCache = status;
        return status;
      })
      .catch(() => null)
      .finally(() => {
        engineStatusInflight = null;
      });
  }

  return engineStatusInflight;
}

export function setCachedTranscriptionEngineStatus(status: TranscriptionEngineStatus | null) {
  engineStatusCache = status;
}

export function getCachedTranscriptionLibrary(): TranscriptionListEntry[] | null {
  return libraryListCache;
}

export function isTranscriptionLibraryCacheFresh(
  maxAgeMs = TRANSCRIPTION_LIBRARY_CACHE_TTL_MS
): boolean {
  if (!libraryListCache || libraryListCachedAt === 0) {
    return false;
  }
  return Date.now() - libraryListCachedAt < maxAgeMs;
}

export async function prefetchTranscriptionLibrary(options?: {
  force?: boolean;
}): Promise<TranscriptionListEntry[] | null> {
  if (!window.electronAPI?.listTranscriptions) {
    return null;
  }

  if (!options?.force && isTranscriptionLibraryCacheFresh()) {
    return libraryListCache;
  }

  if (!libraryListInflight) {
    libraryListInflight = window.electronAPI
      .listTranscriptions()
      .then((list) => {
        libraryListCache = list;
        libraryListCachedAt = Date.now();
        return list;
      })
      .catch(() => null)
      .finally(() => {
        libraryListInflight = null;
      });
  }

  return libraryListInflight;
}

export function setCachedTranscriptionLibrary(list: TranscriptionListEntry[] | null) {
  libraryListCache = list;
  libraryListCachedAt = list ? Date.now() : 0;
}

/** Warm module chunk + lightweight main-process status while the user is still on Welcome. */
export function warmTranscriptionEntry(): void {
  if (isVitestEnv()) {
    return;
  }

  void prefetchTranscriptionModule();
  void prefetchTranscriptionEngineStatus();
  void prefetchTranscriptionLibrary();
}
