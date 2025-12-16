import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createChunkedPDFSource } from './pdfSource';
import { mockElectronAPI } from '../test-utils/mocks';

// Mock URL.createObjectURL and URL.revokeObjectURL for jsdom
const mockCreateObjectURL = vi.fn((blob: Blob) => `blob:${blob.type}-${Date.now()}`);
const mockRevokeObjectURL = vi.fn();

// Mock pdfjs-dist completely to avoid initialization issues
const mockGetDocument = vi.fn();
vi.mock('pdfjs-dist', () => {
  const mockPdf = {
    numPages: 1,
    getPage: vi.fn(),
  };
  
  const mockLoadingTask = {
    promise: Promise.resolve(mockPdf),
  };
  
  // Initialize with default return value
  mockGetDocument.mockReturnValue(mockLoadingTask);
  
  // Return both default export and named export
  const mockModule = {
    GlobalWorkerOptions: {
      workerSrc: '',
    },
    getDocument: mockGetDocument,
  };
  
  return {
    default: mockModule,
    ...mockModule, // Also export at top level for compatibility
  };
});

describe('pdfSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL methods
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    mockElectronAPI.getPDFFileSize.mockResolvedValue(1000);
    mockElectronAPI.readPDFFileChunk.mockResolvedValue('dGVzdA=='); // base64 for "test"
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    expect(result).toEqual(mockPdf);
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
      .mockResolvedValueOnce('Y2h1bmsx') // base64 for "chunk1"
      .mockResolvedValueOnce('Y2h1bmsy'); // base64 for "chunk2"

    await createChunkedPDFSource('/path/to/file.pdf', pdfjsLib);

    // Should read 2 chunks
    expect(mockElectronAPI.readPDFFileChunk).toHaveBeenCalledTimes(2);
    expect(mockElectronAPI.readPDFFileChunk).toHaveBeenCalledWith('/path/to/file.pdf', 0, 2 * 1024 * 1024);
    expect(mockElectronAPI.readPDFFileChunk).toHaveBeenCalledWith('/path/to/file.pdf', 2 * 1024 * 1024, 2 * 1024 * 1024);
  });

  it('should handle errors and cleanup blob URL', async () => {
    const pdfjsLib = await import('pdfjs-dist');

    const error = new Error('PDF load failed');
    mockGetDocument.mockReturnValueOnce({
      promise: Promise.reject(error),
    });

    mockElectronAPI.getPDFFileSize.mockResolvedValue(1000);
    mockElectronAPI.readPDFFileChunk.mockResolvedValue('dGVzdA==');

    await expect(
      createChunkedPDFSource('/path/to/file.pdf', pdfjsLib)
    ).rejects.toThrow('PDF load failed');

    // Blob URL should be cleaned up on error
    expect(mockRevokeObjectURL).toHaveBeenCalled();
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

