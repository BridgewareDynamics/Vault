import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import sharp from 'sharp';
import { generateFileThumbnail } from '../thumbnailGenerator';

// Mock sharp
vi.mock('sharp', () => {
  const mockSharp = vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
  }));

  return {
    default: mockSharp,
  };
});

// Mock path
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    extname: vi.fn((filePath: string) => {
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      return ext ? `.${ext}` : '';
    }),
  };
});

describe('thumbnailGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateFileThumbnail', () => {
    it('should generate thumbnail for image file (JPEG)', async () => {
      const mockBuffer = Buffer.from('mock-jpeg-data');
      (sharp as any).mockReturnValue({
        resize: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      });

      const thumbnail = await generateFileThumbnail('/path/to/image.jpg');

      expect(thumbnail).toContain('data:image/png;base64,');
      expect(sharp).toHaveBeenCalledWith('/path/to/image.jpg');
    });

    it('should generate thumbnail for image file (PNG)', async () => {
      const mockBuffer = Buffer.from('mock-png-data');
      (sharp as any).mockReturnValue({
        resize: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      });

      const thumbnail = await generateFileThumbnail('/path/to/image.png');

      expect(thumbnail).toContain('data:image/png;base64,');
      expect(sharp).toHaveBeenCalledWith('/path/to/image.png');
    });

    it('should generate placeholder thumbnail for PDF file', async () => {
      const mockBuffer = Buffer.from('mock-svg-data');
      (sharp as any).mockReturnValue({
        resize: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      });

      const thumbnail = await generateFileThumbnail('/path/to/document.pdf');

      expect(thumbnail).toContain('data:image/png;base64,');
      // Should use placeholder generation
      expect(sharp).toHaveBeenCalled();
    });

    it('should generate placeholder thumbnail for video file', async () => {
      const mockBuffer = Buffer.from('mock-svg-data');
      (sharp as any).mockReturnValue({
        resize: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      });

      const thumbnail = await generateFileThumbnail('/path/to/video.mp4');

      expect(thumbnail).toContain('data:image/png;base64,');
      expect(sharp).toHaveBeenCalled();
    });

    it('should generate generic placeholder for unknown file type', async () => {
      const mockBuffer = Buffer.from('mock-svg-data');
      (sharp as any).mockReturnValue({
        resize: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      });

      const thumbnail = await generateFileThumbnail('/path/to/unknown.xyz');

      expect(thumbnail).toContain('data:image/png;base64,');
      expect(sharp).toHaveBeenCalled();
    });

    it('should handle error when generating image thumbnail', async () => {
      (sharp as any).mockReturnValue({
        resize: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockRejectedValue(new Error('Sharp error')),
      });

      await expect(
        generateFileThumbnail('/path/to/image.jpg')
      ).rejects.toThrow('Failed to generate image thumbnail');
    });

    it('should resize image to thumbnail size', async () => {
      const mockResize = vi.fn().mockReturnThis();
      const mockPng = vi.fn().mockReturnThis();
      const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from('data'));

      (sharp as any).mockReturnValue({
        resize: mockResize,
        png: mockPng,
        toBuffer: mockToBuffer,
      });

      await generateFileThumbnail('/path/to/image.jpg');

      expect(mockResize).toHaveBeenCalledWith(200, 200, {
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 26, g: 26, b: 46, alpha: 1 },
      });
    });
  });
});

