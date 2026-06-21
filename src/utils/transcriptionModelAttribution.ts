export interface TranscriptionModelAttributionEntry {
  modelId: string;
  displayName: string;
  modelPageUrl: string;
}

export const TRANSCRIPTION_MODEL_ATTRIBUTION = {
  copyrightHolder: 'NVIDIA Corporation',
  licenseName: 'Creative Commons Attribution 4.0 International',
  licenseShortName: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  licenseLegalCodeUrl: 'https://creativecommons.org/licenses/by/4.0/legalcode',
  noticeFileName: 'nvidia-parakeet-cc-by-4.0.txt',
  nemoToolkitUrl: 'https://github.com/NVIDIA/NeMo',
  nemoLicenseName: 'Apache License 2.0',
  models: [
    {
      modelId: 'nvidia/parakeet-tdt-0.6b-v2',
      displayName: 'Parakeet TDT 0.6B V2',
      modelPageUrl: 'https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2',
    },
    {
      modelId: 'nvidia/parakeet-tdt-0.6b-v3',
      displayName: 'Parakeet TDT 0.6B V3',
      modelPageUrl: 'https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3',
    },
  ] satisfies TranscriptionModelAttributionEntry[],
} as const;

export function findTranscriptionModelAttribution(modelId: string) {
  return TRANSCRIPTION_MODEL_ATTRIBUTION.models.find((entry) => entry.modelId === modelId);
}
