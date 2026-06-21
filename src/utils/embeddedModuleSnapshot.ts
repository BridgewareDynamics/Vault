import type {
  MapModuleDetachState,
  TranscriptionModuleDetachState,
  NovelModuleDetachState,
} from '../types/detachableModules';

export const COLLECT_EMBEDDED_MAP_EVENT = 'collect-embedded-map-snapshot';
export const EMBEDDED_MAP_SNAPSHOT_RESPONSE = 'embedded-map-snapshot-response';

export const COLLECT_EMBEDDED_TRANSCRIPTION_EVENT = 'collect-embedded-transcription-snapshot';
export const EMBEDDED_TRANSCRIPTION_SNAPSHOT_RESPONSE =
  'embedded-transcription-snapshot-response';

export const COLLECT_EMBEDDED_NOVEL_EVENT = 'collect-embedded-novel-snapshot';
export const EMBEDDED_NOVEL_SNAPSHOT_RESPONSE = 'embedded-novel-snapshot-response';

const DEFAULT_TIMEOUT_MS = 2000;

export class EmbeddedModuleSnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmbeddedModuleSnapshotError';
  }
}

function collectSnapshot<T>(
  collectEvent: string,
  responseEvent: string,
  timeoutMs: number
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener(responseEvent, onResponse as EventListener);
      resolve(null);
    }, timeoutMs);

    const onResponse = (event: Event) => {
      window.clearTimeout(timeout);
      window.removeEventListener(responseEvent, onResponse as EventListener);
      const detail = (event as CustomEvent<{ state: T | null; error?: string }>).detail;
      if (detail?.error) {
        reject(new EmbeddedModuleSnapshotError(detail.error));
        return;
      }
      resolve(detail?.state ?? null);
    };

    window.addEventListener(responseEvent, onResponse as EventListener);
    window.dispatchEvent(new CustomEvent(collectEvent));
  });
}

export function collectEmbeddedMapSnapshot(
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<MapModuleDetachState | null> {
  return collectSnapshot<MapModuleDetachState>(
    COLLECT_EMBEDDED_MAP_EVENT,
    EMBEDDED_MAP_SNAPSHOT_RESPONSE,
    timeoutMs
  );
}

export function collectEmbeddedTranscriptionSnapshot(
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<TranscriptionModuleDetachState | null> {
  return collectSnapshot<TranscriptionModuleDetachState>(
    COLLECT_EMBEDDED_TRANSCRIPTION_EVENT,
    EMBEDDED_TRANSCRIPTION_SNAPSHOT_RESPONSE,
    timeoutMs
  );
}

export function collectEmbeddedNovelSnapshot(
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<NovelModuleDetachState | null> {
  return collectSnapshot<NovelModuleDetachState>(
    COLLECT_EMBEDDED_NOVEL_EVENT,
    EMBEDDED_NOVEL_SNAPSHOT_RESPONSE,
    timeoutMs
  );
}
