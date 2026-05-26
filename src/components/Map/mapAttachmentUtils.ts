import { MapAttachment } from '../../types';

export interface PendingMapAttachment {
  sourcePath: string;
  fileName: string;
  origin: 'local' | 'vault';
  type: MapAttachment['type'];
}

export const MAP_VAULT_DRAG_MIME = 'application/x-vault-map-attachment';

export function detectMapAttachmentType(filePath: string): MapAttachment['type'] {
  const lower = filePath.toLowerCase();

  if (lower.endsWith('.pdf')) {
    return 'pdf';
  }

  if (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.bmp') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.svg')
  ) {
    return 'image';
  }

  if (
    lower.endsWith('.mp4') ||
    lower.endsWith('.avi') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.wmv') ||
    lower.endsWith('.flv') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mkv')
  ) {
    return 'video';
  }

  return 'other';
}

export function getMapAttachmentFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || filePath;
}

export function createPendingMapAttachment(input: {
  sourcePath: string;
  origin: PendingMapAttachment['origin'];
  fileName?: string;
  type?: MapAttachment['type'];
}): PendingMapAttachment {
  return {
    sourcePath: input.sourcePath,
    fileName: input.fileName || getMapAttachmentFileName(input.sourcePath),
    origin: input.origin,
    type: input.type || detectMapAttachmentType(input.sourcePath),
  };
}

export function mergePendingMapAttachments(
  current: PendingMapAttachment[],
  additions: PendingMapAttachment[]
): PendingMapAttachment[] {
  const seen = new Set(current.map((item) => `${item.origin}:${item.sourcePath}`));
  const merged = [...current];

  additions.forEach((item) => {
    const key = `${item.origin}:${item.sourcePath}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(item);
  });

  return merged;
}

export function isSavedMapAttachmentCopy(attachment: MapAttachment): boolean {
  return /^assets[\\/]/i.test(attachment.relativePath);
}
