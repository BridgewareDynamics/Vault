import * as fs from 'fs/promises';
import * as path from 'path';

/** Crossover to path/chunk transfer — not a max file size. */
export const MAX_FILE_SIZE_FOR_BASE64 = 64 * 1024 * 1024;

export function getMimeTypeFromExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  if (['.jpg', '.jpeg'].includes(ext)) return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.bmp') return 'image/bmp';
  if (ext === '.pdf') return 'application/pdf';
  if (['.mp4'].includes(ext)) return 'video/mp4';
  if (['.webm'].includes(ext)) return 'video/webm';

  return 'application/octet-stream';
}

export type ReadFileDataBase64Payload = {
  data: string;
  mimeType: string;
  fileName: string;
};

export type ReadFileDataPathPayload = {
  type: 'file-path';
  path: string;
  mimeType: string;
  fileName: string;
};

export type ReadFileDataPayload = ReadFileDataBase64Payload | ReadFileDataPathPayload;

export function isReadFileDataPathPayload(
  payload: ReadFileDataPayload,
): payload is ReadFileDataPathPayload {
  return 'type' in payload && payload.type === 'file-path';
}

export async function readFileDataPayload(filePath: string): Promise<ReadFileDataPayload> {
  const mimeType = getMimeTypeFromExtension(filePath);
  const fileName = path.basename(filePath);
  const stats = await fs.stat(filePath);

  if (stats.size > MAX_FILE_SIZE_FOR_BASE64) {
    return { type: 'file-path', path: filePath, mimeType, fileName };
  }

  const data = await fs.readFile(filePath);
  return {
    data: data.toString('base64'),
    mimeType,
    fileName,
  };
}
