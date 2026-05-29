import { describe, expect, it } from 'vitest';
import { planSwapToMapInMain, planSwapToTranscriptionInMain } from './mainEmbeddedModule';

describe('mainEmbeddedModule', () => {
  it('planSwapToMapInMain skips flush when transcript is not visible', async () => {
    const result = await planSwapToMapInMain({
      incoming: null,
      visibility: { showMap: false, showTranscription: false },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.displacedTranscription).toBeNull();
      expect(result.flushWarning).toBe(false);
    }
  });

  it('planSwapToTranscriptionInMain skips flush when map is not visible', async () => {
    const result = await planSwapToTranscriptionInMain({
      incoming: null,
      visibility: { showMap: false, showTranscription: false },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.displacedMap).toBeNull();
      expect(result.flushWarning).toBe(false);
    }
  });
});
