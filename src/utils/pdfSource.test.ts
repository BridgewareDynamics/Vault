import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChunkedPDFSource } from './pdfSource';
import { mockElectronAPI } from '../test-utils/mocks';

// Mock pdfjs-dist
const mockGetDocument = vi.fn();
vi.mock('pdfjs-dist', () => ({
  default: {
    getDocument: mockGetDocument,
  },
}));

describe('pdfSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.getPDFFileSize.mockResolvedValue(1000);
    mockElectronAPI.readPDFFileChunk.mockResolvedValue('dGVzdA=='); // base64 for "test"
  });

  it('should create chunked PDF source for large files', async () => {
    const pdfjsLib = await import('pdfjs-dist');
    const mockPdf = {
      numPages: 1,
      getPage: vi.fn(),
    };

    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(mockPdf),
    });

    mockElectronAPI.getPDFFileSize.mockResolvedValue(5 * 1024 * 1024); // 5MB
    mockElectronAPI.readPDFFileChunk.mockResolvedValue('dGVzdA==');

    const result = await createChunkedPDFSource('/path/to/large.pdf', pdfjsLib);

    expect(mockElectronAPI.getPDFFileSize).toHaveBeenCalledWith('/path/to/large.pdf');
    expect(mockElectronAPI.readPDFFileChunk).toHaveBeenCalled();
    expect(result).toBe(mockPdf);
  });

  it('should read file in chunks', async () => {
    const pdfjsLib = await import('pdfjs-dist');
    const mockPdf = {
      numPages: 1,
      getPage: vi.fn(),
    };

    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(mockPdf),
    });

    const fileSize = 4 * 1024 * 1024; // 4MB (2 chunks of 2MB each)
    mockElectronAPI.getPDFFileSize.mockResolvedValue(fileSize);
    mockElectronAPI.readPDFFileChunk
      .mockResolvedValueOnce('chunk1==')
      .mockResolvedValueOnce('chunk2==');

    await createChunkedPDFSource('/path/to/file.pdf', pdfjsLib);

    // Should read 2 chunks
    expect(mockElectronAPI.readPDFFileChunk).toHaveBeenCalledTimes(2);
    expect(mockElectronAPI.readPDFFileChunk).toHaveBeenCalledWith('/path/to/file.pdf', 0, 2 * 1024 * 1024);
    expect(mockElectronAPI.readPDFFileChunk).toHaveBeenCalledWith('/path/to/file.pdf', 2 * 1024 * 1024, 2 * 1024 * 1024);
  });

  it('should handle errors and cleanup blob URL', async () => {
    const pdfjsLib = await import('pdfjs-dist');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

    mockGetDocument.mockReturnValue({
      promise: Promise.reject(new Error('PDF load failed')),
    });

    mockElectronAPI.getPDFFileSize.mockResolvedValue(1000);
    mockElectronAPI.readPDFFileChunk.mockResolvedValue('dGVzdA==');

    await expect(
      createChunkedPDFSource('/path/to/file.pdf', pdfjsLib)
    ).rejects.toThrow('PDF load failed');

    // Blob URL should be cleaned up on error
    expect(revokeSpy).toHaveBeenCalled();

    revokeSpy.mockRestore();
  });

  it('should throw error when Electron API is not available', async () => {
    const originalAPI = window.electronAPI;
    (window as any).electronAPI = undefined;

    const pdfjsLib = await import('pdfjs-dist');

    await expect(
      createChunkedPDFSource('/path/to/file.pdf', pdfjsLib)
    ).rejects.toThrow('Electron API not available');

    (window as any).electronAPI = originalAPI;
  });
});

