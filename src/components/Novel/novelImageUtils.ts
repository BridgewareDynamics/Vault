export const NOVEL_VAULT_DRAG_MIME = 'application/x-vault-novel-image';

export interface PendingNovelImage {
  sourcePath: string;
  fileName: string;
}

export function createPendingNovelImage(sourcePath: string, fileName: string): PendingNovelImage {
  return { sourcePath, fileName };
}

export function parseNovelImageDrag(dataTransfer: DataTransfer): PendingNovelImage | null {
  const raw = dataTransfer.getData(NOVEL_VAULT_DRAG_MIME);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingNovelImage;
  } catch {
    return null;
  }
}
