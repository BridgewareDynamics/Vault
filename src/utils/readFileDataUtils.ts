export type ReadFileDataResponse =
  | { data: string; mimeType: string; fileName: string }
  | { type: 'file-path'; path: string; mimeType: string; fileName: string };

export function isReadFileDataPathResult(
  result: ReadFileDataResponse,
): result is { type: 'file-path'; path: string; mimeType: string; fileName: string } {
  return typeof result === 'object' && result !== null && 'type' in result && result.type === 'file-path';
}

export function mimeTypeFromPath(filePath: string): string | null {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'tif':
    case 'tiff':
      return 'image/tiff';
    case 'bmp':
      return 'image/bmp';
    case 'pdf':
      return 'application/pdf';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    default:
      return null;
  }
}

export function resolveReadFileMimeType(mimeType: string, filePath?: string): string {
  if (mimeType !== 'application/octet-stream' || !filePath) {
    return mimeType;
  }
  return mimeTypeFromPath(filePath) ?? mimeType;
}

export function toVaultFileUrl(filePath: string): string {
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  return `vault-file://${encodeURIComponent(filePath)}`;
}

/** Resolve a vault-stored image path to a renderer URL (no IPC base64 round-trip). */
export function resolveVaultBackgroundUrl(filePath?: string): string | undefined {
  if (!filePath) {
    return undefined;
  }
  return toVaultFileUrl(filePath);
}

/** Resolve IPC read-file-data payload to a URL suitable for img/video/src. */
export function resolveReadFileDataUrl(result: ReadFileDataResponse, filePathHint?: string): string {
  if (isReadFileDataPathResult(result)) {
    return toVaultFileUrl(result.path);
  }

  const mimeType = resolveReadFileMimeType(result.mimeType, filePathHint);
  return `data:${mimeType};base64,${result.data}`;
}
