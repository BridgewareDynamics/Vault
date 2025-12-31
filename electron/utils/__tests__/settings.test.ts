import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { app } from 'electron';
import {
  loadSettings,
  saveSettings,
  updateSettings,
  getDefaultSettings,
  clearSettingsCache,
} from '../settings';
import type { AppSettings } from '../settings';

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
  rename: vi.fn(),
}));

// Mock path
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    join: vi.fn((...args: string[]) => args.join('/')),
  };
});

describe('settings', () => {
  const defaultSettings: AppSettings = {
    hardwareAcceleration: true,
    ramLimitMB: 2048,
    fullscreen: false,
    extractionQuality: 'high',
    thumbnailSize: 200,
    performanceMode: 'auto',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearSettingsCache();
    (app.isReady as any).mockReturnValue(true);
    (app.getPath as any).mockReturnValue('/mock/user/data');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDefaultSettings', () => {
    it('should return default settings', () => {
      const defaults = getDefaultSettings();
      expect(defaults).toEqual(defaultSettings);
    });
  });

  describe('loadSettings', () => {
    it('should load existing settings file', async () => {
      const mockSettings: AppSettings = {
        hardwareAcceleration: false,
        ramLimitMB: 4096,
        fullscreen: true,
        extractionQuality: 'medium',
        thumbnailSize: 300,
        performanceMode: 'high',
      };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockSettings));

      const settings = await loadSettings();

      expect(settings).toEqual(mockSettings);
      expect(fs.readFile).toHaveBeenCalledWith(
        '/mock/user/data/app-settings.json',
        'utf-8'
      );
    });

    it('should return default settings when file does not exist', async () => {
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.rename as any).mockResolvedValue(undefined);

      const settings = await loadSettings();

      expect(settings).toEqual(defaultSettings);
      // Should save defaults on first run
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should return default settings when file is invalid JSON', async () => {
      (fs.readFile as any).mockResolvedValue('invalid json');
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.rename as any).mockResolvedValue(undefined);

      const settings = await loadSettings();

      expect(settings).toEqual(defaultSettings);
    });

    it('should validate and correct invalid settings values', async () => {
      const invalidSettings = {
        hardwareAcceleration: 'not a boolean',
        ramLimitMB: 10000, // Over max
        fullscreen: true,
        extractionQuality: 'invalid',
        thumbnailSize: 500, // Over max
        performanceMode: 'invalid',
      };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(invalidSettings));

      const settings = await loadSettings();

      // Should use defaults for invalid values
      expect(settings.hardwareAcceleration).toBe(true);
      expect(settings.ramLimitMB).toBe(2048);
      expect(settings.extractionQuality).toBe('high');
      expect(settings.thumbnailSize).toBe(200);
      expect(settings.performanceMode).toBe('auto');
      expect(settings.fullscreen).toBe(true); // Valid value preserved
    });

    it('should throw error when app is not ready', async () => {
      clearSettingsCache();
      (app.isReady as any).mockReturnValue(false);

      await expect(loadSettings()).rejects.toThrow('App is not ready yet');
    });

    it('should cache loaded settings', async () => {
      const mockSettings = { ...defaultSettings, ramLimitMB: 4096 };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockSettings));

      const settings1 = await loadSettings();
      const settings2 = await loadSettings();

      expect(settings1).toEqual(settings2);
      expect(fs.readFile).toHaveBeenCalledTimes(1); // Should only read once
    });
  });

  describe('saveSettings', () => {
    it('should save settings to file atomically', async () => {
      const settings: AppSettings = {
        ...defaultSettings,
        ramLimitMB: 4096,
      };
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.rename as any).mockResolvedValue(undefined);

      await saveSettings(settings);

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/mock/user/data/app-settings.json.tmp',
        JSON.stringify(settings, null, 2),
        'utf-8'
      );
      expect(fs.rename).toHaveBeenCalledWith(
        '/mock/user/data/app-settings.json.tmp',
        '/mock/user/data/app-settings.json'
      );
    });

    it('should validate settings before saving', async () => {
      const invalidSettings = {
        ...defaultSettings,
        ramLimitMB: 10000, // Invalid
      };
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.rename as any).mockResolvedValue(undefined);

      await saveSettings(invalidSettings);

      // Should save validated version
      const savedData = (fs.writeFile as any).mock.calls[0][1];
      const savedSettings = JSON.parse(savedData);
      expect(savedSettings.ramLimitMB).toBe(2048); // Corrected to default
    });

    it('should throw error when save fails', async () => {
      const settings = { ...defaultSettings };
      (fs.writeFile as any).mockRejectedValue(new Error('Write failed'));

      await expect(saveSettings(settings)).rejects.toThrow(
        'Failed to save settings'
      );
    });
  });

  describe('updateSettings', () => {
    it('should update specific settings fields', async () => {
      const currentSettings = { ...defaultSettings };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(currentSettings));
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.rename as any).mockResolvedValue(undefined);

      const updated = await updateSettings({ ramLimitMB: 4096, fullscreen: true });

      expect(updated.ramLimitMB).toBe(4096);
      expect(updated.fullscreen).toBe(true);
      expect(updated.hardwareAcceleration).toBe(true); // Unchanged
    });

    it('should validate updated settings', async () => {
      const currentSettings = { ...defaultSettings };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(currentSettings));
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.rename as any).mockResolvedValue(undefined);

      const updated = await updateSettings({ ramLimitMB: 10000 }); // Invalid

      expect(updated.ramLimitMB).toBe(2048); // Corrected to default
    });

    it('should merge updates with existing settings', async () => {
      const currentSettings: AppSettings = {
        hardwareAcceleration: false,
        ramLimitMB: 1024,
        fullscreen: false,
        extractionQuality: 'low',
        thumbnailSize: 150,
        performanceMode: 'balanced',
      };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(currentSettings));
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.rename as any).mockResolvedValue(undefined);

      const updated = await updateSettings({ ramLimitMB: 4096 });

      expect(updated.ramLimitMB).toBe(4096);
      expect(updated.hardwareAcceleration).toBe(false); // Preserved
      expect(updated.extractionQuality).toBe('low'); // Preserved
    });
  });

  describe('clearSettingsCache', () => {
    it('should clear cached settings', async () => {
      const mockSettings = { ...defaultSettings, ramLimitMB: 4096 };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockSettings));

      await loadSettings(); // Load and cache
      clearSettingsCache();
      (fs.readFile as any).mockResolvedValue(JSON.stringify(defaultSettings));

      const settings = await loadSettings();

      expect(settings).toEqual(defaultSettings);
      expect(fs.readFile).toHaveBeenCalledTimes(2); // Should read again after clear
    });
  });

  describe('validation', () => {
    it('should validate ramLimitMB range', async () => {
      const invalidLow = { ...defaultSettings, ramLimitMB: 256 }; // Below min
      const invalidHigh = { ...defaultSettings, ramLimitMB: 10000 }; // Above max
      (fs.readFile as any).mockResolvedValue(JSON.stringify(invalidLow));

      const settings1 = await loadSettings();
      expect(settings1.ramLimitMB).toBe(2048); // Corrected to default

      clearSettingsCache();
      (fs.readFile as any).mockResolvedValue(JSON.stringify(invalidHigh));

      const settings2 = await loadSettings();
      expect(settings2.ramLimitMB).toBe(2048); // Corrected to default
    });

    it('should validate extractionQuality enum', async () => {
      const invalid = { ...defaultSettings, extractionQuality: 'invalid' as any };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(invalid));

      const settings = await loadSettings();

      expect(settings.extractionQuality).toBe('high'); // Corrected to default
    });

    it('should validate performanceMode enum', async () => {
      const invalid = { ...defaultSettings, performanceMode: 'invalid' as any };
      (fs.readFile as any).mockResolvedValue(JSON.stringify(invalid));

      const settings = await loadSettings();

      expect(settings.performanceMode).toBe('auto'); // Corrected to default
    });

    it('should validate thumbnailSize range', async () => {
      const invalidLow = { ...defaultSettings, thumbnailSize: 50 }; // Below min
      const invalidHigh = { ...defaultSettings, thumbnailSize: 500 }; // Above max
      (fs.readFile as any).mockResolvedValue(JSON.stringify(invalidLow));

      const settings1 = await loadSettings();
      expect(settings1.thumbnailSize).toBe(200); // Corrected to default

      clearSettingsCache();
      (fs.readFile as any).mockResolvedValue(JSON.stringify(invalidHigh));

      const settings2 = await loadSettings();
      expect(settings2.thumbnailSize).toBe(200); // Corrected to default
    });
  });
});

