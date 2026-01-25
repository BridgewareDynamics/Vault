import React, { createContext, useContext, ReactNode } from 'react';
import { AppSettings } from '../types';

interface SettingsContextValue {
  settings: AppSettings | null;
  loading: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadSettings = React.useCallback(async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      // Check if getSettings function exists
      if (typeof window.electronAPI.getSettings !== 'function') {
        throw new Error('Settings API not available - preload script may need to be rebuilt');
      }
      
      const loaded = await window.electronAPI.getSettings() as Partial<AppSettings>;
      // Ensure all required fields are present
      const completeSettings: AppSettings = {
        hardwareAcceleration: loaded.hardwareAcceleration ?? true,
        ramLimitMB: loaded.ramLimitMB ?? 2048,
        fullscreen: loaded.fullscreen ?? false,
        extractionQuality: loaded.extractionQuality ?? 'high',
        thumbnailSize: loaded.thumbnailSize ?? 200,
        performanceMode: loaded.performanceMode ?? 'auto',
        showOnboarding: loaded.showOnboarding ?? true,
        theme: loaded.theme ?? 'brideware-purple',
      };
      setSettings(completeSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Set defaults on error
      setSettings({
        hardwareAcceleration: true,
        ramLimitMB: 2048,
        fullscreen: false,
        extractionQuality: 'high',
        thumbnailSize: 200,
        performanceMode: 'auto',
        showOnboarding: true,
        theme: 'brideware-purple',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = React.useCallback(async (updates: Partial<AppSettings>) => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      // Check if updateSettings function exists
      if (typeof window.electronAPI.updateSettings !== 'function') {
        throw new Error('Settings API not available - preload script may need to be rebuilt');
      }
      
      const updated = await window.electronAPI.updateSettings(updates) as Partial<AppSettings>;
      // Ensure all required fields are present
      const completeSettings: AppSettings = {
        hardwareAcceleration: updated.hardwareAcceleration ?? true,
        ramLimitMB: updated.ramLimitMB ?? 2048,
        fullscreen: updated.fullscreen ?? false,
        extractionQuality: updated.extractionQuality ?? 'high',
        thumbnailSize: updated.thumbnailSize ?? 200,
        performanceMode: updated.performanceMode ?? 'auto',
        showOnboarding: updated.showOnboarding ?? true,
        theme: updated.theme ?? 'brideware-purple',
      };
      setSettings(completeSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const value: SettingsContextValue = {
    settings,
    loading,
    updateSettings,
    refreshSettings: loadSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}

