import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import {
  loadArchiveConfig,
  saveArchiveConfig,
  getArchiveDrive,
  setArchiveDrive,
  clearCache,
} from '../archiveConfig';

// Mock Electron app
vi.mock('electron', () => ({
  app: {
    isReady: vi.fn(() => true),
    getPath: vi.fn((name: string) => {
      if (name === 'userData') {
        return '/mock/user/data';
      }
      return '/mock/path';
    }),
  },
}));

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

describe('archiveConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache(); // Clear cache before each test
    (app.isReady as any).mockReturnValue(true);
    (app.getPath as any).mockReturnValue('/mock/user/data');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadArchiveConfig', () => {
    it('should load existing config file', async () => {
      const mockConfig = { archiveDrive: '/path/to/archive' };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await loadArchiveConfig();

      expect(config).toEqual(mockConfig);
      expect(fs.readFile).toHaveBeenCalledWith(
        '/mock/user/data/archive-config.json',
        'utf-8'
      );
    });

    it('should return default config when file does not exist', async () => {
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      const config = await loadArchiveConfig();

      expect(config).toEqual({ archiveDrive: null });
    });

    it('should return default config when file is invalid JSON', async () => {
      (fs.readFile as any).mockResolvedValue('invalid json');

      const config = await loadArchiveConfig();

      expect(config).toEqual({ archiveDrive: null });
    });

    it('should throw error when app is not ready', async () => {
      clearCache(); // Clear cache first
      (app.isReady as any).mockReturnValue(false);

      await expect(loadArchiveConfig()).rejects.toThrow('App is not ready yet');
    });
  });

  describe('saveArchiveConfig', () => {
    it('should save config to file', async () => {
      const config = { archiveDrive: '/path/to/archive' };
      (fs.writeFile as any).mockResolvedValue(undefined);

      await saveArchiveConfig(config);

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/mock/user/data/archive-config.json',
        JSON.stringify(config, null, 2),
        'utf-8'
      );
    });

    it('should throw error when save fails', async () => {
      const config = { archiveDrive: '/path/to/archive' };
      (fs.writeFile as any).mockRejectedValue(new Error('Write failed'));

      await expect(saveArchiveConfig(config)).rejects.toThrow(
        'Failed to save archive config'
      );
    });
  });

  describe('getArchiveDrive', () => {
    it('should return archive drive from config', async () => {
      const mockConfig = { archiveDrive: '/path/to/archive' };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockConfig));

      const drive = await getArchiveDrive();

      expect(drive).toBe('/path/to/archive');
    });

    it('should return null when no drive is set', async () => {
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      const drive = await getArchiveDrive();

      expect(drive).toBeNull();
    });
  });

  describe('setArchiveDrive', () => {
    it('should set archive drive in config', async () => {
      (fs.readFile as any).mockResolvedValue(JSON.stringify({ archiveDrive: null }));
      (fs.writeFile as any).mockResolvedValue(undefined);

      await setArchiveDrive('/new/path/to/archive');

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/mock/user/data/archive-config.json',
        expect.stringContaining('/new/path/to/archive'),
        'utf-8'
      );
    });

    it('should set archive drive to null', async () => {
      (fs.readFile as any).mockResolvedValue(
        JSON.stringify({ archiveDrive: '/old/path' })
      );
      (fs.writeFile as any).mockResolvedValue(undefined);

      await setArchiveDrive(null);

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/mock/user/data/archive-config.json',
        expect.stringContaining('null'),
        'utf-8'
      );
    });
  });
});

