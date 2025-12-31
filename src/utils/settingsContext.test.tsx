import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { SettingsProvider, useSettingsContext } from './settingsContext';
import { AppSettings } from '../types';
import { mockElectronAPI } from '../test-utils/mocks';

describe('SettingsContext', () => {
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
    (mockElectronAPI.getSettings as any).mockResolvedValue(defaultSettings);
    (mockElectronAPI.updateSettings as any).mockImplementation(async (updates) => ({
      ...defaultSettings,
      ...updates,
    }));
  });

  it('should provide settings context', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    );

    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    // Wait for initial load to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toBeDefined();
    expect(result.current.loading).toBeDefined();
    expect(result.current.updateSettings).toBeDefined();
    expect(result.current.refreshSettings).toBeDefined();
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSettingsContext());
    }).toThrow('useSettingsContext must be used within a SettingsProvider');

    consoleSpy.mockRestore();
  });

  it('should load settings on mount', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    );

    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toEqual(defaultSettings);
    expect(mockElectronAPI.getSettings).toHaveBeenCalled();
  });

  it('should use default settings when API fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (mockElectronAPI.getSettings as any).mockRejectedValue(
      new Error('API not available')
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    );

    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toEqual(defaultSettings);
    consoleErrorSpy.mockRestore();
  });

  it('should update settings', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    );

    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedSettings = { ...defaultSettings, ramLimitMB: 4096 };
    (mockElectronAPI.updateSettings as any).mockResolvedValue(updatedSettings);

    await act(async () => {
      await result.current.updateSettings({ ramLimitMB: 4096 });
    });

    expect(result.current.settings?.ramLimitMB).toBe(4096);
    expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith({
      ramLimitMB: 4096,
    });
  });

  it('should refresh settings', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    );

    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newSettings = { ...defaultSettings, fullscreen: true };
    (mockElectronAPI.getSettings as any).mockResolvedValue(newSettings);

    await act(async () => {
      await result.current.refreshSettings();
    });

    expect(result.current.settings?.fullscreen).toBe(true);
    expect(mockElectronAPI.getSettings).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  it('should handle updateSettings error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (mockElectronAPI.updateSettings as any).mockRejectedValue(
      new Error('Update failed')
    );
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    );

    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.updateSettings({ ramLimitMB: 4096 });
      })
    ).rejects.toThrow('Update failed');
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle missing electronAPI gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalAPI = window.electronAPI;
    // @ts-ignore
    delete window.electronAPI;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    );

    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should use defaults when API is not available
    expect(result.current.settings).toEqual(defaultSettings);

    // Restore
    window.electronAPI = originalAPI;
    consoleErrorSpy.mockRestore();
  });
});











