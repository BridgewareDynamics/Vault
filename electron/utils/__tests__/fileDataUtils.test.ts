import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import {
  getMimeTypeFromExtension,
  isReadFileDataPathPayload,
  MAX_FILE_SIZE_FOR_BASE64,
  readFileDataPayload,
} from '../fileDataUtils';

vi.mock('fs/promises');

describe('fileDataUtils', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns base64 payload for small files', async () => {
    const buffer = Buffer.from('hello');
    vi.mocked(fs.stat).mockResolvedValue({ size: 100 } as Awaited<ReturnType<typeof fs.stat>>);
    vi.mocked(fs.readFile).mockResolvedValue(buffer);

    const result = await readFileDataPayload('/path/to/image.jpg');

    expect(isReadFileDataPathPayload(result)).toBe(false);
    if (!isReadFileDataPathPayload(result)) {
      expect(result.data).toBe(buffer.toString('base64'));
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.fileName).toBe('image.jpg');
    }
  });

  it('returns file-path payload for oversized files without reading', async () => {
    vi.mocked(fs.stat).mockResolvedValue({
      size: MAX_FILE_SIZE_FOR_BASE64 + 1,
    } as Awaited<ReturnType<typeof fs.stat>>);

    const result = await readFileDataPayload('/path/to/large.png');

    expect(result).toEqual({
      type: 'file-path',
      path: '/path/to/large.png',
      mimeType: 'image/png',
      fileName: 'large.png',
    });
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('maps extensions to mime types', () => {
    expect(getMimeTypeFromExtension('/a.pdf')).toBe('application/pdf');
    expect(getMimeTypeFromExtension('/a.unknown')).toBe('application/octet-stream');
  });
});
