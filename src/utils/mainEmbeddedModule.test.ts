import { describe, expect, it } from 'vitest';
import {
  planSwapToMapInMain,
  planSwapToTranscriptionInMain,
  planSwapToNovelInMain,
} from './mainEmbeddedModule';

describe('mainEmbeddedModule', () => {
  it('planSwapToMapInMain skips flush when other modules are not visible', async () => {
    const result = await planSwapToMapInMain({
      incoming: null,
      visibility: { showMap: false, showTranscription: false, showNovel: false },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.displacedTranscription).toBeNull();
      expect(result.displacedNovel).toBeNull();
      expect(result.flushWarning).toBe(false);
    }
  });

  it('planSwapToTranscriptionInMain skips flush when other modules are not visible', async () => {
    const result = await planSwapToTranscriptionInMain({
      incoming: null,
      visibility: { showMap: false, showTranscription: false, showNovel: false },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.displacedMap).toBeNull();
      expect(result.displacedNovel).toBeNull();
      expect(result.flushWarning).toBe(false);
    }
  });

  it('planSwapToNovelInMain skips flush when other modules are not visible', async () => {
    const result = await planSwapToNovelInMain({
      incoming: null,
      visibility: { showMap: false, showTranscription: false, showNovel: false },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.displacedMap).toBeNull();
      expect(result.displacedTranscription).toBeNull();
      expect(result.flushWarning).toBe(false);
    }
  });
});
