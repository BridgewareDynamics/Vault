/** Minimum clip length (seconds) when adjusting segment handles. */
export const MIN_MEDIA_SELECTION_SECONDS = 1;

/** Parakeet-optimized chunk size for longer media. */
export const PARAKEET_OPTIMAL_CHUNK_SECONDS = 90;

export interface SegmentSettingsFromDuration {
  segmentLength: number;
  segmentDuration: number;
}

/**
 * Derive engine segment length / duration from the selected clip length.
 * Short clips use the full selection as the processing chunk; longer clips cap at 90s.
 */
export function deriveSegmentSettingsFromDuration(
  selectionDurationSeconds: number
): SegmentSettingsFromDuration {
  const duration = Math.max(MIN_MEDIA_SELECTION_SECONDS, selectionDurationSeconds);

  const segmentLength =
    duration > PARAKEET_OPTIMAL_CHUNK_SECONDS
      ? PARAKEET_OPTIMAL_CHUNK_SECONDS
      : clamp(Math.ceil(duration), 10, 120);

  let segmentDuration: number;
  if (duration <= 30) {
    segmentDuration = clamp(Math.round(duration / 4), 1, 15);
  } else if (duration <= 120) {
    segmentDuration = clamp(Math.round(duration / 10), 3, 15);
  } else {
    segmentDuration = 10;
  }

  return { segmentLength, segmentDuration };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatMediaTimestamp(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }

  const wholeSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const seconds = wholeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function buildVaultMediaUrl(filePath: string): string {
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  return `vault-video://${encodeURIComponent(filePath)}`;
}
