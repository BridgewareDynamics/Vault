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
      
      const loaded = await window.electronAPI.getSettings();
      setSettings(loaded);
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
      
      const updated = await window.electronAPI.updateSettings(updates);
      setSettings(updated);
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

