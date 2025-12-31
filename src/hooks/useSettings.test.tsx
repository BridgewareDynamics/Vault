import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useSettings } from './useSettings';
import { SettingsProvider } from '../utils/settingsContext';
import { AppSettings } from '../types';
import { mockElectronAPI } from '../test-utils/mocks';

describe('useSettings', () => {
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
    (mockElectronAPI.toggleFullscreen as any).mockResolvedValue(true);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return <SettingsProvider>{children}</SettingsProvider>;
  };

  it('should provide settings and helper functions', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toBeDefined();
    expect(result.current.updateSettings).toBeDefined();
    expect(result.current.updateSetting).toBeDefined();
    expect(result.current.toggleHardwareAcceleration).toBeDefined();
    expect(result.current.toggleFullscreen).toBeDefined();
    expect(result.current.setRamLimit).toBeDefined();
    expect(result.current.setExtractionQuality).toBeDefined();
    expect(result.current.setThumbnailSize).toBeDefined();
    expect(result.current.setPerformanceMode).toBeDefined();
    expect(result.current.refreshSettings).toBeDefined();
  });

  describe('updateSetting', () => {
    it('should update a single setting', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSetting('ramLimitMB', 4096);
      });

      expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith({
        ramLimitMB: 4096,
      });
    });
  });

  describe('toggleHardwareAcceleration', () => {
    it('should toggle hardware acceleration', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleHardwareAcceleration();
      });

      expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith({
        hardwareAcceleration: false,
      });
    });

    it('should toggle from false to true', async () => {
      (mockElectronAPI.getSettings as any).mockResolvedValue({
        ...defaultSettings,
        hardwareAcceleration: false,
      });

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleHardwareAcceleration();
      });

      expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith({
        hardwareAcceleration: true,
      });
    });
  });

  describe('toggleFullscreen', () => {
    it('should toggle fullscreen', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleFullscreen();
      });

      expect(mockElectronAPI.toggleFullscreen).toHaveBeenCalled();
      expect(mockElectronAPI.getSettings).toHaveBeenCalledTimes(2); // Once on mount, once after toggle
    });

    it('should handle toggleFullscreen error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (mockElectronAPI.toggleFullscreen as any).mockRejectedValue(
        new Error('Toggle failed')
      );

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.toggleFullscreen();
        })
      ).rejects.toThrow('Toggle failed');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('setRamLimit', () => {
    it('should set RAM limit', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.setRamLimit(4096);
      });

      expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith({
        ramLimitMB: 4096,
      });
    });
  });

  describe('setExtractionQuality', () => {
    it('should set extraction quality', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.setExtractionQuality('medium');
      });

      expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith({
        extractionQuality: 'medium',
      });
    });
  });

  describe('setThumbnailSize', () => {
    it('should set thumbnail size', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.setThumbnailSize(300);
      });

      expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith({
        thumbnailSize: 300,
      });
    });
  });

  describe('setPerformanceMode', () => {
    it('should set performance mode', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.setPerformanceMode('high');
      });

      expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith({
        performanceMode: 'high',
      });
    });
  });
});











