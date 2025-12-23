import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import JSZip from 'jszip';
import {
  isValidPDFFile,
  isValidDirectory,
  isValidFolderName,
  isSafePath,
} from '../utils/pathValidator';
import {
  loadArchiveConfig,
  saveArchiveConfig,
  getArchiveDrive,
  setArchiveDrive,
} from '../utils/archiveConfig';
import {
  createArchiveMarker,
  readArchiveMarker,
  isValidArchive,
  updateArchiveMarker,
} from '../utils/archiveMarker';
import { generateFileThumbnail } from '../utils/thumbnailGenerator';

// Mock all dependencies
vi.mock('electron', () => ({
  app: {
    isReady: vi.fn(() => true),
    isPackaged: false,
    getPath: vi.fn(() => '/mock/path'),
    getVersion: vi.fn(() => '1.0.0'),
    whenReady: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    quit: vi.fn(),
  },
  BrowserWindow: vi.fn(() => ({
    show: vi.fn(),
    loadURL: vi.fn(() => Promise.resolve()),
    loadFile: vi.fn(),
    webContents: {
      openDevTools: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
    },
    on: vi.fn(),
    once: vi.fn(),
  })),
  ipcMain: {
    handle: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
}));

vi.mock('fs/promises');
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return actual;
});
vi.mock('jszip', () => ({
  default: vi.fn(),
}));

vi.mock('../utils/pathValidator');
vi.mock('../utils/archiveConfig');
vi.mock('../utils/archiveMarker');
vi.mock('../utils/thumbnailGenerator');
vi.mock('../utils/logger', () => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('IPC Handlers', () => {
  let mockMainWindow: any;
  let ipcHandlers: Map<string, Function>;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockMainWindow = {
      show: vi.fn(),
      loadURL: vi.fn(() => Promise.resolve()),
      loadFile: vi.fn(),
      webContents: {
        openDevTools: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
      },
      on: vi.fn(),
      once: vi.fn(),
    };

    (BrowserWindow as any).mockImplementation(() => mockMainWindow);
    
    // Capture IPC handlers
    ipcHandlers = new Map();
    (ipcMain.handle as any).mockImplementation((channel: string, handler: Function) => {
      ipcHandlers.set(channel, handler);
    });
    
    // Clear module cache to ensure fresh import
    vi.resetModules();
    
    // Mock app.whenReady to resolve immediately
    // This will trigger createWindow() which sets mainWindow
    let whenReadyResolve: () => void;
    const whenReadyPromise = new Promise<void>((resolve) => {
      whenReadyResolve = resolve;
    });
    (app.whenReady as any).mockReturnValue(whenReadyPromise);
    
    // Import main to register handlers
    // The module will call app.whenReady() which returns our promise
    await import('../main');
    
    // Resolve the promise to trigger createWindow()
    whenReadyResolve!();
    
    // Wait a tick for createWindow to execute
    await new Promise(resolve => setImmediate(resolve));
    
    // Now mainWindow should be set to mockMainWindow

    // Setup default mocks
    (isValidPDFFile as any).mockReturnValue(true);
    (isSafePath as any).mockReturnValue(true);
    (isValidDirectory as any).mockResolvedValue(true);
    (isValidFolderName as any).mockReturnValue(true);
    (fs.access as any).mockResolvedValue(undefined);
    (fs.readFile as any).mockResolvedValue(Buffer.from('test data'));
    (fs.writeFile as any).mockResolvedValue(undefined);
    (fs.mkdir as any).mockResolvedValue(undefined);
    (fs.readdir as any).mockResolvedValue([]);
    (fs.stat as any).mockResolvedValue({ isDirectory: () => false, size: 100 });
    (fs.copyFile as any).mockResolvedValue(undefined);
    (fs.unlink as any).mockResolvedValue(undefined);
    (fs.rm as any).mockResolvedValue(undefined);
    (fs.rename as any).mockResolvedValue(undefined);
    (fs.open as any).mockResolvedValue({
      read: vi.fn(() => Promise.resolve({ bytesRead: 0 })),
      close: vi.fn(() => Promise.resolve()),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to get handler with type assertion
  const getHandler = (channel: string): ((...args: any[]) => Promise<any>) => {
    const handler = ipcHandlers.get(channel);
    if (!handler) {
      throw new Error(`Handler for channel ${channel} not found`);
    }
    return handler as (...args: any[]) => Promise<any>;
  };

  describe('select-pdf-file', () => {
    it('should return selected file path', async () => {
      const handler = getHandler('select-pdf-file');
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');

      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/file.pdf'],
      });
      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(true);
      (fs.access as any).mockResolvedValue(undefined);

      // Handler uses mainWindow from module scope, not a parameter
      const result = await handler();

      expect(result).toBe('/path/to/file.pdf');
      expect(dialog.showOpenDialog).toHaveBeenCalled();
    });

    it('should return null when dialog is canceled', async () => {
      const handler = getHandler('select-pdf-file');
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');

      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      // Handler uses mainWindow from module scope, not a parameter
      const result = await handler();

      expect(result).toBeNull();
    });

    it('should throw error for invalid PDF file', async () => {
      const handler = getHandler('select-pdf-file');
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');

      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/invalid.txt'],
      });
      (isValidPDFFile as any).mockReturnValue(false);

      await expect(handler(mockMainWindow)).rejects.toThrow('Invalid PDF file selected');
    });
  });

  describe('select-save-directory', () => {
    it('should return selected directory path', async () => {
      await import('../main');
      const handler = getHandler('select-save-directory');

      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/directory'],
      });
      (isValidDirectory as any).mockResolvedValue(true);

      // Handler uses mainWindow from module scope, not a parameter
      const result = await handler();

      expect(result).toBe('/path/to/directory');
    });

    it('should throw error for invalid directory', async () => {
      await import('../main');
      const handler = getHandler('select-save-directory');

      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: false,
        filePaths: ['/invalid/path'],
      });
      (isValidDirectory as any).mockResolvedValue(false);

      await expect(handler(mockMainWindow)).rejects.toThrow('Invalid directory selected');
    });
  });

  describe('save-files', () => {
    it('should save files successfully', async () => {
      await import('../main');
      const handler = getHandler('save-files');

      const options = {
        saveDirectory: '/save/dir',
        saveParentFile: false,
        saveToZip: true,
        folderName: 'test-folder',
        extractedPages: [
          { pageNumber: 1, imageData: 'data:image/png;base64,dGVzdA==' },
        ],
      };

      const mockZip = {
        folder: vi.fn(() => ({
          file: vi.fn(),
        })),
        generateAsync: vi.fn(() => Promise.resolve(Buffer.from('zip data'))),
      };
      (JSZip as any).mockImplementation(() => mockZip);
      (isValidDirectory as any).mockResolvedValue(true);
      (isValidFolderName as any).mockReturnValue(true);
      (fs.writeFile as any).mockResolvedValue(undefined);

      const result = await handler(null, options);

      expect(result.success).toBe(true);
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should save parent PDF file when requested', async () => {
      await import('../main');
      const handler = getHandler('save-files');

      const options = {
        saveDirectory: '/save/dir',
        saveParentFile: true,
        saveToZip: false,
        parentFilePath: '/path/to/parent.pdf',
        extractedPages: [],
      };

      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(true);
      (fs.copyFile as any).mockResolvedValue(undefined);

      const result = await handler(null, options);

      expect(result.success).toBe(true);
      expect(fs.copyFile).toHaveBeenCalled();
    });

    it('should throw error for invalid save directory', async () => {
      await import('../main');
      const handler = getHandler('save-files');

      const options = {
        saveDirectory: '/invalid/dir',
        saveParentFile: false,
        saveToZip: false,
        extractedPages: [],
      };

      (isValidDirectory as any).mockResolvedValue(false);

      await expect(handler(null, options)).rejects.toThrow('Invalid save directory');
    });
  });

  describe('validate-pdf-for-extraction', () => {
    it('should validate PDF file successfully', async () => {
      await import('../main');
      const handler = getHandler('validate-pdf-for-extraction');

      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(true);
      (fs.access as any).mockResolvedValue(undefined);

      const result = await handler(null, '/path/to/file.pdf');

      expect(result.valid).toBe(true);
      expect(result.path).toBe('/path/to/file.pdf');
    });

    it('should throw error for invalid PDF path', async () => {
      await import('../main');
      const handler = getHandler('validate-pdf-for-extraction');

      (isValidPDFFile as any).mockReturnValue(false);

      await expect(handler(null, '/invalid/path')).rejects.toThrow('Invalid PDF file path');
    });
  });

  describe('read-pdf-file', () => {
    it('should read and return PDF file as base64 for small files', async () => {
      await import('../main');
      const handler = getHandler('read-pdf-file');

      const mockData = Buffer.from('PDF content');
      (fs.readFile as any).mockResolvedValue(mockData);
      (fs.stat as any).mockResolvedValue({ size: 100 }); // Small file
      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(true);

      const result = await handler(null, '/path/to/file.pdf');

      expect(result).toEqual({
        type: 'base64',
        data: mockData.toString('base64'),
      });
    });

    it('should return file-path for large files (>350MB)', async () => {
      await import('../main');
      const handler = getHandler('read-pdf-file');

      const largeFileSize = 400 * 1024 * 1024; // 400MB
      (fs.stat as any).mockResolvedValue({ size: largeFileSize });
      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(true);

      const result = await handler(null, '/path/to/large-file.pdf');

      expect(result).toEqual({
        type: 'file-path',
        path: '/path/to/large-file.pdf',
      });
    });

    it('should throw error when file does not exist', async () => {
      await import('../main');
      const handler = getHandler('read-pdf-file');

      (fs.stat as any).mockRejectedValue(new Error('File not found'));
      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(true);

      await expect(handler(null, '/nonexistent/file.pdf')).rejects.toThrow('Failed to read PDF file');
    });
  });

  describe('select-archive-drive', () => {
    it('should select and configure archive drive', async () => {
      await import('../main');
      const handler = getHandler('select-archive-drive');

      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: false,
        filePaths: ['/archive/drive'],
      });
      (isValidDirectory as any).mockResolvedValue(true);
      (isValidArchive as any).mockResolvedValue(false);
      (createArchiveMarker as any).mockResolvedValue({
        version: '1.0.0',
        createdAt: Date.now(),
        lastModified: Date.now(),
        archiveId: 'test-id',
      });
      (setArchiveDrive as any).mockResolvedValue(undefined);

      // Handler uses mainWindow from module scope, not a parameter
      const result = await handler();

      expect(result.path).toBe('/archive/drive');
      expect(result.autoDetected).toBe(false);
    });

    it('should auto-detect existing archive', async () => {
      await import('../main');
      const handler = getHandler('select-archive-drive');

      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: false,
        filePaths: ['/existing/archive'],
      });
      (isValidDirectory as any).mockResolvedValue(true);
      (isValidArchive as any).mockResolvedValue(true);
      (readArchiveMarker as any).mockResolvedValue({
        version: '1.0.0',
        createdAt: Date.now(),
        lastModified: Date.now(),
        archiveId: 'test-id',
      });
      (updateArchiveMarker as any).mockResolvedValue({});
      (setArchiveDrive as any).mockResolvedValue(undefined);

      // Handler uses mainWindow from module scope, not a parameter
      const result = await handler();

      expect(result.autoDetected).toBe(true);
    });
  });

  describe('create-case-folder', () => {
    it('should create case folder successfully', async () => {
      await import('../main');
      const handler = getHandler('create-case-folder');

      (isValidFolderName as any).mockReturnValue(true);
      (getArchiveDrive as any).mockResolvedValue('/archive/drive');
      (fs.access as any).mockRejectedValue({ code: 'ENOENT' });
      (fs.mkdir as any).mockResolvedValue(undefined);
      (readArchiveMarker as any).mockResolvedValue({});
      (fs.readdir as any).mockResolvedValue([
        { isDirectory: () => true, name: 'case1' },
      ]);
      (updateArchiveMarker as any).mockResolvedValue({});

      const result = await handler(null, 'Test Case', 'Description');

      // Normalize path to handle Windows/Unix path separators
      const expectedPath = path.join('/archive/drive', 'Test Case');
      expect(result).toBe(expectedPath);
      expect(fs.mkdir).toHaveBeenCalled();
    });

    it('should throw error when case folder already exists', async () => {
      await import('../main');
      const handler = getHandler('create-case-folder');

      (isValidFolderName as any).mockReturnValue(true);
      (getArchiveDrive as any).mockResolvedValue('/archive/drive');
      (fs.access as any).mockResolvedValue(undefined);

      await expect(handler(null, 'Existing Case')).rejects.toThrow('Case folder already exists');
    });
  });

  describe('list-archive-cases', () => {
    it('should return list of cases', async () => {
      await import('../main');
      const handler = getHandler('list-archive-cases');

      (getArchiveDrive as any).mockResolvedValue('/archive/drive');
      (fs.readdir as any).mockResolvedValue([
        { isDirectory: () => true, name: 'case1' },
        { isDirectory: () => true, name: 'case2' },
      ]);
      (fs.readFile as any).mockRejectedValue(new Error('Not found')); // No metadata files

      const result = await handler(null);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no archive drive is set', async () => {
      await import('../main');
      const handler = getHandler('list-archive-cases');

      (getArchiveDrive as any).mockResolvedValue(null);

      const result = await handler(null);

      expect(result).toEqual([]);
    });
  });

  describe('delete-file', () => {
    it('should delete file successfully', async () => {
      await import('../main');
      const handler = getHandler('delete-file');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => false });
      (fs.unlink as any).mockResolvedValue(undefined);

      const result = await handler(null, '/path/to/file.pdf', false);

      expect(result).toBe(true);
      expect(fs.unlink).toHaveBeenCalled();
    });

    it('should delete folder recursively', async () => {
      await import('../main');
      const handler = getHandler('delete-file');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => true });
      (fs.rm as any).mockResolvedValue(undefined);

      const result = await handler(null, '/path/to/folder', true);

      expect(result).toBe(true);
      expect(fs.rm).toHaveBeenCalledWith('/path/to/folder', { recursive: true, force: true });
    });
  });

  describe('rename-file', () => {
    it('should rename file successfully', async () => {
      await import('../main');
      const handler = getHandler('rename-file');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => false });
      (isValidFolderName as any).mockReturnValue(true);
      (fs.access as any).mockRejectedValue({ code: 'ENOENT' });
      (fs.rename as any).mockResolvedValue(undefined);

      const result = await handler(null, '/path/to/old.pdf', 'new.pdf');

      expect(result.success).toBe(true);
      expect(fs.rename).toHaveBeenCalled();
      // Verify the new path is correct
      const expectedNewPath = path.join('/path/to', 'new.pdf');
      expect(result.newPath).toBe(expectedNewPath);
    });

    it('should throw error when new name already exists', async () => {
      await import('../main');
      const handler = getHandler('rename-file');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => false });
      // Mock fs.access to resolve (meaning file exists) - this should trigger the error
      (fs.access as any).mockImplementation(() => Promise.resolve(undefined));

      await expect(handler(null, '/path/to/old.pdf', 'existing.pdf')).rejects.toThrow(
        'A file or folder with this name already exists'
      );
    });
  });

  describe('get-file-thumbnail', () => {
    it('should generate thumbnail for file', async () => {
      await import('../main');
      const handler = getHandler('get-file-thumbnail');

      (isSafePath as any).mockReturnValue(true);
      (generateFileThumbnail as any).mockResolvedValue('data:image/png;base64,thumbnail');

      const result = await handler(null, '/path/to/image.jpg');

      expect(result).toBe('data:image/png;base64,thumbnail');
      expect(generateFileThumbnail).toHaveBeenCalledWith('/path/to/image.jpg');
    });
  });

  describe('select-image-file', () => {
    it('should return selected image file path', async () => {
      await import('../main');
      const handler = getHandler('select-image-file');

      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/image.jpg'],
      });
      (isSafePath as any).mockReturnValue(true);
      (fs.access as any).mockResolvedValue(undefined);

      const result = await handler();

      expect(result).toBe('/path/to/image.jpg');
      expect(dialog.showOpenDialog).toHaveBeenCalled();
    });

    it('should return null when dialog is canceled', async () => {
      await import('../main');
      const handler = getHandler('select-image-file');

      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      const result = await handler();

      expect(result).toBeNull();
    });

    it('should throw error for invalid file path', async () => {
      await import('../main');
      const handler = getHandler('select-image-file');

      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: false,
        filePaths: ['/invalid/path'],
      });
      (isSafePath as any).mockReturnValue(false);

      await expect(handler()).rejects.toThrow('Invalid file path');
    });

    it('should throw error when file does not exist', async () => {
      await import('../main');
      const handler = getHandler('select-image-file');

      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/image.jpg'],
      });
      (isSafePath as any).mockReturnValue(true);
      (fs.access as any).mockRejectedValue(new Error('File not found'));

      await expect(handler()).rejects.toThrow('Image file does not exist');
    });
  });

  describe('validate-path', () => {
    it('should validate valid PDF path', async () => {
      await import('../main');
      const handler = getHandler('validate-path');

      (isSafePath as any).mockReturnValue(true);
      (isValidPDFFile as any).mockReturnValue(true);

      const result = await handler(null, '/path/to/file.pdf');

      expect(result.isValid).toBe(true);
      expect(result.isPDF).toBe(true);
    });

    it('should validate valid non-PDF path', async () => {
      await import('../main');
      const handler = getHandler('validate-path');

      (isSafePath as any).mockReturnValue(true);
      (isValidPDFFile as any).mockReturnValue(false);

      const result = await handler(null, '/path/to/file.txt');

      expect(result.isValid).toBe(true);
      expect(result.isPDF).toBe(false);
    });

    it('should return invalid for unsafe path', async () => {
      await import('../main');
      const handler = getHandler('validate-path');

      (isSafePath as any).mockReturnValue(false);
      (isValidPDFFile as any).mockReturnValue(false);

      const result = await handler(null, '../unsafe/path');

      expect(result.isValid).toBe(false);
      expect(result.isPDF).toBe(false);
    });
  });

  describe('get-archive-config', () => {
    it('should return config with archive drive', async () => {
      await import('../main');
      const handler = getHandler('get-archive-config');

      (loadArchiveConfig as any).mockResolvedValue({ archiveDrive: '/archive/drive' });
      (isValidArchive as any).mockResolvedValue(true);

      const result = await handler(null);

      expect(result.archiveDrive).toBe('/archive/drive');
    });

    it('should return config with no drive set', async () => {
      await import('../main');
      const handler = getHandler('get-archive-config');

      (loadArchiveConfig as any).mockResolvedValue({ archiveDrive: null });

      const result = await handler(null);

      expect(result.archiveDrive).toBeNull();
    });

    it('should clear invalid archive drive', async () => {
      await import('../main');
      const handler = getHandler('get-archive-config');

      (loadArchiveConfig as any).mockResolvedValue({ archiveDrive: '/invalid/drive' });
      (isValidArchive as any).mockResolvedValue(false);
      (saveArchiveConfig as any).mockResolvedValue(undefined);

      const result = await handler(null);

      expect(result.archiveDrive).toBeNull();
      expect(saveArchiveConfig).toHaveBeenCalled();
    });

    it('should clear archive drive when path does not exist', async () => {
      await import('../main');
      const handler = getHandler('get-archive-config');

      (loadArchiveConfig as any).mockResolvedValue({ archiveDrive: '/nonexistent/drive' });
      (isValidArchive as any).mockRejectedValue(new Error('Path does not exist'));
      (saveArchiveConfig as any).mockResolvedValue(undefined);

      const result = await handler(null);

      expect(result.archiveDrive).toBeNull();
      expect(saveArchiveConfig).toHaveBeenCalled();
    });
  });

  describe('validate-archive-directory', () => {
    it('should validate valid archive with marker', async () => {
      await import('../main');
      const handler = getHandler('validate-archive-directory');

      (isSafePath as any).mockReturnValue(true);
      (isValidDirectory as any).mockResolvedValue(true);
      (isValidArchive as any).mockResolvedValue(true);
      (readArchiveMarker as any).mockResolvedValue({
        version: '1.0.0',
        createdAt: 1000000,
        lastModified: 2000000,
        archiveId: 'test-id',
      });

      const result = await handler(null, '/archive/drive');

      expect(result.isValid).toBe(true);
      expect(result.marker).toBeDefined();
      expect(result.marker?.archiveId).toBe('test-id');
    });

    it('should return invalid for unsafe path', async () => {
      await import('../main');
      const handler = getHandler('validate-archive-directory');

      (isSafePath as any).mockReturnValue(false);

      const result = await handler(null, '../unsafe/path');

      expect(result.isValid).toBe(false);
    });

    it('should return invalid for non-directory', async () => {
      await import('../main');
      const handler = getHandler('validate-archive-directory');

      (isSafePath as any).mockReturnValue(true);
      (isValidDirectory as any).mockResolvedValue(false);

      const result = await handler(null, '/path/to/file.pdf');

      expect(result.isValid).toBe(false);
    });

    it('should return invalid for directory without marker', async () => {
      await import('../main');
      const handler = getHandler('validate-archive-directory');

      (isSafePath as any).mockReturnValue(true);
      (isValidDirectory as any).mockResolvedValue(true);
      (isValidArchive as any).mockResolvedValue(false);

      const result = await handler(null, '/regular/directory');

      expect(result.isValid).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      await import('../main');
      const handler = getHandler('validate-archive-directory');

      (isSafePath as any).mockReturnValue(true);
      (isValidDirectory as any).mockRejectedValue(new Error('Permission denied'));

      const result = await handler(null, '/restricted/path');

      expect(result.isValid).toBe(false);
    });
  });

  describe('create-extraction-folder', () => {
    it('should create extraction folder successfully', async () => {
      await import('../main');
      const handler = getHandler('create-extraction-folder');

      (isSafePath as any).mockReturnValue(true);
      (isValidFolderName as any).mockReturnValue(true);
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => true });

      const result = await handler(null, '/case/path', 'extraction-folder');

      expect(result).toBe(path.join('/case/path', 'extraction-folder'));
      expect(fs.mkdir).toHaveBeenCalled();
    });

    it('should create extraction folder with parent PDF metadata', async () => {
      await import('../main');
      const handler = getHandler('create-extraction-folder');

      (isSafePath as any).mockReturnValue(true);
      (isValidFolderName as any).mockReturnValue(true);
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => true });
      (fs.writeFile as any).mockResolvedValue(undefined);

      const result = await handler(null, '/case/path', 'extraction-folder', '/parent.pdf');

      expect(result).toBe(path.join('/case/path', 'extraction-folder'));
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should throw error for invalid case path', async () => {
      await import('../main');
      const handler = getHandler('create-extraction-folder');

      (isSafePath as any).mockReturnValue(false);

      await expect(handler(null, '../unsafe/path', 'folder')).rejects.toThrow('Invalid case path');
    });

    it('should throw error for invalid folder name', async () => {
      await import('../main');
      const handler = getHandler('create-extraction-folder');

      (isSafePath as any).mockReturnValue(true);
      (isValidFolderName as any).mockReturnValue(false);

      await expect(handler(null, '/case/path', 'invalid<>name')).rejects.toThrow('Invalid folder name');
    });

    it('should throw error when folder creation fails', async () => {
      await import('../main');
      const handler = getHandler('create-extraction-folder');

      (isSafePath as any).mockReturnValue(true);
      (isValidFolderName as any).mockReturnValue(true);
      (fs.mkdir as any).mockRejectedValue(new Error('Permission denied'));

      await expect(handler(null, '/case/path', 'folder')).rejects.toThrow('Failed to create extraction folder');
    });
  });

  describe('list-case-files', () => {
    it('should return list of files and folders', async () => {
      await import('../main');
      const handler = getHandler('list-case-files');

      (isSafePath as any).mockReturnValue(true);
      (fs.readdir as any).mockResolvedValue([
        { isFile: () => true, isDirectory: () => false, name: 'file1.pdf' },
        { isFile: () => true, isDirectory: () => false, name: 'file2.jpg' },
        { isFile: () => false, isDirectory: () => true, name: 'folder1' },
      ]);
      (fs.stat as any).mockResolvedValue({
        size: 1000,
        mtime: new Date(1000000),
        isDirectory: () => false,
      });
      (fs.readFile as any).mockRejectedValue(new Error('Not found')); // No metadata

      const result = await handler(null, '/case/path');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for empty case', async () => {
      await import('../main');
      const handler = getHandler('list-case-files');

      (isSafePath as any).mockReturnValue(true);
      (fs.readdir as any).mockResolvedValue([]);

      const result = await handler(null, '/case/path');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should throw error for invalid case path', async () => {
      await import('../main');
      const handler = getHandler('list-case-files');

      (isSafePath as any).mockReturnValue(false);

      await expect(handler(null, '../unsafe/path')).rejects.toThrow('Invalid case path');
    });

    it('should read parent PDF metadata from folders', async () => {
      await import('../main');
      const handler = getHandler('list-case-files');

      (isSafePath as any).mockReturnValue(true);
      (fs.readdir as any).mockResolvedValue([
        { isFile: () => false, isDirectory: () => true, name: 'extraction-folder' },
      ]);
      (fs.stat as any).mockResolvedValue({
        size: 0,
        mtime: new Date(1000000),
        isDirectory: () => true,
      });
      (fs.readFile as any).mockResolvedValue('parent.pdf');

      const result = await handler(null, '/case/path');

      expect(Array.isArray(result)).toBe(true);
      const folder = result.find((item: any) => item.isFolder);
      if (folder) {
        expect(folder.parentPdfName).toBe('parent.pdf');
      }
    });

    it('should filter out metadata files', async () => {
      await import('../main');
      const handler = getHandler('list-case-files');

      (isSafePath as any).mockReturnValue(true);
      (fs.readdir as any).mockResolvedValue([
        { isFile: () => true, isDirectory: () => false, name: 'file.pdf' },
        { isFile: () => true, isDirectory: () => false, name: '.parent-pdf' },
        { isFile: () => true, isDirectory: () => false, name: '.case-background' },
        { isFile: () => true, isDirectory: () => false, name: '.vault-archive.json' },
      ]);
      (fs.stat as any).mockResolvedValue({
        size: 1000,
        mtime: new Date(1000000),
        isDirectory: () => false,
      });

      const result = await handler(null, '/case/path');

      const fileNames = result.map((item: any) => item.name);
      expect(fileNames).not.toContain('.parent-pdf');
      expect(fileNames).not.toContain('.case-background');
      expect(fileNames).not.toContain('.vault-archive.json');
      expect(fileNames).toContain('file.pdf');
    });
  });

  describe('add-files-to-case', () => {
    it('should add files with provided paths', async () => {
      await import('../main');
      const handler = getHandler('add-files-to-case');

      (isSafePath as any).mockReturnValue(true);
      (fs.copyFile as any).mockResolvedValue(undefined);

      const result = await handler(null, '/case/path', ['/file1.pdf', '/file2.jpg']);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(fs.copyFile).toHaveBeenCalledTimes(2);
    });

    it('should show dialog when no file paths provided', async () => {
      await import('../main');
      const handler = getHandler('add-files-to-case');

      (isSafePath as any).mockReturnValue(true);
      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: false,
        filePaths: ['/selected/file.pdf'],
      });
      (fs.copyFile as any).mockResolvedValue(undefined);

      const result = await handler(null, '/case/path', undefined);

      expect(Array.isArray(result)).toBe(true);
      expect(dialog.showOpenDialog).toHaveBeenCalled();
    });

    it('should return empty array when dialog is canceled', async () => {
      await import('../main');
      const handler = getHandler('add-files-to-case');

      (isSafePath as any).mockReturnValue(true);
      (dialog.showOpenDialog as any).mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      const result = await handler(null, '/case/path', undefined);

      expect(result).toEqual([]);
    });

    it('should skip invalid paths', async () => {
      await import('../main');
      const handler = getHandler('add-files-to-case');

      (isSafePath as any).mockImplementation((path: string) => path !== '/unsafe/path');
      (fs.copyFile as any).mockResolvedValue(undefined);

      const result = await handler(null, '/case/path', ['/safe/file.pdf', '/unsafe/path']);

      expect(result.length).toBe(1);
      expect(fs.copyFile).toHaveBeenCalledTimes(1);
    });

    it('should handle file copy failures gracefully', async () => {
      await import('../main');
      const handler = getHandler('add-files-to-case');

      (isSafePath as any).mockReturnValue(true);
      (fs.copyFile as any).mockRejectedValueOnce(new Error('Permission denied'));
      (fs.copyFile as any).mockResolvedValueOnce(undefined);

      const result = await handler(null, '/case/path', ['/file1.pdf', '/file2.pdf']);

      expect(result.length).toBe(1);
    });

    it('should throw error for invalid case path', async () => {
      await import('../main');
      const handler = getHandler('add-files-to-case');

      (isSafePath as any).mockReturnValue(false);

      await expect(handler(null, '../unsafe/path', ['/file.pdf'])).rejects.toThrow('Invalid case path');
    });
  });

  describe('delete-case', () => {
    it('should delete case successfully', async () => {
      await import('../main');
      const handler = getHandler('delete-case');

      (isSafePath as any).mockReturnValue(true);
      (fs.rm as any).mockResolvedValue(undefined);

      const result = await handler(null, '/case/path');

      expect(result).toBe(true);
      expect(fs.rm).toHaveBeenCalledWith('/case/path', { recursive: true, force: true });
    });

    it('should delete case with files', async () => {
      await import('../main');
      const handler = getHandler('delete-case');

      (isSafePath as any).mockReturnValue(true);
      (fs.rm as any).mockResolvedValue(undefined);

      const result = await handler(null, '/case/path/with/files');

      expect(result).toBe(true);
      expect(fs.rm).toHaveBeenCalledWith('/case/path/with/files', { recursive: true, force: true });
    });

    it('should throw error for invalid case path', async () => {
      await import('../main');
      const handler = getHandler('delete-case');

      (isSafePath as any).mockReturnValue(false);

      await expect(handler(null, '../unsafe/path')).rejects.toThrow('Invalid case path');
    });

    it('should throw error when deletion fails', async () => {
      await import('../main');
      const handler = getHandler('delete-case');

      (isSafePath as any).mockReturnValue(true);
      (fs.rm as any).mockRejectedValue(new Error('Permission denied'));

      await expect(handler(null, '/case/path')).rejects.toThrow('Failed to delete case');
    });
  });

  describe('set-case-background-image', () => {
    it('should set case background image successfully', async () => {
      await import('../main');
      const handler = getHandler('set-case-background-image');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => true });
      (fs.access as any).mockResolvedValue(undefined);
      (fs.copyFile as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockRejectedValue(new Error('Not found')); // No old metadata

      const result = await handler(null, '/case/path', '/image.jpg');

      expect(result).toBeDefined();
      expect(fs.copyFile).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should delete old background image when setting new one', async () => {
      await import('../main');
      const handler = getHandler('set-case-background-image');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => true });
      (fs.access as any).mockResolvedValue(undefined);
      (fs.copyFile as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue('old-background.png');
      (fs.unlink as any).mockResolvedValue(undefined);

      const result = await handler(null, '/case/path', '/new-image.jpg');

      expect(result).toBeDefined();
      expect(fs.unlink).toHaveBeenCalled();
    });

    it('should throw error for invalid case path', async () => {
      await import('../main');
      const handler = getHandler('set-case-background-image');

      (isSafePath as any).mockReturnValue(false);

      await expect(handler(null, '../unsafe/path', '/image.jpg')).rejects.toThrow('Invalid path');
    });

    it('should throw error when case path is not a directory', async () => {
      await import('../main');
      const handler = getHandler('set-case-background-image');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => false });

      await expect(handler(null, '/file.pdf', '/image.jpg')).rejects.toThrow('Case path is not a directory');
    });

    it('should throw error when image file does not exist', async () => {
      await import('../main');
      const handler = getHandler('set-case-background-image');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => true });
      (fs.access as any).mockRejectedValue(new Error('File not found'));

      await expect(handler(null, '/case/path', '/nonexistent.jpg')).rejects.toThrow('Failed to set case background image');
    });
  });

  describe('read-file-data', () => {
    it('should read image file data', async () => {
      await import('../main');
      const handler = getHandler('read-file-data');

      (isSafePath as any).mockReturnValue(true);
      const mockData = Buffer.from('image data');
      (fs.readFile as any).mockResolvedValue(mockData);

      const result = await handler(null, '/path/to/image.jpg');

      expect(result.data).toBe(mockData.toString('base64'));
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.fileName).toBe('image.jpg');
    });

    it('should read PDF file data', async () => {
      await import('../main');
      const handler = getHandler('read-file-data');

      (isSafePath as any).mockReturnValue(true);
      const mockData = Buffer.from('PDF content');
      (fs.readFile as any).mockResolvedValue(mockData);

      const result = await handler(null, '/path/to/file.pdf');

      expect(result.data).toBe(mockData.toString('base64'));
      expect(result.mimeType).toBe('application/pdf');
    });

    it('should read PNG file data', async () => {
      await import('../main');
      const handler = getHandler('read-file-data');

      (isSafePath as any).mockReturnValue(true);
      const mockData = Buffer.from('PNG data');
      (fs.readFile as any).mockResolvedValue(mockData);

      const result = await handler(null, '/path/to/image.png');

      expect(result.mimeType).toBe('image/png');
    });

    it('should use default MIME type for unknown file types', async () => {
      await import('../main');
      const handler = getHandler('read-file-data');

      (isSafePath as any).mockReturnValue(true);
      const mockData = Buffer.from('unknown data');
      (fs.readFile as any).mockResolvedValue(mockData);

      const result = await handler(null, '/path/to/file.unknown');

      expect(result.mimeType).toBe('application/octet-stream');
    });

    it('should throw error for invalid file path', async () => {
      await import('../main');
      const handler = getHandler('read-file-data');

      (isSafePath as any).mockReturnValue(false);

      await expect(handler(null, '../unsafe/path')).rejects.toThrow('Invalid file path');
    });

    it('should throw error when file does not exist', async () => {
      await import('../main');
      const handler = getHandler('read-file-data');

      (isSafePath as any).mockReturnValue(true);
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      await expect(handler(null, '/nonexistent/file.jpg')).rejects.toThrow('Failed to read file');
    });
  });

  describe('extract-pdf-from-archive', () => {
    it('should extract PDF successfully', async () => {
      await import('../main');
      const handler = getHandler('extract-pdf-from-archive');

      (isSafePath as any).mockReturnValue(true);
      (isValidFolderName as any).mockReturnValue(true);
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);

      const options = {
        pdfPath: '/case/path/file.pdf',
        casePath: '/case/path',
        folderName: 'extraction',
        saveParentFile: false,
        extractedPages: [
          { pageNumber: 1, imageData: 'data:image/png;base64,dGVzdA==' },
        ],
      };

      const result = await handler(null, options);

      expect(result.success).toBe(true);
      expect(result.extractionFolder).toBeDefined();
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should extract PDF with parent file saving', async () => {
      await import('../main');
      const handler = getHandler('extract-pdf-from-archive');

      (isSafePath as any).mockReturnValue(true);
      (isValidFolderName as any).mockReturnValue(true);
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.copyFile as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);

      const options = {
        pdfPath: '/case/path/file.pdf',
        casePath: '/case/path',
        folderName: 'extraction',
        saveParentFile: true,
        extractedPages: [
          { pageNumber: 1, imageData: 'data:image/png;base64,dGVzdA==' },
        ],
      };

      const result = await handler(null, options);

      expect(result.success).toBe(true);
      expect(fs.copyFile).toHaveBeenCalled();
    });

    it('should throw error for invalid PDF path', async () => {
      await import('../main');
      const handler = getHandler('extract-pdf-from-archive');

      (isSafePath as any).mockReturnValue(false);

      const options = {
        pdfPath: '../unsafe/path',
        casePath: '/case/path',
        folderName: 'extraction',
        saveParentFile: false,
        extractedPages: [],
      };

      await expect(handler(null, options)).rejects.toThrow('Invalid path');
    });

    it('should throw error for invalid folder name', async () => {
      await import('../main');
      const handler = getHandler('extract-pdf-from-archive');

      (isSafePath as any).mockReturnValue(true);
      (isValidFolderName as any).mockReturnValue(false);

      const options = {
        pdfPath: '/case/path/file.pdf',
        casePath: '/case/path',
        folderName: 'invalid<>name',
        saveParentFile: false,
        extractedPages: [],
      };

      await expect(handler(null, options)).rejects.toThrow('Invalid folder name');
    });

    it('should throw error when extraction fails', async () => {
      await import('../main');
      const handler = getHandler('extract-pdf-from-archive');

      (isSafePath as any).mockReturnValue(true);
      (isValidFolderName as any).mockReturnValue(true);
      (fs.mkdir as any).mockRejectedValue(new Error('Permission denied'));

      const options = {
        pdfPath: '/case/path/file.pdf',
        casePath: '/case/path',
        folderName: 'extraction',
        saveParentFile: false,
        extractedPages: [],
      };

      await expect(handler(null, options)).rejects.toThrow('Failed to extract PDF');
    });
  });

  // Edge cases for existing handlers
  describe('save-files edge cases', () => {
    it('should handle ZIP creation failure', async () => {
      await import('../main');
      const handler = getHandler('save-files');

      const mockZip = {
        folder: vi.fn(() => null), // Return null to simulate failure
        generateAsync: vi.fn(),
      };
      (JSZip as any).mockImplementation(() => mockZip);
      (isValidDirectory as any).mockResolvedValue(true);
      (isValidFolderName as any).mockReturnValue(true);

      const options = {
        saveDirectory: '/save/dir',
        saveParentFile: false,
        saveToZip: true,
        folderName: 'test-folder',
        extractedPages: [{ pageNumber: 1, imageData: 'data:image/png;base64,dGVzdA==' }],
      };

      await expect(handler(null, options)).rejects.toThrow('Failed to create ZIP folder');
    });

    it('should handle partial file save failures', async () => {
      await import('../main');
      const handler = getHandler('save-files');

      (isValidDirectory as any).mockResolvedValue(true);
      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(true);
      (fs.copyFile as any).mockRejectedValue(new Error('Disk full'));

      const options = {
        saveDirectory: '/save/dir',
        saveParentFile: true,
        saveToZip: false,
        parentFilePath: '/path/to/parent.pdf',
        extractedPages: [],
      };

      await expect(handler(null, options)).rejects.toThrow('Failed to save files');
    });
  });

  describe('create-case-folder edge cases', () => {
    it('should handle special characters in case name validation', async () => {
      await import('../main');
      const handler = getHandler('create-case-folder');

      (isValidFolderName as any).mockReturnValue(false);

      await expect(handler(null, 'Case<>Name')).rejects.toThrow('Invalid case name');
    });

    it('should handle very long case names', async () => {
      await import('../main');
      const handler = getHandler('create-case-folder');

      const longName = 'a'.repeat(201);
      (isValidFolderName as any).mockReturnValue(false);

      await expect(handler(null, longName)).rejects.toThrow('Invalid case name');
    });
  });

  describe('rename-file edge cases', () => {
    it('should throw error when renaming to same name', async () => {
      await import('../main');
      const handler = getHandler('rename-file');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => false });
      (isValidFolderName as any).mockReturnValue(true);
      (fs.access as any).mockResolvedValue(undefined); // File with same name exists

      await expect(handler(null, '/path/to/file.pdf', 'file.pdf')).rejects.toThrow(
        'A file or folder with this name already exists'
      );
    });

    it('should throw error for invalid characters in new name', async () => {
      await import('../main');
      const handler = getHandler('rename-file');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => true });
      (isValidFolderName as any).mockReturnValue(false);

      await expect(handler(null, '/path/to/folder', 'invalid<>name')).rejects.toThrow('Invalid folder name');
    });

    it('should handle empty new name', async () => {
      await import('../main');
      const handler = getHandler('rename-file');

      (isSafePath as any).mockReturnValue(true);

      await expect(handler(null, '/path/to/file.pdf', '')).rejects.toThrow('New name cannot be empty');
    });

    it('should handle whitespace-only new name', async () => {
      await import('../main');
      const handler = getHandler('rename-file');

      (isSafePath as any).mockReturnValue(true);

      await expect(handler(null, '/path/to/file.pdf', '   ')).rejects.toThrow('New name cannot be empty');
    });
  });

  describe('delete-file edge cases', () => {
    it('should handle permission errors that are not directory errors', async () => {
      await import('../main');
      const handler = getHandler('delete-file');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => false });
      // Use an error code that's not treated as directory error
      (fs.unlink as any).mockRejectedValue({ code: 'EACCES', message: 'Permission denied' });

      await expect(handler(null, '/protected/file.pdf', false)).rejects.toThrow('Failed to delete file');
    });

    it('should handle file in use errors', async () => {
      await import('../main');
      const handler = getHandler('delete-file');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => false });
      (fs.unlink as any).mockRejectedValue({ code: 'EBUSY', message: 'File is in use' });

      await expect(handler(null, '/in-use/file.pdf', false)).rejects.toThrow('Failed to delete file');
    });

    it('should handle directory error when deleting file', async () => {
      await import('../main');
      const handler = getHandler('delete-file');

      (isSafePath as any).mockReturnValue(true);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => false });
      (fs.unlink as any).mockRejectedValue({ code: 'EISDIR', message: 'Is a directory' });
      (fs.rm as any).mockResolvedValue(undefined);

      const result = await handler(null, '/path/to/folder', false);

      expect(result).toBe(true);
      expect(fs.rm).toHaveBeenCalled();
    });
  });

  describe('list-archive-cases edge cases', () => {
    it('should handle corrupted metadata files', async () => {
      await import('../main');
      const handler = getHandler('list-archive-cases');

      (getArchiveDrive as any).mockResolvedValue('/archive/drive');
      (fs.readdir as any).mockResolvedValue([
        { isDirectory: () => true, name: 'case1' },
      ]);
      (fs.readFile as any).mockRejectedValue(new Error('Corrupted file'));

      const result = await handler(null);

      expect(Array.isArray(result)).toBe(true);
      // Should still return cases even if metadata is corrupted
      expect(result.length).toBe(1);
    });

    it('should handle missing description files', async () => {
      await import('../main');
      const handler = getHandler('list-archive-cases');

      (getArchiveDrive as any).mockResolvedValue('/archive/drive');
      (fs.readdir as any).mockResolvedValue([
        { isDirectory: () => true, name: 'case1' },
      ]);
      (fs.readFile as any)
        .mockRejectedValueOnce(new Error('Not found')) // Background image
        .mockRejectedValueOnce(new Error('Not found')); // Description

      const result = await handler(null);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].description).toBeUndefined();
    });

    it('should handle cases with background images', async () => {
      await import('../main');
      const handler = getHandler('list-archive-cases');

      (getArchiveDrive as any).mockResolvedValue('/archive/drive');
      (fs.readdir as any).mockResolvedValue([
        { isDirectory: () => true, name: 'case1' },
      ]);
      (fs.readFile as any)
        .mockResolvedValueOnce('.case-background-image.jpg') // Background image metadata
        .mockRejectedValueOnce(new Error('Not found')); // Description
      (fs.access as any).mockResolvedValue(undefined); // Background image exists

      const result = await handler(null);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].backgroundImage).toBeDefined();
    });
  });

  describe('log-renderer', () => {
    it('should log messages from renderer process', async () => {
      await import('../main');
      const handler = getHandler('log-renderer');
      expect(handler).toBeDefined();

      const { logger } = await import('../utils/logger');

      await handler(null, 'log', 'test message');
      expect(logger.log).toHaveBeenCalledWith('[Renderer]', 'test message');

      await handler(null, 'info', 'info message');
      expect(logger.info).toHaveBeenCalledWith('[Renderer]', 'info message');

      await handler(null, 'warn', 'warn message');
      expect(logger.warn).toHaveBeenCalledWith('[Renderer]', 'warn message');

      await handler(null, 'error', 'error message');
      expect(logger.error).toHaveBeenCalledWith('[Renderer]', 'error message');

      await handler(null, 'debug', 'debug message');
      expect(logger.debug).toHaveBeenCalledWith('[Renderer]', 'debug message');
    });
  });

  describe('read-pdf-file-chunk', () => {
    it('should read PDF file chunk successfully', async () => {
      await import('../main');
      const handler = getHandler('read-pdf-file-chunk');
      expect(handler).toBeDefined();

      const mockBuffer = Buffer.from('chunk data');
      const mockFileHandle = {
        read: vi.fn((buffer, offset, length) => {
          mockBuffer.copy(buffer, offset, 0, length);
          return Promise.resolve({ bytesRead: length });
        }),
        close: vi.fn(() => Promise.resolve()),
      };

      (fs.open as any).mockResolvedValue(mockFileHandle);
      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(true);

      const result = await handler(null, '/path/to/file.pdf', 0, 10);

      expect(fs.open).toHaveBeenCalledWith('/path/to/file.pdf', 'r');
      expect(mockFileHandle.read).toHaveBeenCalled();
      // Note: File handle is now cached and reused, so close may not be called immediately
      // Result should be an ArrayBuffer
      expect(result).toBeInstanceOf(ArrayBuffer);
      const resultArray = new Uint8Array(result);
      const expectedArray = new Uint8Array(mockBuffer);
      expect(resultArray).toEqual(expectedArray);
    });

    it('should throw error for invalid PDF file path', async () => {
      await import('../main');
      const handler = getHandler('read-pdf-file-chunk');

      (isValidPDFFile as any).mockReturnValue(false);
      (isSafePath as any).mockReturnValue(true);

      await expect(handler(null, '/invalid/path.txt', 0, 10)).rejects.toThrow('Invalid PDF file path');
    });

    it('should throw error for unsafe path', async () => {
      await import('../main');
      const handler = getHandler('read-pdf-file-chunk');

      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(false);

      await expect(handler(null, '/unsafe/path.pdf', 0, 10)).rejects.toThrow('Invalid PDF file path');
    });

    it('should throw error when file read fails', async () => {
      await import('../main');
      const handler = getHandler('read-pdf-file-chunk');

      (fs.open as any).mockRejectedValue(new Error('File not found'));
      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(true);

      await expect(handler(null, '/nonexistent/file.pdf', 0, 10)).rejects.toThrow('Failed to read PDF file chunk');
    });
  });

  describe('get-pdf-file-size', () => {
    it('should return PDF file size', async () => {
      await import('../main');
      const handler = getHandler('get-pdf-file-size');
      expect(handler).toBeDefined();

      const mockSize = 1024 * 1024; // 1MB
      (fs.stat as any).mockResolvedValue({ size: mockSize });
      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(true);

      const result = await handler(null, '/path/to/file.pdf');

      expect(fs.stat).toHaveBeenCalledWith('/path/to/file.pdf');
      expect(result).toBe(mockSize);
    });

    it('should throw error for invalid PDF file path', async () => {
      await import('../main');
      const handler = getHandler('get-pdf-file-size');

      (isValidPDFFile as any).mockReturnValue(false);
      (isSafePath as any).mockReturnValue(true);

      await expect(handler(null, '/invalid/path.txt')).rejects.toThrow('Invalid PDF file path');
    });

    it('should throw error for unsafe path', async () => {
      await import('../main');
      const handler = getHandler('get-pdf-file-size');

      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(false);

      await expect(handler(null, '/unsafe/path.pdf')).rejects.toThrow('Invalid PDF file path');
    });

    it('should throw error when file stat fails', async () => {
      await import('../main');
      const handler = getHandler('get-pdf-file-size');

      (fs.stat as any).mockRejectedValue(new Error('File not found'));
      (isValidPDFFile as any).mockReturnValue(true);
      (isSafePath as any).mockReturnValue(true);

      await expect(handler(null, '/nonexistent/file.pdf')).rejects.toThrow('Failed to get PDF file size');
    });
  });
});

