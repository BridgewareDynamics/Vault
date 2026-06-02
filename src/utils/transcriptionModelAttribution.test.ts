import { describe, expect, it } from 'vitest';
import {
  findTranscriptionModelAttribution,
  TRANSCRIPTION_MODEL_ATTRIBUTION,
} from './transcriptionModelAttribution';

describe('transcriptionModelAttribution', () => {
  it('lists both supported Parakeet model ids', () => {
    const ids = TRANSCRIPTION_MODEL_ATTRIBUTION.models.map((entry) => entry.modelId);
    expect(ids).toContain('nvidia/parakeet-tdt-0.6b-v2');
    expect(ids).toContain('nvidia/parakeet-tdt-0.6b-v3');
  });

  it('uses CC BY 4.0 license link', () => {
    expect(TRANSCRIPTION_MODEL_ATTRIBUTION.licenseUrl).toBe(
      'https://creativecommons.org/licenses/by/4.0/'
    );
  });

  it('resolves attribution by model id', () => {
    expect(findTranscriptionModelAttribution('nvidia/parakeet-tdt-0.6b-v3')?.displayName).toBe(
      'Parakeet TDT 0.6B V3'
    );
    expect(findTranscriptionModelAttribution('unknown/model')).toBeUndefined();
  });
});
