import type {
  MapModuleDetachState,
  TranscriptionModuleDetachState,
  NovelModuleDetachState,
} from '../types/detachableModules';
import {
  collectEmbeddedMapSnapshot,
  collectEmbeddedTranscriptionSnapshot,
  collectEmbeddedNovelSnapshot,
  EmbeddedModuleSnapshotError,
} from './embeddedModuleSnapshot';

export type MainEmbeddedModule = 'none' | 'map' | 'transcription' | 'novel';

export interface MainModuleVisibility {
  showMap: boolean;
  showTranscription: boolean;
  showNovel: boolean;
}

export interface SwapToMapOptions {
  incoming: MapModuleDetachState | null;
  visibility: MainModuleVisibility;
}

export interface SwapToTranscriptionOptions {
  incoming: TranscriptionModuleDetachState | null;
  visibility: MainModuleVisibility;
  launchSourcePath?: string | null;
  launchCasePath?: string | null;
}

export interface SwapToNovelOptions {
  incoming: NovelModuleDetachState | null;
  visibility: MainModuleVisibility;
}

export type SwapToMapResult =
  | {
      ok: true;
      displacedTranscription: TranscriptionModuleDetachState | null;
      displacedNovel: NovelModuleDetachState | null;
      flushWarning: boolean;
    }
  | { ok: false; reason: 'save_failed'; message: string };

export type SwapToTranscriptionResult =
  | {
      ok: true;
      displacedMap: MapModuleDetachState | null;
      displacedNovel: NovelModuleDetachState | null;
      flushWarning: boolean;
    }
  | { ok: false; reason: 'save_failed'; message: string };

export type SwapToNovelResult =
  | {
      ok: true;
      displacedMap: MapModuleDetachState | null;
      displacedTranscription: TranscriptionModuleDetachState | null;
      flushWarning: boolean;
    }
  | { ok: false; reason: 'save_failed'; message: string };

async function flushDisplacedTranscription(
  visibility: MainModuleVisibility
): Promise<{
  snapshot: TranscriptionModuleDetachState | null;
  flushWarning: boolean;
}> {
  if (!visibility.showTranscription) {
    return { snapshot: null, flushWarning: false };
  }

  try {
    const snapshot = await collectEmbeddedTranscriptionSnapshot();
    return { snapshot, flushWarning: false };
  } catch (error) {
    if (error instanceof EmbeddedModuleSnapshotError) {
      throw error;
    }
    return { snapshot: null, flushWarning: true };
  }
}

async function flushDisplacedMap(
  visibility: MainModuleVisibility
): Promise<{ snapshot: MapModuleDetachState | null; flushWarning: boolean }> {
  if (!visibility.showMap) {
    return { snapshot: null, flushWarning: false };
  }

  try {
    const snapshot = await collectEmbeddedMapSnapshot();
    return { snapshot, flushWarning: false };
  } catch (error) {
    if (error instanceof EmbeddedModuleSnapshotError) {
      throw error;
    }
    return { snapshot: null, flushWarning: true };
  }
}

async function flushDisplacedNovel(
  visibility: MainModuleVisibility
): Promise<{ snapshot: NovelModuleDetachState | null; flushWarning: boolean }> {
  if (!visibility.showNovel) {
    return { snapshot: null, flushWarning: false };
  }

  try {
    const snapshot = await collectEmbeddedNovelSnapshot();
    return { snapshot, flushWarning: false };
  } catch (error) {
    if (error instanceof EmbeddedModuleSnapshotError) {
      throw error;
    }
    return { snapshot: null, flushWarning: true };
  }
}

export async function planSwapToMapInMain(
  options: SwapToMapOptions
): Promise<SwapToMapResult> {
  try {
    const [transcriptionFlush, novelFlush] = await Promise.all([
      flushDisplacedTranscription(options.visibility),
      flushDisplacedNovel(options.visibility),
    ]);
    return {
      ok: true,
      displacedTranscription: transcriptionFlush.snapshot,
      displacedNovel: novelFlush.snapshot,
      flushWarning: transcriptionFlush.flushWarning || novelFlush.flushWarning,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save modules before switching';
    return { ok: false, reason: 'save_failed', message };
  }
}

export async function planSwapToTranscriptionInMain(
  options: SwapToTranscriptionOptions
): Promise<SwapToTranscriptionResult> {
  try {
    const [mapFlush, novelFlush] = await Promise.all([
      flushDisplacedMap(options.visibility),
      flushDisplacedNovel(options.visibility),
    ]);
    return {
      ok: true,
      displacedMap: mapFlush.snapshot,
      displacedNovel: novelFlush.snapshot,
      flushWarning: mapFlush.flushWarning || novelFlush.flushWarning,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save modules before switching';
    return { ok: false, reason: 'save_failed', message };
  }
}

export async function planSwapToNovelInMain(
  options: SwapToNovelOptions
): Promise<SwapToNovelResult> {
  try {
    const [mapFlush, transcriptionFlush] = await Promise.all([
      flushDisplacedMap(options.visibility),
      flushDisplacedTranscription(options.visibility),
    ]);
    return {
      ok: true,
      displacedMap: mapFlush.snapshot,
      displacedTranscription: transcriptionFlush.snapshot,
      flushWarning: mapFlush.flushWarning || transcriptionFlush.flushWarning,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save modules before switching';
    return { ok: false, reason: 'save_failed', message };
  }
}
