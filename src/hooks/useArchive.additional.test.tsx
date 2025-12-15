// path: src/hooks/useArchive.additional.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useArchive } from './useArchive';
import { ToastProvider } from '../components/Toast/ToastContext';
import { mockElectronAPI } from '../test-utils/mocks';

describe('useArchive – additional coverage', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>{children}</ToastProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.getArchiveConfig.mockResolvedValue({ archiveDrive: '/vault' });
    mockElectronAPI.listArchiveCases.mockResolvedValue([]);
    mockElectronAPI.listCaseFiles.mockResolvedValue([]);
    mockElectronAPI.getFileThumbnail.mockResolvedValue('thumb-data');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters out archive metadata files and sets file types correctly', async () => {
    const mockCase = { name: 'Case', path: '/vault/case' };

    mockElectronAPI.listCaseFiles.mockResolvedValue([
      // Visible files/folders
      {
        name: 'file1.pdf',
        path: '/vault/case/file1.pdf',
        size: 100,
        modified: Date.now(),
        isFolder: false,
      },
      {
        name: 'image1.jpg',
        path: '/vault/case/image1.jpg',
        size: 200,
        modified: Date.now(),
        isFolder: false,
      },
      {
        name: 'videos',
        path: '/vault/case/videos',
        size: 0,
        modified: Date.now(),
        isFolder: true,
      },
      // Metadata files that should be filtered
      {
        name: '.parent-pdf',
        path: '/vault/case/.parent-pdf',
        size: 10,
        modified: Date.now(),
        isFolder: false,
      },
      {
        name: '.case-background',
        path: '/vault/case/.case-background',
        size: 10,
        modified: Date.now(),
        isFolder: false,
      },
      {
        name: '.case-description',
        path: '/vault/case/.case-description',
        size: 10,
        modified: Date.now(),
        isFolder: false,
      },
      {
        name: '.vault-archive.json',
        path: '/vault/case/.vault-archive.json',
        size: 10,
        modified: Date.now(),
        isFolder: false,
      },
      {
        name: '.case-background-image.png',
        path: '/vault/case/.case-background-image.png',
        size: 10,
        modified: Date.now(),
        isFolder: false,
      },
    ]);

    const { result } = renderHook(() => useArchive(), { wrapper });

    act(() => {
      result.current.setCurrentCase(mockCase);
    });

    await waitFor(
      () => {
        // Only non-metadata entries should remain
        expect(result.current.files.map((f) => f.name).sort()).toEqual(
          ['file1.pdf', 'image1.jpg', 'videos'].sort(),
        );
      },
      { timeout: 2000 },
    );

    const pdf = result.current.files.find((f) => f.name === 'file1.pdf');
    const image = result.current.files.find((f) => f.name === 'image1.jpg');
    const folder = result.current.files.find((f) => f.name === 'videos');

    expect(pdf?.type).toBe('pdf');
    expect(image?.type).toBe('image');
    expect(folder?.isFolder).toBe(true);
  });

  it('uses folder/pdf relationships in filteredFiles when searching', async () => {
    const mockCase = { name: 'Case', path: '/vault/case' };

    mockElectronAPI.listCaseFiles.mockResolvedValue([
      {
        name: 'case-doc.pdf',
        path: '/vault/case/case-doc.pdf',
        size: 100,
        modified: Date.now(),
        isFolder: false,
      },
      {
        name: 'case-doc (pages)',
        path: '/vault/case/case-doc (pages)',
        size: 0,
        modified: Date.now(),
        isFolder: true,
        folderType: 'extraction',
        parentPdfName: 'case-doc.pdf',
      } as any,
    ]);

    const { result } = renderHook(() => useArchive(), { wrapper });

    act(() => {
      result.current.setCurrentCase(mockCase);
    });

    // Wait until files have been loaded and thumbnails requested
    await waitFor(
      () => {
        expect(result.current.files.length).toBe(2);
      },
      { timeout: 2000 },
    );

    // Search by folder name should also include the PDF
    act(() => {
      result.current.setSearchQuery('pages');
    });

    const namesForFolderSearch = result.current.files.map((f) => f.name).sort();
    expect(namesForFolderSearch).toEqual(['case-doc (pages)', 'case-doc.pdf'].sort());

    // Search by pdf name should also include the folder
    act(() => {
      result.current.setSearchQuery('case-doc.pdf');
    });

    const namesForPdfSearch = result.current.files.map((f) => f.name).sort();
    expect(namesForPdfSearch).toEqual(['case-doc (pages)', 'case-doc.pdf'].sort());
  });

  it('handles deleteFile for current folder with and without parent in navigation stack', async () => {
    const mockCase = { name: 'Case', path: '/vault/case' };
    mockElectronAPI.listCaseFiles.mockResolvedValue([]);
    mockElectronAPI.deleteFile.mockResolvedValue(true);

    const { result } = renderHook(() => useArchive(), { wrapper });

    // Case with parent folder in navigation stack
    await act(async () => {
      result.current.setCurrentCase(mockCase);
      result.current.openFolder('/vault/case/folder1');
      result.current.openFolder('/vault/case/folder2');
    });

    await act(async () => {
      const success = await result.current.deleteFile('/vault/case/folder2', true);
      expect(success).toBe(true);
    });

    // Case with no parent in navigation stack (back to case root)
    await act(async () => {
      result.current.goBackToCase();
      result.current.openFolder('/vault/case/only-folder');
    });

    expect(result.current.currentFolderPath).toBe('/vault/case/only-folder');

    await act(async () => {
      const success = await result.current.deleteFile('/vault/case/only-folder', true);
      expect(success).toBe(true);
    });
  });

  it('navigates directly to a folder path not in the navigation stack', () => {
    const mockCase = { name: 'Case', path: '/vault/case' };
    const { result } = renderHook(() => useArchive(), { wrapper });

    act(() => {
      result.current.setCurrentCase(mockCase);
      result.current.openFolder('/vault/case/folder1');
    });

    act(() => {
      // This path is not in the navigation stack; navigateToFolder should still set it
      result.current.navigateToFolder('/vault/case/direct-folder');
    });

    expect(result.current.currentFolderPath).toBe('/vault/case/direct-folder');
  });
});


