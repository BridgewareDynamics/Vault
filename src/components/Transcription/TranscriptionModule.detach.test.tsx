import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TranscriptionModule } from './TranscriptionModule';
import { mockElectronAPI } from '../../test-utils/mocks';

vi.mock('../Toast/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('./TranscriptionLandingPage', () => ({
  TranscriptionLandingPage: ({
    onPopOut,
    onReattach,
    hostMode,
  }: {
    onPopOut?: () => void;
    onReattach?: () => void;
    hostMode?: string;
  }) => (
    <div>
      <span>Transcript Landing</span>
      {hostMode === 'detached' ? (
        <button type="button" onClick={onReattach}>
          Dock to Vault
        </button>
      ) : (
        <button type="button" onClick={onPopOut}>
          Pop out
        </button>
      )}
    </div>
  ),
}));

vi.mock('./NewTranscriptionDialog', () => ({
  NewTranscriptionDialog: () => null,
}));

vi.mock('./TranscriptionLibraryPage', () => ({
  TranscriptionLibraryPage: () => <div>Transcript Library</div>,
}));

vi.mock('./TranscriptionWorkspacePage', () => ({
  TranscriptionWorkspacePage: () => <div>Transcript Workspace</div>,
}));

vi.mock('../Archive/CaseSelectionDialog', () => ({
  CaseSelectionDialog: () => null,
}));

vi.mock('../../utils/transcriptionPrefetch', () => ({
  warmTranscriptionEntry: vi.fn(),
}));

describe('TranscriptionModule detach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = {
      ...mockElectronAPI,
      getArchiveConfig: vi.fn().mockResolvedValue({ archiveDrive: 'V:' }),
      createTranscriptionWindow: vi.fn().mockResolvedValue({ success: true }),
      reattachTranscriptionModule: vi.fn().mockResolvedValue({ success: true }),
    } as typeof mockElectronAPI;
  });

  it('calls createTranscriptionWindow and onPopOutComplete when popping out', async () => {
    const user = userEvent.setup();
    const onPopOutComplete = vi.fn();

    render(
      <TranscriptionModule
        theme="brideware-purple"
        hostMode="embedded"
        onExit={vi.fn()}
        onPopOutComplete={onPopOutComplete}
      />
    );

    await user.click(screen.getByRole('button', { name: /pop out/i }));

    await waitFor(() => {
      expect(window.electronAPI.createTranscriptionWindow).toHaveBeenCalledWith(
        expect.objectContaining({ screen: 'landing' })
      );
      expect(onPopOutComplete).toHaveBeenCalled();
    });
  });

  it('shows Dock to Vault in detached mode and calls reattachTranscriptionModule', async () => {
    const user = userEvent.setup();

    render(
      <TranscriptionModule theme="brideware-purple" hostMode="detached" onExit={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /dock to vault/i }));

    await waitFor(() => {
      expect(window.electronAPI.reattachTranscriptionModule).toHaveBeenCalledWith(
        expect.objectContaining({ screen: 'landing' })
      );
    });
  });

  it('restores library screen from initialNavigationState', async () => {
    render(
      <TranscriptionModule
        theme="brideware-purple"
        hostMode="embedded"
        onExit={vi.fn()}
        initialNavigationState={{
          screen: 'library',
          workspacePath: null,
          workspaceDocument: null,
          launchSourcePath: null,
          launchCasePath: null,
        }}
        onNavigationStateConsumed={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Transcript Library')).toBeInTheDocument();
    });
  });
});
