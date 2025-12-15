import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  createArchiveMarker,
  readArchiveMarker,
  updateArchiveMarker,
  isValidArchive,
} from '../archiveMarker';

// Mock Electron app - create mock function inside factory to avoid hoisting issues
vi.mock('electron', () => {
  const mockGetVersion = vi.fn(() => '1.0.0');
  return {
    app: {
      getVersion: mockGetVersion,
    },
  };
});

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

// Mock path
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    join: vi.fn((...args: string[]) => args.join('/')),
  };
});

// Mock crypto - mock randomUUID while preserving other exports
vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto');
  return {
    ...actual,
    randomUUID: vi.fn(() => 'test-uuid-1234'),
  };
});

// Import electron after mocking
import { app } from 'electron';

// Import crypto to access the mocked function
import * as crypto from 'crypto';

describe('archiveMarker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock getVersion to return default value
    (app.getVersion as any).mockReturnValue('1.0.0');
    // Reset randomUUID mock - access it through the mocked module
    const mockRandomUUID = vi.mocked(crypto.randomUUID);
    if (mockRandomUUID) {
      mockRandomUUID.mockReturnValue('test-uuid-1234');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createArchiveMarker', () => {
    it('should create a new archive marker file', async () => {
      (fs.writeFile as any).mockResolvedValue(undefined);

      const marker = await createArchiveMarker('/archive/path');

      expect(marker).toMatchObject({
        version: '1.0.0',
        createdAt: expect.any(Number),
        lastModified: expect.any(Number),
        caseCount: 0,
      });
      expect(marker.archiveId).toBeDefined();
      expect(typeof marker.archiveId).toBe('string');
      expect(marker.archiveId.length).toBeGreaterThan(0);

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/archive/path/.vault-archive.json',
        expect.stringContaining(marker.archiveId),
        'utf-8'
      );
    });

    it('should set createdAt and lastModified to current time', async () => {
      (fs.writeFile as any).mockResolvedValue(undefined);
      const beforeTime = Date.now();

      const marker = await createArchiveMarker('/archive/path');

      const afterTime = Date.now();
      expect(marker.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(marker.createdAt).toBeLessThanOrEqual(afterTime);
      expect(marker.lastModified).toBe(marker.createdAt);
    });
  });

  describe('readArchiveMarker', () => {
    it('should read and parse valid marker file', async () => {
      const mockMarker = {
        version: '1.0.0',
        createdAt: 1000000,
        lastModified: 2000000,
        caseCount: 5,
        archiveId: 'test-id',
      };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockMarker));

      const marker = await readArchiveMarker('/archive/path');

      expect(marker).toEqual(mockMarker);
      expect(fs.readFile).toHaveBeenCalledWith(
        '/archive/path/.vault-archive.json',
        'utf-8'
      );
    });

    it('should return null when file does not exist', async () => {
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      const marker = await readArchiveMarker('/archive/path');

      expect(marker).toBeNull();
    });

    it('should return null when file contains invalid JSON', async () => {
      (fs.readFile as any).mockResolvedValue('invalid json');

      const marker = await readArchiveMarker('/archive/path');

      expect(marker).toBeNull();
    });

    it('should return null when marker is missing required fields', async () => {
      const invalidMarker = {
        version: '1.0.0',
        // Missing createdAt, lastModified, archiveId
      };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(invalidMarker));

      const marker = await readArchiveMarker('/archive/path');

      expect(marker).toBeNull();
    });
  });

  describe('updateArchiveMarker', () => {
    it('should update existing marker file', async () => {
      const existingMarker = {
        version: '1.0.0',
        createdAt: 1000000,
        lastModified: 2000000,
        caseCount: 5,
        archiveId: 'test-id',
      };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(existingMarker));
      (fs.writeFile as any).mockResolvedValue(undefined);

      const updated = await updateArchiveMarker('/archive/path', {
        caseCount: 10,
      });

      expect(updated.caseCount).toBe(10);
      expect(updated.lastModified).toBeGreaterThan(existingMarker.lastModified);
      expect(updated.createdAt).toBe(existingMarker.createdAt);
      expect(updated.archiveId).toBe(existingMarker.archiveId);
    });

    it('should create new marker if one does not exist', async () => {
      (fs.readFile as any).mockResolvedValue(null);
      (fs.writeFile as any).mockResolvedValue(undefined);

      const marker = await updateArchiveMarker('/archive/path', {
        caseCount: 3,
      });

      expect(marker).toMatchObject({
        caseCount: 3,
        version: '1.0.0',
        createdAt: expect.any(Number),
        lastModified: expect.any(Number),
      });
      expect(marker.archiveId).toBeDefined();
      expect(typeof marker.archiveId).toBe('string');
    });

    it('should update lastModified timestamp', async () => {
      const existingMarker = {
        version: '1.0.0',
        createdAt: 1000000,
        lastModified: 2000000,
        archiveId: 'test-id',
      };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(existingMarker));
      (fs.writeFile as any).mockResolvedValue(undefined);
      const beforeUpdate = Date.now();

      const updated = await updateArchiveMarker('/archive/path', {});

      const afterUpdate = Date.now();
      expect(updated.lastModified).toBeGreaterThanOrEqual(beforeUpdate);
      expect(updated.lastModified).toBeLessThanOrEqual(afterUpdate);
    });
  });

  describe('isValidArchive', () => {
    it('should return true for valid archive', async () => {
      const validMarker = {
        version: '1.0.0',
        createdAt: 1000000,
        lastModified: 2000000,
        archiveId: 'test-id',
      };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(validMarker));

      const isValid = await isValidArchive('/archive/path');

      expect(isValid).toBe(true);
    });

    it('should return false when marker does not exist', async () => {
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      const isValid = await isValidArchive('/archive/path');

      expect(isValid).toBe(false);
    });

    it('should return false when marker is invalid', async () => {
      (fs.readFile as any).mockResolvedValue('invalid json');

      const isValid = await isValidArchive('/archive/path');

      expect(isValid).toBe(false);
    });

    it('should return false when read fails', async () => {
      (fs.readFile as any).mockRejectedValue(new Error('Permission denied'));

      const isValid = await isValidArchive('/archive/path');

      expect(isValid).toBe(false);
    });
  });
});

