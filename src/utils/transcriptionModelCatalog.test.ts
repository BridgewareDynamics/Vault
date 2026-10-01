import { describe, expect, it } from 'vitest';
import { groupTranscriptionModelsByFamily } from './transcriptionModelCatalog';
import type { TranscriptionEngineModel } from '../types';

function makeModel(
  overrides: Partial<TranscriptionEngineModel> & Pick<TranscriptionEngineModel, 'key'>
): TranscriptionEngineModel {
  return {
    name: 'Parakeet TDT 0.6B v2',
    modelId: 'nvidia/parakeet-tdt-0.6b-v2',
    precision: 'bfloat16',
    modelType: 'parakeet',
    defaultSegmentLength: 90,
    supportsTimestamps: true,
    ...overrides,
  };
}

describe('groupTranscriptionModelsByFamily', () => {
  it('groups precision variants under one family', () => {
    const families = groupTranscriptionModelsByFamily([
      makeModel({ key: 'Parakeet TDT 0.6B v2 - bfloat16', precision: 'bfloat16' }),
      makeModel({ key: 'Parakeet TDT 0.6B v2 - float32', precision: 'float32' }),
    ]);

    expect(families).toHaveLength(1);
    expect(families[0]?.precisions).toEqual(['bfloat16', 'float32']);
    expect(families[0]?.ready).toBe(false);
  });

  it('marks a family ready when any precision variant is cached', () => {
    const families = groupTranscriptionModelsByFamily([
      makeModel({
        key: 'Parakeet TDT 0.6B v2 - bfloat16',
        cached: true,
        cachePath: 'C:/models/parakeet.nemo',
      }),
      makeModel({ key: 'Parakeet TDT 0.6B v2 - float32', precision: 'float32' }),
    ]);

    expect(families[0]?.ready).toBe(true);
    expect(families[0]?.storagePath).toBe('C:/models/parakeet.nemo');
  });
});
