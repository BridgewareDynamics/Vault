// path: src/hooks/usePDFExtraction.additional.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePDFExtraction } from './usePDFExtraction';
import { mockElectronAPI } from '../test-utils/mocks';

// Match the existing pdfjs-dist mock so behaviour is consistent
const mockGetDocument = vi.fn();
const mockCreateChunkedPDFSource = vi.fn();

vi.mock('../utils/pdfSource', () => ({
  createChunkedPDFSource: (...args: unknown[]) => mockCreateChunkedPDFSource(...args),
  cleanupPDFBlobUrl: vi.fn(),
}));

vi.mock('pdfjs-dist', async () => {
  const actual = await vi.importActual('pdfjs-dist');
  return {
    ...actual,
    getDocument: mockGetDocument,
    default: {
      ...(actual as { default: Record<string, unknown> }).default,
      GlobalWorkerOptions: {
        workerSrc: '',
      },
      getDocument: mockGetDocument,
    },
  };
});

describe('usePDFExtraction – additional coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocument.mockReset();
    mockCreateChunkedPDFSource.mockReset();
    mockElectronAPI.validatePDFForExtraction.mockResolvedValue({ valid: true, path: '/test.pdf' });
    mockElectronAPI.readPDFFile.mockResolvedValue('dGVzdA==');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when readPDFFile returns an unexpected data format', async () => {
    mockElectronAPI.readPDFFile.mockResolvedValueOnce({ not: 'expected' } as any);

    const { result } = renderHook(() => usePDFExtraction());

    await act(async () => {
      await expect(result.current.extractPDF('/test.pdf')).rejects.toThrow(
        /Unexpected PDF file data format/,
      );
    });
  });

  it('hits the second Electron API availability check when API disappears mid-flow', async () => {
    const originalAPI = window.electronAPI;

    // First validate call succeeds but then removes electronAPI so the
    // second availability check inside extractPDF fails.
    mockElectronAPI.validatePDFForExtraction.mockImplementationOnce(async () => {
      const result = { valid: true, path: '/test.pdf' };
      (window as any).electronAPI = undefined;
      return result as any;
    });

    const { result } = renderHook(() => usePDFExtraction());

    await act(async () => {
      await expect(result.current.extractPDF('/test.pdf')).rejects.toThrow(
        /readPDFFile/,
      );
    });

    // Restore global to avoid side effects on other tests
    (window as any).electronAPI = originalAPI;
  });

  it('clears render progress interval when page render fails', async () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const contextMock = {
      filter: '',
      clearRect: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(contextMock as never);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,abc');

    const mockPdf = {
      numPages: 1,
      destroy: vi.fn().mockResolvedValue(undefined),
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 800, height: 600 }),
        render: vi.fn().mockImplementation(() => ({
          promise: Promise.reject(new Error('Render failed')),
        })),
        cleanup: vi.fn(),
      }),
    };

    mockElectronAPI.readPDFFile.mockResolvedValueOnce({
      type: 'base64',
      data: btoa('test'),
    });

    const loadingTask = {
      promise: Promise.resolve(mockPdf),
    };
    mockGetDocument.mockReturnValue(loadingTask);

    const { result } = renderHook(() => usePDFExtraction());

    await act(async () => {
      await expect(result.current.extractPDF('/test.pdf')).rejects.toThrow();
    });

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('cancels in-flight page render when extraction is cancelled', async () => {
    vi.useFakeTimers();

    const cancelRender = vi.fn();
    let resolveRender!: () => void;
    const renderPromise = new Promise<void>((resolve) => {
      resolveRender = resolve;
    });

    const contextMock = {
      filter: '',
      clearRect: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(contextMock as never);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,abc');

    const mockPdf = {
      numPages: 1,
      destroy: vi.fn().mockResolvedValue(undefined),
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 800, height: 600 }),
        render: vi.fn().mockReturnValue({
          cancel: cancelRender,
          promise: renderPromise,
        }),
        cleanup: vi.fn(),
      }),
    };

    mockElectronAPI.readPDFFile.mockResolvedValueOnce({
      type: 'base64',
      data: btoa('test'),
    });

    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(mockPdf),
    });

    const { result } = renderHook(() => usePDFExtraction());

    let extractPromise!: Promise<unknown>;
    act(() => {
      extractPromise = result.current.extractPDF('/test.pdf');
    });

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(150);
    });

    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
      resolveRender();
      try {
        await extractPromise;
      } catch {
        // expected cancellation
      }
    });

    expect(cancelRender).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('cancels during chunked PDF load and clears extracting state', async () => {
    mockElectronAPI.readPDFFile.mockResolvedValueOnce({
      type: 'file-path',
      path: '/big.pdf',
    });

    mockCreateChunkedPDFSource.mockImplementation(
      (_path, _lib, _warn, _progress, options?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );

    const { result } = renderHook(() => usePDFExtraction());

    let extractPromise!: Promise<unknown>;
    act(() => {
      extractPromise = result.current.extractPDF('/big.pdf');
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      try {
        await extractPromise;
      } catch {
        // expected cancellation
      }
    });

    expect(result.current.isExtracting).toBe(false);
    expect(result.current.error).toContain('cancelled');
  });

  it('reset clears extraction state after an error', async () => {
    mockElectronAPI.validatePDFForExtraction.mockRejectedValueOnce(
      new Error('Some validation error'),
    );

    const { result } = renderHook(() => usePDFExtraction());

    await act(async () => {
      try {
        await result.current.extractPDF('/test.pdf');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.reset();
    });

    expect(result.current.isExtracting).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.extractedPages).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.statusMessage).toBe('');
  });
});





