// path: src/hooks/usePDFExtraction.additional.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePDFExtraction } from './usePDFExtraction';
import { mockElectronAPI } from '../test-utils/mocks';

// Match the existing pdfjs-dist mock so behaviour is consistent
vi.mock('pdfjs-dist', async () => {
  const actual = await vi.importActual('pdfjs-dist');
  return {
    ...actual,
    default: {
      ...(actual as any).default,
      GlobalWorkerOptions: {
        workerSrc: '',
      },
      getDocument: vi.fn(),
    },
  };
});

describe('usePDFExtraction – additional coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        /Failed to process PDF/,
      );
    });
  });

  it('hits the second Electron API availability check when API disappears mid-flow', async () => {
    const originalAPI = window.electronAPI;

    // First validate call succeeds but then removes electronAPI so the
    // second availability check inside extractPDF fails.
    mockElectronAPI.validatePDFForExtraction.mockImplementationOnce(async (...args: any[]) => {
      const result = { valid: true, path: '/test.pdf' };
      (window as any).electronAPI = undefined;
      return result as any;
    });

    const { result } = renderHook(() => usePDFExtraction());

    await act(async () => {
      await expect(result.current.extractPDF('/test.pdf')).rejects.toThrow(
        /Application not fully loaded/,
      );
    });

    // Restore global to avoid side effects on other tests
    (window as any).electronAPI = originalAPI;
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





