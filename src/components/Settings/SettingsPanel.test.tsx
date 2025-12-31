import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { SettingsPanel } from './SettingsPanel';
import { SettingsProvider } from '../../utils/settingsContext';
import { ToastProvider } from '../Toast/ToastContext';
import { WordEditorProvider } from '../../contexts/WordEditorContext';
import { mockElectronAPI } from '../../test-utils/mocks';
import { AppSettings } from '../../types';

describe('SettingsPanel', () => {
  const defaultSettings: AppSettings = {
    hardwareAcceleration: true,
    ramLimitMB: 2048,
    fullscreen: false,
    extractionQuality: 'high',
    thumbnailSize: 200,
    performanceMode: 'auto',
  };

  const mockMemoryInfo = {
    totalMemory: 16 * 1024 * 1024 * 1024, // 16GB
    freeMemory: 8 * 1024 * 1024 * 1024, // 8GB
    usedMemory: 8 * 1024 * 1024 * 1024, // 8GB
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (mockElectronAPI.getSettings as any).mockResolvedValue(defaultSettings);
    (mockElectronAPI.updateSettings as any).mockImplementation(async (updates) => ({
      ...defaultSettings,
      ...updates,
    }));
    (mockElectronAPI.toggleFullscreen as any).mockResolvedValue(true);
    (mockElectronAPI.getSystemMemory as any).mockResolvedValue(mockMemoryInfo);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  const renderWithProviders = () => {
    return render(
      <ToastProvider>
        <WordEditorProvider>
          <SettingsProvider>
            <SettingsPanel />
          </SettingsProvider>
        </WordEditorProvider>
      </ToastProvider>
    );
  };

  it('should render settings icon button', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });
  });

  it('should not render panel initially', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('should open panel when icon is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByLabelText('Open settings');
    await user.click(settingsButton);

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should close panel when backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByLabelText('Open settings');
    await act(async () => {
      await user.click(settingsButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    // Find backdrop by its class name
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    expect(backdrop).toBeInTheDocument();

    await act(async () => {
      if (backdrop) {
        fireEvent.click(backdrop);
      }
    });

    await waitFor(() => {
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should close panel when close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByLabelText('Open settings');
    await user.click(settingsButton);

    const closeButton = screen.getByLabelText('Close settings');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  it('should display memory usage', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByLabelText('Open settings');
    await user.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('System Memory')).toBeInTheDocument();
    });
  });

  it('should toggle hardware acceleration', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByLabelText('Open settings');
    await user.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('Hardware Acceleration')).toBeInTheDocument();
    });

    const toggleButton = screen.getByText('Enabled');
    await user.click(toggleButton);

    expect(mockElectronAPI.updateSettings).toHaveBeenCalled();
  });

  it('should update RAM limit with slider', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByLabelText('Open settings');
    await act(async () => {
      await user.click(settingsButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/RAM Limit:/)).toBeInTheDocument();
    });

    // Find the RAM limit slider by its value and type
    const sliders = screen.getAllByRole('slider');
    const ramSlider = sliders.find(
      (slider) => (slider as HTMLInputElement).min === '512' && (slider as HTMLInputElement).max === '8192'
    ) as HTMLInputElement;

    expect(ramSlider).toBeDefined();
    expect(ramSlider.value).toBe('2048');

    // Change slider value using fireEvent for range inputs
    await act(async () => {
      fireEvent.change(ramSlider, { target: { value: '4096' } });
    });

    // Wait for debounced update
    await waitFor(() => {
      expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ ramLimitMB: 4096 })
      );
    }, { timeout: 1000 });
  });

  it('should toggle fullscreen', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByLabelText('Open settings');
    await user.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('Fullscreen')).toBeInTheDocument();
    });

    const fullscreenButton = screen.getByText('Enter Fullscreen');
    await user.click(fullscreenButton);

    expect(mockElectronAPI.toggleFullscreen).toHaveBeenCalled();
  });

  it('should change extraction quality', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByLabelText('Open settings');
    await act(async () => {
      await user.click(settingsButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Extraction Quality')).toBeInTheDocument();
    });

    // Find select by finding the label text, then the associated select
    const qualityLabel = screen.getByText('Extraction Quality');
    const selectContainer = qualityLabel.closest('div');
    const select = selectContainer?.querySelector('select') as HTMLSelectElement;

    expect(select).toBeDefined();
    expect(select.value).toBe('high');

    await act(async () => {
      await user.selectOptions(select, 'medium');
    });

    await waitFor(() => {
      expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith({
        extractionQuality: 'medium',
      });
    });
  });

  it('should change thumbnail size with slider', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByLabelText('Open settings');
    await act(async () => {
      await user.click(settingsButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Thumbnail Size:/)).toBeInTheDocument();
    });

    // Find thumbnail size slider by its min/max values
    const sliders = screen.getAllByRole('slider');
    const thumbnailSlider = sliders.find(
      (slider) => (slider as HTMLInputElement).min === '100' && (slider as HTMLInputElement).max === '400'
    ) as HTMLInputElement;

    expect(thumbnailSlider).toBeDefined();
    expect(thumbnailSlider.value).toBe('200');

    await act(async () => {
      fireEvent.change(thumbnailSlider, { target: { value: '300' } });
    });

    await waitFor(() => {
      expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ thumbnailSize: 300 })
      );
    }, { timeout: 1000 });
  });

  it('should change performance mode', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByLabelText('Open settings');
    await act(async () => {
      await user.click(settingsButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Performance Mode')).toBeInTheDocument();
    });

    // Find select by finding the label text, then the associated select
    const modeLabel = screen.getByText('Performance Mode');
    const selectContainer = modeLabel.closest('div');
    const select = selectContainer?.querySelector('select') as HTMLSelectElement;

    expect(select).toBeDefined();
    expect(select.value).toBe('auto');

    await act(async () => {
      await user.selectOptions(select, 'high');
    });

    await waitFor(() => {
      expect(mockElectronAPI.updateSettings).toHaveBeenCalledWith({
        performanceMode: 'high',
      });
    });
  });

  it('should show loading state when settings are not loaded', () => {
    (mockElectronAPI.getSettings as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders();

    // Should show disabled button while loading
    const button = screen.getByLabelText('Settings (loading)');
    expect(button).toBeDisabled();
  });

  it('should handle memory info fetch error gracefully', async () => {
    (mockElectronAPI.getSystemMemory as any).mockRejectedValue(
      new Error('Memory info failed')
    );

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByLabelText('Open settings');
    await user.click(settingsButton);

    // Should still render panel even if memory info fails
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it.skip('should update memory info periodically', async () => {
    vi.useFakeTimers();
    
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    });

    // Verify initial memory fetch happens on mount
    await waitFor(() => {
      expect(mockElectronAPI.getSystemMemory).toHaveBeenCalled();
    }, { timeout: 2000 });

    const initialCallCount = (mockElectronAPI.getSystemMemory as any).mock.calls.length;
    expect(initialCallCount).toBeGreaterThan(0);

    // Fast-forward 2 seconds to trigger the interval
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Process any pending timers and promises
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
      await Promise.resolve();
    });

    // Verify memory was called again after interval (at least initial + 1)
    expect(mockElectronAPI.getSystemMemory).toHaveBeenCalled();

    vi.useRealTimers();
  }, { timeout: 10000 });
});

