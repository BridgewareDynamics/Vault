import type { TranscriptionEngineModel } from '../types';

export interface TranscriptionModelFamily {
  modelId: string;
  name: string;
  modelType: string;
  ready: boolean;
  bundled: boolean;
  installable: boolean;
  precisions: string[];
  storagePath?: string;
}

export function groupTranscriptionModelsByFamily(
  models: TranscriptionEngineModel[]
): TranscriptionModelFamily[] {
  const families = new Map<string, TranscriptionModelFamily>();

  for (const model of models) {
    if (!model.modelId) {
      continue;
    }

    const existing = families.get(model.modelId);
    if (!existing) {
      families.set(model.modelId, {
        modelId: model.modelId,
        name: model.name,
        modelType: model.modelType,
        ready: !!(model.bundled || model.cached),
        bundled: !!model.bundled,
        installable: model.installable ?? true,
        precisions: [model.precision],
        storagePath: model.cachePath ?? model.bundledPath,
      });
      continue;
    }

    existing.ready = existing.ready || !!(model.bundled || model.cached);
    existing.bundled = existing.bundled || !!model.bundled;
    existing.installable = existing.installable || !!model.installable;
    if (!existing.precisions.includes(model.precision)) {
      existing.precisions.push(model.precision);
    }
    existing.storagePath = existing.storagePath ?? model.cachePath ?? model.bundledPath;
  }

  return Array.from(families.values());
}
