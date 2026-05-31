import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFileConverterSourcePreview } from './useFileConverterSourcePreview';
import { mockElectronAPI } from '../test-utils/mocks';
import type { FileConverterSource } from '../types';

describe('useFileConverterSourcePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = mockElectronAPI;
  });

  it('loads image preview from readFileData', async () => {
    mockElectronAPI.readFileData.mockResolvedValue({
      data: 'abc123',
      mimeType: 'image/png',
      fileName: 'evidence.png',
    });

    const source: FileConverterSource = {
      origin: 'external',
      sourcePath: 'C:/cases/evidence.png',
      fileName: 'evidence.png',
      category: 'image',
      casePath: null,
    };

    const { result } = renderHook(() => useFileConverterSourcePreview(source));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.imageSrc).toBe('data:image/png;base64,abc123');
    expect(result.current.videoSrc).toBeNull();
  });

  it('loads video preview via vault-video protocol', async () => {
    const source: FileConverterSource = {
      origin: 'vault',
      sourcePath: 'D:/Vault/case/interview.mp4',
      fileName: 'interview.mp4',
      category: 'video',
      casePath: 'D:/Vault/case',
    };

    const { result } = renderHook(() => useFileConverterSourcePreview(source));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.videoSrc).toBe(`vault-video://${encodeURIComponent(source.sourcePath)}`);
  });

  it('loads pdf preview from thumbnail APIs', async () => {
    mockElectronAPI.readPDFThumbnail.mockResolvedValue('data:image/jpeg;base64,pdfthumb');

    const source: FileConverterSource = {
      origin: 'vault',
      sourcePath: 'D:/Vault/case/report.pdf',
      fileName: 'report.pdf',
      category: 'pdf',
      casePath: 'D:/Vault/case',
    };

    const { result } = renderHook(() => useFileConverterSourcePreview(source));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.imageSrc).toBe('data:image/jpeg;base64,pdfthumb');
  });
});
