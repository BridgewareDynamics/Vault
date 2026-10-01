import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileConverter } from './useFileConverter';
import { mockElectronAPI } from '../test-utils/mocks';
import type { FileConverterSource } from '../types';

const mockCreateChunkedPDFSource = vi.fn();

vi.mock('../utils/pdfSource', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/pdfSource')>();
  return {
    ...actual,
    createChunkedPDFSource: (...args: unknown[]) => mockCreateChunkedPDFSource(...args),
  };
});

vi.mock('../utils/pdfWorker', () => ({
  setupPDFWorker: vi.fn().mockResolvedValue(undefined),
}));

describe('useFileConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateChunkedPDFSource.mockReset();

    const contextMock = {
      filter: '',
      clearRect: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(contextMock as never);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,abc');

    mockCreateChunkedPDFSource.mockResolvedValue({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 100, height: 100 }),
        render: vi.fn().mockReturnValue({ promise: Promise.resolve(undefined) }),
        cleanup: vi.fn(),
      }),
      destroy: vi.fn().mockResolvedValue(undefined),
    });

    mockElectronAPI.readPDFFile.mockResolvedValue({
      type: 'file-path',
      path: '/path/large.pdf',
    });

    mockElectronAPI.convertFile.mockResolvedValue({
      success: true,
      outputPath: '/path/output.jpg',
    });
  });

  it('uses chunked PDF source when readPDFFile returns file-path data', async () => {
    const source: FileConverterSource = {
      origin: 'vault',
      sourcePath: '/path/large.pdf',
      fileName: 'large.pdf',
      category: 'pdf',
      casePath: '/vault/case',
    };

    const { result } = renderHook(() => useFileConverter());

    await act(async () => {
      await result.current.convert(source, { format: 'jpeg', dpi: 150, quality: 85 });
    });

    expect(mockCreateChunkedPDFSource).toHaveBeenCalledWith(
      '/path/large.pdf',
      expect.anything(),
    );
    expect(mockElectronAPI.convertFile).toHaveBeenCalled();
  });
});
