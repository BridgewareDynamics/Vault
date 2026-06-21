import { useEffect, useRef } from 'react';
import type { TranscriptionSource } from '../../../types';
import { buildVaultMediaUrl } from '../../../utils/transcriptionSegmentDefaults';

/**
 * Loads media metadata for the selected source and reports total duration in seconds.
 */
export function useTranscriptionSourceDuration(
  source: TranscriptionSource | null,
  onDuration: (durationSeconds: number) => void
) {
  const onDurationRef = useRef(onDuration);
  onDurationRef.current = onDuration;

  useEffect(() => {
    if (!source) return;

    const mediaPath = source.storedPath ?? source.originalPath;
    const element = document.createElement(source.mediaType === 'video' ? 'video' : 'audio');
    element.preload = 'metadata';
    element.muted = true;
    element.src = buildVaultMediaUrl(mediaPath);

    const handleLoaded = () => {
      const duration = Number.isFinite(element.duration) ? element.duration : 0;
      if (duration > 0) {
        onDurationRef.current(duration);
      }
      cleanup();
    };

    const handleError = () => {
      cleanup();
    };

    const reloadElement = () => {
      try {
        element.load();
      } catch {
        // jsdom does not implement HTMLMediaElement.load
      }
    };

    const cleanup = () => {
      element.removeEventListener('loadedmetadata', handleLoaded);
      element.removeEventListener('error', handleError);
      element.removeAttribute('src');
      reloadElement();
    };

    element.addEventListener('loadedmetadata', handleLoaded);
    element.addEventListener('error', handleError);
    reloadElement();

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the source is intentionally tracked by its identifying fields rather than object identity
  }, [source?.id, source?.storedPath, source?.originalPath, source?.mediaType]);
}
