// path: src/hooks/useArchiveExtraction.additional.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useArchiveExtraction } from './useArchiveExtraction';
import { ToastProvider } from '../components/Toast/ToastContext';
import { mockElectronAPI } from '../test-utils/mocks';

// Reuse the existing pdfjs-dist mock behaviour from the main test file
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

describe('useArchiveExtraction – additional coverage', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>{children}</ToastProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.validatePDFForExtraction.mockResolvedValue({ valid: true, path: '/test.pdf' });
    mockElectronAPI.readPDFFile.mockResolvedValue('dGVzdA==');
    mockElectronAPI.extractPDFFromArchive.mockResolvedValue({
      success: true,
      messages: ['Extraction complete'],
      extractionFolder: '/path/to/folder',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides a reset function that can be called safely', () => {
    const { result } = renderHook(() => useArchiveExtraction(), { wrapper });

    act(() => {
      result.current.reset();
    });

    // After reset, state should still be at its initial defaults
    expect(result.current.isExtracting).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.statusMessage).toBe('');
    expect(result.current.extractingCasePath).toBeNull();
    expect(result.current.extractingFolderPath).toBeNull();
  });

  it('throws for unexpected PDF data format from readPDFFile', async () => {
    mockElectronAPI.readPDFFile.mockResolvedValueOnce({ unexpected: true } as any);

    const { result } = renderHook(() => useArchiveExtraction(), { wrapper });

    await act(async () => {
      await expect(
        result.current.extractPDF('/test.pdf', '/case/path', 'folder', false),
      ).rejects.toThrow(/Failed to process PDF/);
    });
  });
});


