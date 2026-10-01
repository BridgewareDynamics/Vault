import { describe, expect, it, vi, beforeEach } from 'vitest';
import { planSwapToMapInMain } from './utils/mainEmbeddedModule';
import {
  collectEmbeddedTranscriptionSnapshot,
  EMBEDDED_TRANSCRIPTION_SNAPSHOT_RESPONSE,
  COLLECT_EMBEDDED_TRANSCRIPTION_EVENT,
} from './utils/embeddedModuleSnapshot';
import type { TranscriptionModuleDetachState } from './types/detachableModules';

describe('main module swap with embedded snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('planSwapToMapInMain captures displaced transcript snapshot from embedded module', async () => {
    const displaced: TranscriptionModuleDetachState = {
      screen: 'workspace',
      workspacePath: '/vault/transcripts/t1',
      workspaceDocument: null,
      launchSourcePath: null,
      launchCasePath: null,
    };

    const listener = (event: Event) => {
      if (event.type !== COLLECT_EMBEDDED_TRANSCRIPTION_EVENT) return;
      window.dispatchEvent(
        new CustomEvent(EMBEDDED_TRANSCRIPTION_SNAPSHOT_RESPONSE, {
          detail: { state: displaced },
        })
      );
    };

    window.addEventListener(COLLECT_EMBEDDED_TRANSCRIPTION_EVENT, listener);

    const snapshotPromise = collectEmbeddedTranscriptionSnapshot(500);
    const swapPromise = planSwapToMapInMain({
      incoming: null,
      visibility: { showMap: false, showTranscription: true, showNovel: false },
    });

    const [snapshot, swap] = await Promise.all([snapshotPromise, swapPromise]);

    window.removeEventListener(COLLECT_EMBEDDED_TRANSCRIPTION_EVENT, listener);

    expect(snapshot).toEqual(displaced);
    expect(swap.ok).toBe(true);
    if (swap.ok) {
      expect(swap.displacedTranscription).toEqual(displaced);
    }
  });
});
