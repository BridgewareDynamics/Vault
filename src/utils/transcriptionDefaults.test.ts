import { describe, expect, it } from 'vitest';
import type { TranscriptionEngineModel } from '../types';
import {
  LEGACY_PARAKEET_MODEL_KEY,
  PREFERRED_PARAKEET_MODEL_KEY,
  resolvePreferredParakeetModelKey,
  shouldApplyPreferredParakeetModel,
} from './transcriptionDefaults';

function makeModel(key: string, name: string, precision: string): TranscriptionEngineModel {
  return {
    key,
    name,
    modelId: 'nvidia/parakeet-tdt-0.6b-v3',
    precision,
    modelType: 'parakeet',
    defaultSegmentLength: 90,
    supportsTimestamps: true,
  };
}

describe('transcriptionDefaults', () => {
  it('prefers Parakeet 0.6B v3 float32 when available', () => {
    const models = [
      makeModel(LEGACY_PARAKEET_MODEL_KEY, 'Parakeet TDT 0.6B v2', 'bfloat16'),
      makeModel(PREFERRED_PARAKEET_MODEL_KEY, 'Parakeet TDT 0.6B v3', 'float32'),
    ];

    expect(resolvePreferredParakeetModelKey(models)).toBe(PREFERRED_PARAKEET_MODEL_KEY);
  });

  it('applies preferred model when workspace still uses v2 defaults', () => {
    const models = [makeModel(PREFERRED_PARAKEET_MODEL_KEY, 'Parakeet TDT 0.6B v3', 'float32')];

    expect(shouldApplyPreferredParakeetModel(LEGACY_PARAKEET_MODEL_KEY, models)).toBe(true);
    expect(
      shouldApplyPreferredParakeetModel('Parakeet TDT 0.6B v2 - bfloat16', models)
    ).toBe(true);
    expect(shouldApplyPreferredParakeetModel(PREFERRED_PARAKEET_MODEL_KEY, models)).toBe(false);
  });

  it('does not fall back to the engine default when v3 float32 is listed', () => {
    const models = [
      makeModel('Parakeet TDT 0.6B v2 - bfloat16', 'Parakeet TDT 0.6B v2', 'bfloat16'),
      makeModel(PREFERRED_PARAKEET_MODEL_KEY, 'Parakeet TDT 0.6B v3', 'float32'),
    ];

    expect(resolvePreferredParakeetModelKey(models)).toBe(PREFERRED_PARAKEET_MODEL_KEY);
  });
});
