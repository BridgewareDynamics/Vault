import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'path';
import {
  isValidPDFFile,
  isSafePath,
  isValidDirectory,
  isValidFolderName,
} from '../pathValidator';

// Mock fs - create mock function inside factory to avoid hoisting issues
vi.mock('fs', () => {
  const mockStat = vi.fn();
  return {
    default: {
      promises: {
        stat: mockStat,
      },
    },
    promises: {
      stat: mockStat,
    },
  };
});

// Import fs after mocking
import * as fs from 'fs';

// Mock path
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    normalize: vi.fn((p: string) => p),
    extname: vi.fn((p: string) => {
      const ext = p.split('.').pop()?.toLowerCase();
      return ext ? `.${ext}` : '';
    }),
  };
});

describe('pathValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockStat = vi.mocked(fs.promises.stat);
    mockStat.mockReset();
    // Reset path.normalize to default implementation (return path as-is)
    (path.normalize as any).mockImplementation((p: string) => p);
  });

  describe('isValidPDFFile', () => {
    it('should return true for valid PDF file', () => {
      expect(isValidPDFFile('/path/to/file.pdf')).toBe(true);
      expect(isValidPDFFile('C:\\path\\to\\file.PDF')).toBe(true);
    });

    it('should return false for non-PDF files', () => {
      expect(isValidPDFFile('/path/to/file.txt')).toBe(false);
      expect(isValidPDFFile('/path/to/file.doc')).toBe(false);
      expect(isValidPDFFile('/path/to/file')).toBe(false);
    });

    it('should return false for invalid input', () => {
      expect(isValidPDFFile('')).toBe(false);
      expect(isValidPDFFile(null as any)).toBe(false);
      expect(isValidPDFFile(undefined as any)).toBe(false);
      expect(isValidPDFFile(123 as any)).toBe(false);
    });
  });

  describe('isSafePath', () => {
    it('should return true for safe paths', () => {
      expect(isSafePath('/path/to/file.pdf')).toBe(true);
      expect(isSafePath('C:\\path\\to\\file.pdf')).toBe(true);
      expect(isSafePath('relative/path/file.pdf')).toBe(true);
    });

    it('should return false for paths with path traversal', () => {
      // Don't mock normalize - let it work normally, but our implementation
      // checks the original path first
      expect(isSafePath('../file.pdf')).toBe(false);
      expect(isSafePath('/path/../file.pdf')).toBe(false);
      expect(isSafePath('../../etc/passwd')).toBe(false);
    });

    it('should return false for paths with tilde', () => {
      (path.normalize as any).mockImplementation((p: string) => {
        if (p.includes('~')) return p;
        return p;
      });

      expect(isSafePath('~/file.pdf')).toBe(false);
      expect(isSafePath('/path/~/file.pdf')).toBe(false);
    });

    it('should return false for paths with double slashes', () => {
      // Don't mock normalize - our implementation checks for // in original path
      expect(isSafePath('/path//file.pdf')).toBe(false);
      // Windows paths with \\ at start after drive are allowed
      expect(isSafePath('C:\\\\path\\file.pdf')).toBe(true); // This is a valid Windows path (C:\\path\file.pdf)
      expect(isSafePath('path\\\\file.pdf')).toBe(false); // Double backslashes in middle
      expect(isSafePath('C:\\\\path\\\\file.pdf')).toBe(false); // Double backslashes after drive
    });

    it('should return false for invalid input', () => {
      expect(isSafePath('')).toBe(false);
      expect(isSafePath(null as any)).toBe(false);
      expect(isSafePath(undefined as any)).toBe(false);
      expect(isSafePath(123 as any)).toBe(false);
    });
  });

  describe('isValidDirectory', () => {
    it('should return true for valid directory', async () => {
      // Use a path that will pass isSafePath (no .., ~, or //)
      const testPath = 'validpath'; // Use a simple path without slashes to avoid normalization issues
      
      // Verify isSafePath works first
      expect(isSafePath(testPath)).toBe(true);
      
      // Reset the mock and set up properly
      const mockStat = vi.mocked(fs.promises.stat);
      mockStat.mockReset();
      mockStat.mockClear();
      
      const mockStats = {
        isDirectory: vi.fn(() => true),
      };
      mockStat.mockResolvedValue(mockStats);

      const isValid = await isValidDirectory(testPath);

      expect(isValid).toBe(true);
      // Check if stat was called (it should be if isSafePath passed)
      expect(mockStat).toHaveBeenCalledWith(testPath);
      expect(mockStats.isDirectory).toHaveBeenCalled();
    });

    it('should return false for file (not directory)', async () => {
      const mockStat = vi.mocked(fs.promises.stat);
      mockStat.mockResolvedValue({
        isDirectory: () => false,
      });

      const isValid = await isValidDirectory('/path/to/file.pdf');

      expect(isValid).toBe(false);
    });

    it('should return false when directory does not exist', async () => {
      const mockStat = vi.mocked(fs.promises.stat);
      mockStat.mockRejectedValue(new Error('ENOENT'));

      const isValid = await isValidDirectory('/nonexistent/dir');

      expect(isValid).toBe(false);
    });

    it('should return false for unsafe paths', async () => {
      // Don't need to mock normalize - isSafePath checks original path
      const mockStat = vi.mocked(fs.promises.stat);
      mockStat.mockReset();
      const isValid = await isValidDirectory('../unsafe/path');

      expect(isValid).toBe(false);
      expect(mockStat).not.toHaveBeenCalled();
    });

    it('should return false for invalid input', async () => {
      expect(await isValidDirectory('')).toBe(false);
      expect(await isValidDirectory(null as any)).toBe(false);
      expect(await isValidDirectory(undefined as any)).toBe(false);
    });
  });

  describe('isValidFolderName', () => {
    it('should return true for valid folder names', () => {
      expect(isValidFolderName('MyFolder')).toBe(true);
      expect(isValidFolderName('folder-123')).toBe(true);
      expect(isValidFolderName('folder_name')).toBe(true);
      expect(isValidFolderName('Folder.123')).toBe(true);
    });

    it('should return false for names with invalid characters', () => {
      expect(isValidFolderName('folder<name')).toBe(false);
      expect(isValidFolderName('folder>name')).toBe(false);
      expect(isValidFolderName('folder:name')).toBe(false);
      expect(isValidFolderName('folder"name')).toBe(false);
      expect(isValidFolderName('folder/name')).toBe(false);
      expect(isValidFolderName('folder\\name')).toBe(false);
      expect(isValidFolderName('folder|name')).toBe(false);
      expect(isValidFolderName('folder?name')).toBe(false);
      expect(isValidFolderName('folder*name')).toBe(false);
    });

    it('should return false for Windows reserved names', () => {
      expect(isValidFolderName('CON')).toBe(false);
      expect(isValidFolderName('PRN')).toBe(false);
      expect(isValidFolderName('AUX')).toBe(false);
      expect(isValidFolderName('NUL')).toBe(false);
      expect(isValidFolderName('COM1')).toBe(false);
      expect(isValidFolderName('LPT1')).toBe(false);
      expect(isValidFolderName('con')).toBe(false); // Case insensitive
      expect(isValidFolderName('PrN')).toBe(false);
    });

    it('should return false for names that are too long', () => {
      const longName = 'a'.repeat(201);
      expect(isValidFolderName(longName)).toBe(false);
    });

    it('should return true for names at the length limit', () => {
      const maxLengthName = 'a'.repeat(200);
      expect(isValidFolderName(maxLengthName)).toBe(true);
    });

    it('should return false for empty or invalid input', () => {
      expect(isValidFolderName('')).toBe(false);
      expect(isValidFolderName('   ')).toBe(false);
      expect(isValidFolderName(null as any)).toBe(false);
      expect(isValidFolderName(undefined as any)).toBe(false);
      expect(isValidFolderName(123 as any)).toBe(false);
    });

    it('should return false for names with control characters', () => {
      expect(isValidFolderName('folder\x00name')).toBe(false);
      expect(isValidFolderName('folder\nname')).toBe(false);
      expect(isValidFolderName('folder\tname')).toBe(false);
    });
  });
});

