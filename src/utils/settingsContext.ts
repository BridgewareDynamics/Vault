import { createContext, useContext } from 'react';
import { AppSettings } from '../types';

export interface SettingsContextValue {
  settings: AppSettings | null;
  loading: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function useSettingsContext(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}
