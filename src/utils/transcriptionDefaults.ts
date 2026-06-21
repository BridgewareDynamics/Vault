import type { TranscriptionEngineModel } from '../types';

export const PREFERRED_PARAKEET_MODEL_KEY = 'Parakeet TDT 0.6B v3 - float32';
export const LEGACY_PARAKEET_MODEL_KEY = 'Parakeet TDT 0.6B v2 - bfloat16';

function isParakeetV3Model(model: TranscriptionEngineModel): boolean {
  return model.name.includes('0.6B v3') || model.modelId.includes('parakeet-tdt-0.6b-v3');
}

export function resolvePreferredParakeetModelKey(
  availableModels: TranscriptionEngineModel[]
): string {
  if (availableModels.some((model) => model.key === PREFERRED_PARAKEET_MODEL_KEY)) {
    return PREFERRED_PARAKEET_MODEL_KEY;
  }

  const v3Float32 = availableModels.find(
    (model) => isParakeetV3Model(model) && model.precision === 'float32'
  );
  if (v3Float32) {
    return v3Float32.key;
  }

  const v3Model = availableModels.find((model) => isParakeetV3Model(model));
  if (v3Model) {
    return v3Model.key;
  }

  return PREFERRED_PARAKEET_MODEL_KEY;
}

export function shouldApplyPreferredParakeetModel(
  currentModelKey: string,
  availableModels: TranscriptionEngineModel[]
): boolean {
  const preferredKey = resolvePreferredParakeetModelKey(availableModels);
  const preferredAvailable = availableModels.some((model) => model.key === preferredKey);

  if (!preferredAvailable) {
    return false;
  }

  return currentModelKey !== preferredKey;
}
