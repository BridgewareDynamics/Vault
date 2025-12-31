import { useCallback } from 'react';
import { useSettingsContext } from '../utils/settingsContext';
import { AppSettings } from '../types';

export function useSettings() {
  const { settings, loading, updateSettings, refreshSettings } = useSettingsContext();

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    await updateSettings({ [key]: value } as Partial<AppSettings>);
  }, [updateSettings]);

  const toggleHardwareAcceleration = useCallback(async () => {
    if (settings) {
      await updateSetting('hardwareAcceleration', !settings.hardwareAcceleration);
    }
  }, [settings, updateSetting]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      await window.electronAPI.toggleFullscreen();
      // Refresh settings to get updated fullscreen state
      await refreshSettings();
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
      throw error;
    }
  }, [refreshSettings]);

  const setRamLimit = useCallback(async (mb: number) => {
    await updateSetting('ramLimitMB', mb);
  }, [updateSetting]);

  const setExtractionQuality = useCallback(async (quality: AppSettings['extractionQuality']) => {
    await updateSetting('extractionQuality', quality);
  }, [updateSetting]);

  const setThumbnailSize = useCallback(async (size: number) => {
    await updateSetting('thumbnailSize', size);
  }, [updateSetting]);

  const setPerformanceMode = useCallback(async (mode: AppSettings['performanceMode']) => {
    await updateSetting('performanceMode', mode);
  }, [updateSetting]);

  return {
    settings,
    loading,
    updateSettings,
    updateSetting,
    toggleHardwareAcceleration,
    toggleFullscreen,
    setRamLimit,
    setExtractionQuality,
    setThumbnailSize,
    setPerformanceMode,
    refreshSettings,
  };
}














