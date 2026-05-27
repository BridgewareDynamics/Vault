import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeScreen } from './WelcomeScreen';
import { SettingsProvider } from '../utils/settingsContext';
import { mockElectronAPI } from '../test-utils/mocks';

describe('WelcomeScreen', () => {
  const mockOnSelectFile = vi.fn();
  const mockOnOpenArchive = vi.fn();

  const renderWelcomeScreen = () =>
    render(
      <SettingsProvider>
        <WelcomeScreen
          onSelectFile={mockOnSelectFile}
          onOpenArchive={mockOnOpenArchive}
        />
      </SettingsProvider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = mockElectronAPI;
    mockElectronAPI.getSettings.mockResolvedValue({
      hardwareAcceleration: true,
      ramLimitMB: 2048,
      fullscreen: false,
      extractionQuality: 'high',
      thumbnailSize: 200,
      performanceMode: 'auto',
      showOnboarding: true,
      theme: 'brideware-purple',
    });
  });

  it('should render welcome title', () => {
    renderWelcomeScreen();
    expect(screen.getByText('Welcome to Vault')).toBeInTheDocument();
  });

  it('should render Select file button', () => {
    renderWelcomeScreen();
    expect(screen.getByText('Select file')).toBeInTheDocument();
  });

  it('should render The Vault button', () => {
    renderWelcomeScreen();
    expect(screen.getByText('The Vault')).toBeInTheDocument();
  });

  it('should call onSelectFile when Select file button is clicked', async () => {
    renderWelcomeScreen();
    
    const selectFileButton = screen.getByText('PDF to PNG').closest('button');
    if (!selectFileButton) {
      throw new Error('Select file button not found');
    }
    fireEvent.click(selectFileButton);
    
    expect(mockOnSelectFile).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenArchive when The Vault button is clicked', async () => {
    renderWelcomeScreen();
    
    const vaultButton = screen.getByText('The Vault').closest('button');
    if (!vaultButton) {
      throw new Error('The Vault button not found');
    }
    fireEvent.click(vaultButton);
    
    expect(mockOnOpenArchive).toHaveBeenCalledTimes(1);
  });

  it('should render PDF to PNG description', () => {
    renderWelcomeScreen();
    expect(screen.getByText('PDF to PNG')).toBeInTheDocument();
  });

  it('should render vault icon image', () => {
    renderWelcomeScreen();
    // The vault icon image should be rendered
    const vaultIcon = screen.getByAltText('The Vault');
    expect(vaultIcon).toBeInTheDocument();
    expect(vaultIcon).toHaveAttribute('src');
  });

  it('should render transcription card when handler is provided', () => {
    render(
      <SettingsProvider>
        <WelcomeScreen
          onSelectFile={mockOnSelectFile}
          onOpenArchive={mockOnOpenArchive}
          onOpenTranscription={vi.fn()}
        />
      </SettingsProvider>
    );

    expect(screen.getByText('Transcription')).toBeInTheDocument();
    expect(screen.getByText('Audio and video speech workflows for Vault case media')).toBeInTheDocument();
  });
});














