import type {
  MapModuleDetachState,
  TranscriptionModuleDetachState,
} from '../types/detachableModules';
import {
  collectEmbeddedMapSnapshot,
  collectEmbeddedTranscriptionSnapshot,
  EmbeddedModuleSnapshotError,
} from './embeddedModuleSnapshot';

export type MainEmbeddedModule = 'none' | 'map' | 'transcription';

export interface MainModuleVisibility {
  showMap: boolean;
  showTranscription: boolean;
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

export type SwapToMapResult =
  | {
      ok: true;
      displacedTranscription: TranscriptionModuleDetachState | null;
      flushWarning: boolean;
    }
  | { ok: false; reason: 'save_failed'; message: string };

export type SwapToTranscriptionResult =
  | {
      ok: true;
      displacedMap: MapModuleDetachState | null;
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

export async function planSwapToMapInMain(
  options: SwapToMapOptions
): Promise<SwapToMapResult> {
  try {
    const { snapshot, flushWarning } = await flushDisplacedTranscription(options.visibility);
    return { ok: true, displacedTranscription: snapshot, flushWarning };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save Transcript before switching';
    return { ok: false, reason: 'save_failed', message };
  }
}

export async function planSwapToTranscriptionInMain(
  options: SwapToTranscriptionOptions
): Promise<SwapToTranscriptionResult> {
  try {
    const { snapshot, flushWarning } = await flushDisplacedMap(options.visibility);
    return { ok: true, displacedMap: snapshot, flushWarning };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save Map before switching';
    return { ok: false, reason: 'save_failed', message };
  }
}
