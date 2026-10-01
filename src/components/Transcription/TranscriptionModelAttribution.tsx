import { ExternalLink } from 'lucide-react';
import { TRANSCRIPTION_MODEL_ATTRIBUTION } from '../../utils/transcriptionModelAttribution';

interface TranscriptionModelAttributionProps {
  mutedClassName: string;
  primaryClassName: string;
  surfaceClassName: string;
  activeModelId?: string | null;
}

export function TranscriptionModelAttribution({
  mutedClassName,
  primaryClassName,
  surfaceClassName,
  activeModelId,
}: TranscriptionModelAttributionProps) {
  const activeEntry = activeModelId
    ? TRANSCRIPTION_MODEL_ATTRIBUTION.models.find((entry) => entry.modelId === activeModelId)
    : null;

  return (
    <div
      className={`rounded-2xl border p-3 text-xs leading-relaxed ${surfaceClassName}`}
      aria-label="Transcription model license and attribution"
    >
      <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${primaryClassName}`}>
        Model attribution
      </p>
      <p className={`mt-2 ${mutedClassName}`}>
        Transcription is powered by NVIDIA Parakeet speech recognition models (
        {TRANSCRIPTION_MODEL_ATTRIBUTION.models.map((entry) => entry.displayName).join(', ')}
        ), © {TRANSCRIPTION_MODEL_ATTRIBUTION.copyrightHolder}, used under{' '}
        <a
          href={TRANSCRIPTION_MODEL_ATTRIBUTION.licenseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-0.5 font-semibold underline-offset-2 hover:underline ${primaryClassName}`}
        >
          {TRANSCRIPTION_MODEL_ATTRIBUTION.licenseShortName}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        . Inference uses the{' '}
        <a
          href={TRANSCRIPTION_MODEL_ATTRIBUTION.nemoToolkitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-0.5 font-semibold underline-offset-2 hover:underline ${primaryClassName}`}
        >
          NVIDIA NeMo toolkit
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>{' '}
        ({TRANSCRIPTION_MODEL_ATTRIBUTION.nemoLicenseName}).
      </p>
      {activeEntry ? (
        <p className={`mt-2 ${mutedClassName}`}>
          Active model:{' '}
          <a
            href={activeEntry.modelPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-semibold underline-offset-2 hover:underline ${primaryClassName}`}
          >
            {activeEntry.displayName}
          </a>
        </p>
      ) : null}
      <ul className={`mt-2 space-y-1 ${mutedClassName}`}>
        {TRANSCRIPTION_MODEL_ATTRIBUTION.models.map((entry) => (
          <li key={entry.modelId}>
            <a
              href={entry.modelPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 underline-offset-2 hover:underline ${primaryClassName}`}
            >
              {entry.modelId}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
