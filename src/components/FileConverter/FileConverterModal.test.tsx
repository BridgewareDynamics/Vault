import { describe, it, expect, vi, beforeEach } from 'vitest';
import type React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileConverterWorkspacePage } from './FileConverterWorkspacePage';
import { SettingsProvider } from '../../utils/settingsContext';
import { ToastProvider } from '../Toast/ToastContext';
import { mockElectronAPI } from '../../test-utils/mocks';

function renderWorkspace(ui: React.ReactElement) {
  return render(
    <SettingsProvider>
      <ToastProvider>{ui}</ToastProvider>
    </SettingsProvider>
  );
}

describe('FileConverterWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = mockElectronAPI;
    mockElectronAPI.getSettings.mockResolvedValue({
      theme: 'brideware-purple',
    });
    mockElectronAPI.getConverterCapabilities.mockResolvedValue({
      inputExtensions: ['.png', '.pdf', '.mp4'],
      matrix: {
        image: ['png', 'jpeg', 'webp'],
        pdf: ['png', 'jpeg'],
        video: ['mp4', 'webm'],
        gif: ['png', 'mp4'],
      },
    });
  });

  it('renders conversion studio', () => {
    renderWorkspace(
      <FileConverterWorkspacePage theme="brideware-purple" onBack={vi.fn()} onExit={vi.fn()} />
    );
    expect(screen.getByText('File Converter')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run conversion' })).toBeDisabled();
  });

  it('calls onBack when landing button clicked', () => {
    const onBack = vi.fn();
    renderWorkspace(
      <FileConverterWorkspacePage theme="brideware-purple" onBack={onBack} onExit={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Landing' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('calls onExit when home button clicked', () => {
    const onExit = vi.fn();
    renderWorkspace(
      <FileConverterWorkspacePage theme="brideware-purple" onBack={vi.fn()} onExit={onExit} />
    );
    fireEvent.click(screen.getByLabelText('Back to home'));
    expect(onExit).toHaveBeenCalled();
  });
});
