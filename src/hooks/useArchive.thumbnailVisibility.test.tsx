import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useArchive } from './useArchive';
import { ToastProvider } from '../components/Toast/ToastContext';
import { mockElectronAPI } from '../test-utils/mocks';
import { resetThumbnailServiceForTests } from '../utils/thumbnailService';
import { resetArchivePrefetchForTests } from '../utils/archivePrefetch';

describe('useArchive thumbnail visibility', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>{children}</ToastProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    resetThumbnailServiceForTests();
    resetArchivePrefetchForTests();
    mockElectronAPI.getArchiveConfig.mockResolvedValue({ archiveDrive: '/vault' });
    mockElectronAPI.listArchiveCases.mockResolvedValue([]);
    mockElectronAPI.getFileThumbnail.mockResolvedValue('thumb-data');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not eagerly load thumbnails for every file in loadFiles', async () => {
    mockElectronAPI.listCaseFiles.mockResolvedValue([
      { name: 'a.pdf', path: '/vault/case/a.pdf', size: 100, modified: Date.now(), isFolder: false },
      { name: 'b.pdf', path: '/vault/case/b.pdf', size: 100, modified: Date.now(), isFolder: false },
      { name: 'c.jpg', path: '/vault/case/c.jpg', size: 100, modified: Date.now(), isFolder: false },
    ]);

    const { result } = renderHook(() => useArchive(), { wrapper });
    const mockCase = { name: 'Case', path: '/vault/case' };

    act(() => {
      result.current.setCurrentCase(mockCase);
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(3);
    });

    expect(mockElectronAPI.getFileThumbnail).not.toHaveBeenCalled();
  });

  it('loads thumbnail when ensureThumbnailForFile is called', async () => {
    mockElectronAPI.listCaseFiles.mockResolvedValue([
      { name: 'a.pdf', path: '/vault/case/a.pdf', size: 100, modified: Date.now(), isFolder: false },
    ]);
    mockElectronAPI.readPDFThumbnail.mockResolvedValue(null);
    mockElectronAPI.getPDFFileSize.mockResolvedValue(1000);
    mockElectronAPI.readPDFFileChunk.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

    const { result } = renderHook(() => useArchive(), { wrapper });
    const mockCase = { name: 'Case', path: '/vault/case' };

    act(() => {
      result.current.setCurrentCase(mockCase);
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(1);
    });

    act(() => {
      result.current.ensureThumbnailForFile('/vault/case/a.pdf', 'pdf');
    });

    await waitFor(() => {
      expect(mockElectronAPI.readPDFThumbnail).toHaveBeenCalled();
    });
  });
});
