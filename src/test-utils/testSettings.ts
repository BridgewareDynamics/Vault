import { AppSettings } from '../types';
import { mockElectronAPI } from './mocks';

export const defaultTestSettings: AppSettings = {
  hardwareAcceleration: true,
  ramLimitMB: 2048,
  fullscreen: false,
  extractionQuality: 'high',
  thumbnailSize: 200,
  performanceMode: 'auto',
  showOnboarding: false,
  theme: 'brideware-purple',
};

/** Wire electronAPI settings mocks used by SettingsProvider in component tests. */
export function setupTestSettings(overrides?: Partial<AppSettings>): void {
  window.electronAPI = mockElectronAPI;
  const settings = { ...defaultTestSettings, ...overrides };
  mockElectronAPI.getSettings.mockResolvedValue(settings);
  mockElectronAPI.updateSettings.mockImplementation(async (updates) => ({
    ...settings,
    ...updates,
  }));
  mockElectronAPI.debugLog.mockResolvedValue(undefined);
}
