import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

const SETTINGS_FILE_NAME = 'app-settings.json';

export type ExtractionQuality = 'high' | 'medium' | 'low';
export type PerformanceMode = 'auto' | 'high' | 'balanced' | 'low';

export interface AppSettings {
  hardwareAcceleration: boolean;
  ramLimitMB: number;
  fullscreen: boolean;
  extractionQuality: ExtractionQuality;
  thumbnailSize: number;
  performanceMode: PerformanceMode;
}

const DEFAULT_SETTINGS: AppSettings = {
  hardwareAcceleration: true,
  ramLimitMB: 2048,
  fullscreen: false,
  extractionQuality: 'high',
  thumbnailSize: 200,
  performanceMode: 'auto',
};

let cachedSettings: AppSettings | null = null;

/**
 * Get the path to the settings file
 */
function getSettingsPath(): string {
  // Ensure app is ready before getting path
  if (!app.isReady()) {
    throw new Error('App is not ready yet');
  }
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, SETTINGS_FILE_NAME);
}

/**
 * Validate settings object
 */
function validateSettings(settings: Partial<AppSettings>): AppSettings {
  const validated: AppSettings = {
    hardwareAcceleration: typeof settings.hardwareAcceleration === 'boolean' 
      ? settings.hardwareAcceleration 
      : DEFAULT_SETTINGS.hardwareAcceleration,
    ramLimitMB: typeof settings.ramLimitMB === 'number' && settings.ramLimitMB >= 512 && settings.ramLimitMB <= 8192
      ? settings.ramLimitMB
      : DEFAULT_SETTINGS.ramLimitMB,
    fullscreen: typeof settings.fullscreen === 'boolean'
      ? settings.fullscreen
      : DEFAULT_SETTINGS.fullscreen,
    extractionQuality: ['high', 'medium', 'low'].includes(settings.extractionQuality || '')
      ? (settings.extractionQuality as ExtractionQuality)
      : DEFAULT_SETTINGS.extractionQuality,
    thumbnailSize: typeof settings.thumbnailSize === 'number' && settings.thumbnailSize >= 100 && settings.thumbnailSize <= 400
      ? settings.thumbnailSize
      : DEFAULT_SETTINGS.thumbnailSize,
    performanceMode: ['auto', 'high', 'balanced', 'low'].includes(settings.performanceMode || '')
      ? (settings.performanceMode as PerformanceMode)
      : DEFAULT_SETTINGS.performanceMode,
  };
  return validated;
}

/**
 * Load settings from disk
 */
export async function loadSettings(): Promise<AppSettings> {
  const settingsPath = getSettingsPath();
  
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    const data = await fs.readFile(settingsPath, 'utf-8');
    const parsed = JSON.parse(data) as Partial<AppSettings>;
    cachedSettings = validateSettings(parsed);
    return cachedSettings;
  } catch (error) {
    // Settings file doesn't exist or is invalid, return defaults
    cachedSettings = { ...DEFAULT_SETTINGS };
    // Save defaults to disk for next time
    try {
      await saveSettings(cachedSettings);
    } catch {
      // Ignore save errors on first run
    }
    return cachedSettings;
  }
}

/**
 * Save settings to disk
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const settingsPath = getSettingsPath();
    const validated = validateSettings(settings);
    cachedSettings = validated;
    
    // Atomic write: write to temp file then rename
    const tempPath = `${settingsPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(validated, null, 2), 'utf-8');
    await fs.rename(tempPath, settingsPath);
  } catch (error) {
    throw new Error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update specific settings (partial update)
 */
export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings();
  const updated = { ...current, ...updates };
  const validated = validateSettings(updated);
  await saveSettings(validated);
  return validated;
}

/**
 * Get default settings
 */
export function getDefaultSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS };
}

/**
 * Clear the cached settings (useful for testing)
 */
export function clearSettingsCache(): void {
  cachedSettings = null;
}


