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

  it('handles PDF thumbnail generation errors gracefully', async () => {
    const mockCase = { name: 'Case', path: '/vault/case' };
    
    mockElectronAPI.listCaseFiles.mockResolvedValue([
      {
        name: 'test.pdf',
        path: '/vault/case/test.pdf',
        size: 100,
        modified: Date.now(),
        isFolder: false,
      },
    ]);

    // Mock PDF read to fail
    mockElectronAPI.readPDFFile.mockRejectedValue(new Error('PDF read failed'));

    const { result } = renderHook(() => useArchive(), { wrapper });

    act(() => {
      result.current.setCurrentCase(mockCase);
    });

    await waitFor(
      () => {
        expect(result.current.files.length).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );

    // File should still exist even if thumbnail generation failed
    const pdfFile = result.current.files.find(f => f.name === 'test.pdf');
    expect(pdfFile).toBeDefined();
    // Thumbnail should be a placeholder SVG on error
    expect(pdfFile?.thumbnail).toBeDefined();
    expect(pdfFile?.thumbnail).toContain('data:image/svg+xml');
  });

  it('uses global thumbnail cache across navigation', async () => {
    const mockCase = { name: 'Case', path: '/vault/case' };
    const thumbnailData = 'thumbnail-data-url';
    
    mockElectronAPI.listCaseFiles.mockResolvedValue([
      {
        name: 'image.jpg',
        path: '/vault/case/image.jpg',
        size: 100,
        modified: Date.now(),
        isFolder: false,
      },
    ]);
    mockElectronAPI.getFileThumbnail.mockResolvedValue(thumbnailData);

    const { result } = renderHook(() => useArchive(), { wrapper });

    act(() => {
      result.current.setCurrentCase(mockCase);
    });

    // Wait for thumbnail to load
    await waitFor(
      () => {
        const file = result.current.files.find(f => f.name === 'image.jpg');
        return file?.thumbnail === thumbnailData;
      },
      { timeout: 3000 },
    );

    const firstThumbnail = result.current.files.find(f => f.name === 'image.jpg')?.thumbnail;
    expect(firstThumbnail).toBe(thumbnailData);

    // Navigate to folder and back
    act(() => {
      result.current.openFolder('/vault/case/subfolder');
    });

    mockElectronAPI.listCaseFiles.mockResolvedValue([
      {
        name: 'other.jpg',
        path: '/vault/case/subfolder/other.jpg',
        size: 100,
        modified: Date.now(),
        isFolder: false,
      },
    ]);

    await waitFor(
      () => {
        expect(result.current.files.length).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );

    // Go back to case root
    act(() => {
      result.current.goBackToCase();
    });

    // Reload files with preserveThumbnails - don't call getFileThumbnail again
    mockElectronAPI.getFileThumbnail.mockClear();
    
    await act(async () => {
      await result.current.refreshFiles();
    });

    // Thumbnail should still be cached (getFileThumbnail should not be called again)
    const fileAfterRefresh = result.current.files.find(f => f.name === 'image.jpg');
    expect(fileAfterRefresh?.thumbnail).toBe(firstThumbnail);
    // Verify thumbnail wasn't requested again
    expect(mockElectronAPI.getFileThumbnail).not.toHaveBeenCalled();
  });

  it('handles optimistic rename updates and rollback on failure', async () => {
    const mockCase = { name: 'Case', path: '/vault/case' };
    
    mockElectronAPI.listCaseFiles.mockResolvedValue([
      {
        name: 'oldname.pdf',
        path: '/vault/case/oldname.pdf',
        size: 100,
        modified: Date.now(),
        isFolder: false,
      },
    ]);
    mockElectronAPI.renameFile.mockResolvedValue({ success: true, newPath: '/vault/case/newname.pdf' });

    const { result } = renderHook(() => useArchive(), { wrapper });

    act(() => {
      result.current.setCurrentCase(mockCase);
    });

    await waitFor(
      () => {
        expect(result.current.files.length).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );

    // Rename file
    await act(async () => {
      const success = await result.current.renameFile('/vault/case/oldname.pdf', 'newname.pdf');
      expect(success).toBe(true);
    });

    // File should be renamed
    expect(result.current.files.find(f => f.name === 'newname.pdf')).toBeDefined();
    expect(result.current.files.find(f => f.name === 'oldname.pdf')).toBeUndefined();

    // Test rollback on failure
    mockElectronAPI.renameFile.mockRejectedValue(new Error('Rename failed'));

    await act(async () => {
      const success = await result.current.renameFile('/vault/case/newname.pdf', 'anothername.pdf');
      expect(success).toBe(false);
    });

    // File should still be 'newname.pdf' (rollback should restore)
    expect(result.current.files.find(f => f.name === 'newname.pdf')).toBeDefined();
  });

  it('handles thumbnail loading errors gracefully', async () => {
    const mockCase = { name: 'Case', path: '/vault/case' };
    
    mockElectronAPI.listCaseFiles.mockResolvedValue([
      {
        name: 'image.jpg',
        path: '/vault/case/image.jpg',
        size: 100,
        modified: Date.now(),
        isFolder: false,
      },
    ]);
    
    // First call succeeds, then fail on subsequent calls
    mockElectronAPI.getFileThumbnail
      .mockRejectedValueOnce(new Error('Thumbnail generation failed'));

    const { result } = renderHook(() => useArchive(), { wrapper });

    act(() => {
      result.current.setCurrentCase(mockCase);
    });

    await waitFor(
      () => {
        expect(result.current.files.length).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );

    // Wait a bit for thumbnail loading to complete/fail
    await new Promise(resolve => setTimeout(resolve, 500));

    // File should still exist even if thumbnail failed
    const file = result.current.files.find(f => f.name === 'image.jpg');
    expect(file).toBeDefined();
    // Thumbnail should be undefined on error (error is caught and logged, but thumbnail not set)
    expect(file?.thumbnail).toBeUndefined();
  });

  it('handles case with description and background image', async () => {
    mockElectronAPI.getArchiveConfig.mockResolvedValue({ archiveDrive: '/vault' });
    mockElectronAPI.listArchiveCases.mockResolvedValue([
      {
        name: 'Case1',
        path: '/vault/Case1',
        description: 'Test description',
        backgroundImage: '/vault/Case1/.case-background-image.jpg',
      },
    ]);

    const { result } = renderHook(() => useArchive(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.cases.length).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );

    const case1 = result.current.cases.find(c => c.name === 'Case1');
    expect(case1?.description).toBe('Test description');
    expect(case1?.backgroundImage).toBe('/vault/Case1/.case-background-image.jpg');
  });
});


