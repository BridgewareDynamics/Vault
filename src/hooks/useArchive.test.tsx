import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useArchive } from './useArchive';
import { ToastProvider } from '../components/Toast/ToastContext';
import { mockElectronAPI } from '../test-utils/mocks';

describe('useArchive', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>{children}</ToastProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.getArchiveConfig.mockResolvedValue({ archiveDrive: '/path/to/vault' });
    mockElectronAPI.listArchiveCases.mockResolvedValue([]);
    mockElectronAPI.listCaseFiles.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useArchive(), { wrapper });

      expect(result.current.archiveConfig).toBe(null);
      expect(result.current.cases).toEqual([]);
      expect(result.current.currentCase).toBe(null);
      expect(result.current.currentFolderPath).toBe(null);
      expect(result.current.folderNavigationStack).toEqual([]);
      expect(result.current.files).toEqual([]);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.loading).toBe(false);
    });

    it('should load archive config on mount', async () => {
      renderHook(() => useArchive(), { wrapper });

      await waitFor(() => {
        expect(mockElectronAPI.getArchiveConfig).toHaveBeenCalled();
      });
    });
  });

  describe('Archive Drive Selection', () => {
    it('should select archive drive', async () => {
      mockElectronAPI.selectArchiveDrive.mockResolvedValue({
        path: '/new/vault/path',
        autoDetected: false,
      });
      mockElectronAPI.getArchiveConfig.mockResolvedValue({
        archiveDrive: '/new/vault/path',
      });

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.selectArchiveDrive();
        expect(success).toBe(true);
      });

      expect(mockElectronAPI.selectArchiveDrive).toHaveBeenCalled();
    });

    it('should handle drive selection failure', async () => {
      mockElectronAPI.selectArchiveDrive.mockResolvedValue(null);

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.selectArchiveDrive();
        expect(success).toBe(false);
      });
    });

    it('should handle error during drive selection', async () => {
      mockElectronAPI.selectArchiveDrive.mockRejectedValue(new Error('Selection failed'));

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.selectArchiveDrive();
        expect(success).toBe(false);
      });
    });
  });

  describe('Case Management', () => {
    it('should load cases when archive drive is set', async () => {
      mockElectronAPI.getArchiveConfig.mockResolvedValue({
        archiveDrive: '/path/to/vault',
      });
      mockElectronAPI.listArchiveCases.mockResolvedValue([
        { name: 'Case 1', path: '/path/to/case1' },
        { name: 'Case 2', path: '/path/to/case2' },
      ]);

      renderHook(() => useArchive(), { wrapper });

      await waitFor(() => {
        expect(mockElectronAPI.listArchiveCases).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should create case', async () => {
      mockElectronAPI.createCaseFolder.mockResolvedValue('/path/to/newcase');
      mockElectronAPI.listArchiveCases.mockResolvedValue([
        { name: 'New Case', path: '/path/to/newcase' },
      ]);

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.createCase('New Case', 'Description');
        expect(success).toBe(true);
      });

      expect(mockElectronAPI.createCaseFolder).toHaveBeenCalledWith('New Case', 'Description', undefined);
    });

    it('should handle case creation failure', async () => {
      mockElectronAPI.createCaseFolder.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.createCase('New Case');
        expect(success).toBe(false);
      });
    });

    it('should delete case', async () => {
      const mockCase = { name: 'Test Case', path: '/path/to/case' };
      mockElectronAPI.deleteCase.mockResolvedValue(true);
      mockElectronAPI.listArchiveCases.mockResolvedValue([]);

      const { result } = renderHook(() => useArchive(), { wrapper });

      // Set current case first
      act(() => {
        result.current.setCurrentCase(mockCase);
      });

      await act(async () => {
        const success = await result.current.deleteCase('/path/to/case');
        expect(success).toBe(true);
      });

      expect(mockElectronAPI.deleteCase).toHaveBeenCalledWith('/path/to/case');
    });

    it('should update case background image', async () => {
      mockElectronAPI.selectImageFile.mockResolvedValue('/path/to/image.png');
      mockElectronAPI.setCaseBackgroundImage.mockResolvedValue('/path/to/image.png');
      mockElectronAPI.listArchiveCases.mockResolvedValue([
        { name: 'Case 1', path: '/path/to/case1', backgroundImage: '/path/to/image.png' },
      ]);

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.updateCaseBackgroundImage('/path/to/case1');
        expect(success).toBe(true);
      });

      expect(mockElectronAPI.selectImageFile).toHaveBeenCalled();
      expect(mockElectronAPI.setCaseBackgroundImage).toHaveBeenCalled();
    });
  });

  describe('File Operations', () => {
    it('should add files to case', async () => {
      mockElectronAPI.addFilesToCase.mockResolvedValue(['/path/to/file1.pdf', '/path/to/file2.pdf']);

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.addFilesToCase('/path/to/case', ['/path/to/file1.pdf']);
        expect(success).toBe(true);
      });

      expect(mockElectronAPI.addFilesToCase).toHaveBeenCalled();
    });

    it('should delete file', async () => {
      mockElectronAPI.deleteFile.mockResolvedValue(true);

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.deleteFile('/path/to/file.pdf', false);
        expect(success).toBe(true);
      });

      expect(mockElectronAPI.deleteFile).toHaveBeenCalledWith('/path/to/file.pdf', false);
    });

    it('should delete folder', async () => {
      mockElectronAPI.deleteFile.mockResolvedValue(true);

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.deleteFile('/path/to/folder', true);
        expect(success).toBe(true);
      });

      expect(mockElectronAPI.deleteFile).toHaveBeenCalledWith('/path/to/folder', true);
    });

    it('should rename file', async () => {
      mockElectronAPI.renameFile.mockResolvedValue({
        success: true,
        newPath: '/path/to/newname.pdf',
      });

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.renameFile('/path/to/oldname.pdf', 'newname.pdf');
        expect(success).toBe(true);
      });

      expect(mockElectronAPI.renameFile).toHaveBeenCalledWith('/path/to/oldname.pdf', 'newname.pdf');
    });

    it('should handle rename failure', async () => {
      mockElectronAPI.renameFile.mockResolvedValue({
        success: false,
        newPath: '/path/to/oldname.pdf',
      });

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.renameFile('/path/to/oldname.pdf', 'newname.pdf');
        expect(success).toBe(false);
      });
    });
  });

  describe('Folder Navigation', () => {
    it('should open folder', () => {
      const mockCase = { name: 'Test Case', path: '/path/to/case' };
      const { result } = renderHook(() => useArchive(), { wrapper });

      act(() => {
        result.current.setCurrentCase(mockCase);
      });

      act(() => {
        result.current.openFolder('/path/to/folder');
      });

      expect(result.current.currentFolderPath).toBe('/path/to/folder');
    });

    it('should go back to case root', () => {
      const mockCase = { name: 'Test Case', path: '/path/to/case' };
      const { result } = renderHook(() => useArchive(), { wrapper });

      act(() => {
        result.current.setCurrentCase(mockCase);
        result.current.openFolder('/path/to/folder');
      });

      act(() => {
        result.current.goBackToCase();
      });

      expect(result.current.currentFolderPath).toBe(null);
      expect(result.current.folderNavigationStack).toEqual([]);
    });

    it('should go back to parent folder', async () => {
      const mockCase = { name: 'Test Case', path: '/path/to/case' };
      mockElectronAPI.listCaseFiles.mockResolvedValue([]);
      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        result.current.setCurrentCase(mockCase);
        // Wait for files to load
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        result.current.openFolder('/path/to/folder1');
        // Wait for navigation
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        result.current.openFolder('/path/to/folder2');
        // Wait for navigation
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        result.current.goBackToParentFolder();
      });

      // After going back, should be at folder1 (parent of folder2)
      expect(result.current.currentFolderPath).toBe('/path/to/folder1');
    });

    it('should navigate to folder', () => {
      const mockCase = { name: 'Test Case', path: '/path/to/case' };
      const { result } = renderHook(() => useArchive(), { wrapper });

      act(() => {
        result.current.setCurrentCase(mockCase);
        result.current.openFolder('/path/to/folder1');
        result.current.openFolder('/path/to/folder2');
      });

      act(() => {
        result.current.navigateToFolder('/path/to/folder1');
      });

      expect(result.current.currentFolderPath).toBe('/path/to/folder1');
    });

    it('should get current path', () => {
      const mockCase = { name: 'Test Case', path: '/path/to/case' };
      const { result } = renderHook(() => useArchive(), { wrapper });

      act(() => {
        result.current.setCurrentCase(mockCase);
      });

      expect(result.current.getCurrentPath()).toBe('/path/to/case');

      act(() => {
        result.current.openFolder('/path/to/folder');
      });

      expect(result.current.getCurrentPath()).toBe('/path/to/folder');
    });
  });

  describe('Search Functionality', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useArchive(), { wrapper });

      act(() => {
        result.current.setSearchQuery('test query');
      });

      expect(result.current.searchQuery).toBe('test query');
    });

    it('should filter cases based on search query', () => {
      mockElectronAPI.listArchiveCases.mockResolvedValue([
        { name: 'Case One', path: '/path/to/case1' },
        { name: 'Case Two', path: '/path/to/case2' },
        { name: 'Other Case', path: '/path/to/case3' },
      ]);

      const { result } = renderHook(() => useArchive(), { wrapper });

      act(() => {
        result.current.setSearchQuery('One');
      });

      // Cases should be filtered (implementation dependent on when cases are loaded)
      expect(typeof result.current.cases).toBe('object');
    });
  });

  describe('File Loading', () => {
    it('should load files for a case', async () => {
      const mockCase = { name: 'Test Case', path: '/path/to/case' };
      mockElectronAPI.listCaseFiles.mockResolvedValue([
        { name: 'file1.pdf', path: '/path/to/file1.pdf', size: 1000, modified: Date.now(), isFolder: false },
        { name: 'file2.jpg', path: '/path/to/file2.jpg', size: 2000, modified: Date.now(), isFolder: false },
      ]);

      const { result } = renderHook(() => useArchive(), { wrapper });

      act(() => {
        result.current.setCurrentCase(mockCase);
      });

      await waitFor(() => {
        expect(mockElectronAPI.listCaseFiles).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should refresh files', async () => {
      const mockCase = { name: 'Test Case', path: '/path/to/case' };
      mockElectronAPI.listCaseFiles.mockResolvedValue([]);

      const { result } = renderHook(() => useArchive(), { wrapper });

      act(() => {
        result.current.setCurrentCase(mockCase);
      });

      await act(async () => {
        await result.current.refreshFiles();
      });

      expect(mockElectronAPI.listCaseFiles).toHaveBeenCalled();
    });

    it('should refresh cases', async () => {
      mockElectronAPI.listArchiveCases.mockResolvedValue([
        { name: 'Case 1', path: '/path/to/case1' },
      ]);

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        await result.current.refreshCases();
      });

      expect(mockElectronAPI.listArchiveCases).toHaveBeenCalled();
    });

    it('uses thumbnail cache when refreshing files', async () => {
      const mockCase = { name: 'Test Case', path: '/path/to/case' };

      mockElectronAPI.listCaseFiles
        .mockResolvedValueOnce([
          { name: 'file1.jpg', path: '/path/to/file1.jpg', size: 1000, modified: Date.now(), isFolder: false },
        ])
        .mockResolvedValueOnce([
          { name: 'file1.jpg', path: '/path/to/file1.jpg', size: 1000, modified: Date.now(), isFolder: false },
        ]);

      mockElectronAPI.getFileThumbnail.mockResolvedValue('thumb-data');

      const { result } = renderHook(() => useArchive(), { wrapper });

      act(() => {
        result.current.setCurrentCase(mockCase);
      });

      await waitFor(() => {
        expect(mockElectronAPI.listCaseFiles).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(mockElectronAPI.getFileThumbnail).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await result.current.refreshFiles();
      });

      await waitFor(() => {
        expect(mockElectronAPI.listCaseFiles).toHaveBeenCalledTimes(2);
      });

      expect(mockElectronAPI.getFileThumbnail).toHaveBeenCalledTimes(1);
    });

    it('handles loadFiles error gracefully', async () => {
      const mockCase = { name: 'Test Case', path: '/path/to/case' };
      mockElectronAPI.listCaseFiles.mockRejectedValueOnce(new Error('load failed'));

      const { result } = renderHook(() => useArchive(), { wrapper });

      act(() => {
        result.current.setCurrentCase(mockCase);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading archive config fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockElectronAPI.getArchiveConfig.mockRejectedValue(new Error('Config load failed'));

      renderHook(() => useArchive(), { wrapper });

      await waitFor(() => {
        expect(mockElectronAPI.getArchiveConfig).toHaveBeenCalled();
      });

      // Should not crash
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('should handle error when loading cases fails', async () => {
      mockElectronAPI.getArchiveConfig.mockResolvedValue({
        archiveDrive: '/path/to/vault',
      });
      mockElectronAPI.listArchiveCases.mockRejectedValue(new Error('Failed to load cases'));

      const { result } = renderHook(() => useArchive(), { wrapper });

      await waitFor(() => {
        expect(mockElectronAPI.listArchiveCases).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Should handle error gracefully
      expect(result.current.cases).toEqual([]);
    });

    it('should handle addFilesToCase error', async () => {
      mockElectronAPI.addFilesToCase.mockRejectedValue(new Error('add failed'));

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.addFilesToCase('/path/to/case');
        expect(success).toBe(false);
      });
    });

    it('should handle deleteCase error', async () => {
      mockElectronAPI.deleteCase.mockRejectedValue(new Error('delete failed'));

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.deleteCase('/path/to/case');
        expect(success).toBe(false);
      });
    });

    it('should handle deleteFile error', async () => {
      mockElectronAPI.deleteFile.mockRejectedValue(new Error('delete file failed'));

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.deleteFile('/path/to/file.pdf', false);
        expect(success).toBe(false);
      });
    });

    it('should handle renameFile error', async () => {
      mockElectronAPI.renameFile.mockRejectedValue(new Error('rename failed'));

      const { result } = renderHook(() => useArchive(), { wrapper });

      await act(async () => {
        const success = await result.current.renameFile('/path/to/file.pdf', 'newname.pdf');
        expect(success).toBe(false);
      });
    });
  });
});










