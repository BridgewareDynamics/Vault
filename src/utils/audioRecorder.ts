export type AudioRecorderQuality = 'standard' | 'high';

export interface AudioStudioInputOptions {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  inputGainPercent: number;
  monitorVolumePercent: number;
  monitorEnabled: boolean;
}

export const DEFAULT_AUDIO_STUDIO_INPUT: AudioStudioInputOptions = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: false,
  inputGainPercent: 100,
  monitorVolumePercent: 0,
  monitorEnabled: false,
};

export function resolveRecordingMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

export function mimeTypeToExtension(mimeType: string): string {
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4')) return 'm4a';
  return 'webm';
}

export function buildDefaultRecordingFileName(mimeType: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  return `Recording_${stamp}.${mimeTypeToExtension(mimeType)}`;
}

export function bitrateForQuality(quality: AudioRecorderQuality): number | undefined {
  if (quality === 'high') {
    return 192_000;
  }
  return 96_000;
}

export function formatRecorderDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function gainPercentToValue(percent: number): number {
  const clamped = Math.min(200, Math.max(0, percent));
  return clamped / 100;
}

export function volumePercentToValue(percent: number): number {
  const clamped = Math.min(100, Math.max(0, percent));
  return clamped / 100;
}

export function isMediaDeviceNotFoundError(err: unknown): boolean {
  if (!(err instanceof DOMException) && !(err instanceof Error)) {
    return false;
  }
  const name = err instanceof DOMException ? err.name : '';
  return name === 'NotFoundError' || /requested device not found|device not found/i.test(err.message);
}

export function normalizeMediaDeviceError(err: unknown): string {
  if (isMediaDeviceNotFoundError(err)) {
    return 'The selected microphone is unavailable. Pick another device or reconnect it.';
  }
  if (err instanceof DOMException && err.name === 'NotAllowedError') {
    return 'Microphone access was denied. Allow the mic in system settings and try again.';
  }
  if (err instanceof DOMException && err.name === 'NotReadableError') {
    return 'The microphone is in use by another app. Close other apps and try again.';
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Microphone permission was denied or unavailable.';
}
