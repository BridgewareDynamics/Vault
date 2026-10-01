import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NovelModule } from './NovelModule';
import { mockElectronAPI } from '../../test-utils/mocks';

vi.mock('../Toast/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../../contexts/WordEditorContext', () => ({
  useWordEditor: () => ({ isOpen: false }),
}));

vi.mock('./NovelLandingPage', () => ({
  NovelLandingPage: ({
    onPopOut,
    onReattach,
    hostMode,
  }: {
    onPopOut?: () => void;
    onReattach?: () => void;
    hostMode?: string;
  }) => (
    <div>
      <span>Novel Landing</span>
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

vi.mock('./NewNovelDialog', () => ({
  NewNovelDialog: () => null,
}));

vi.mock('./NovelLibraryPage', () => ({
  NovelLibraryPage: () => <div>Novel Library</div>,
}));

vi.mock('./NovelEditorPage', () => ({
  NovelEditorPage: () => <div>Novel Editor</div>,
}));

vi.mock('../../utils/novelPrefetch', () => ({
  warmNovelEntry: vi.fn(),
  prefetchNovelLibrary: vi.fn(),
  prefetchNovelEditorPage: vi.fn(),
  prefetchNovelDocument: vi.fn(),
  setCachedNovelLibrary: vi.fn(),
}));

vi.mock('../../utils/wordEditorSnapshot', () => ({
  collectWordEditorSnapshot: vi.fn().mockResolvedValue(undefined),
}));

describe('NovelModule detach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = {
      ...mockElectronAPI,
      getArchiveConfig: vi.fn().mockResolvedValue({ archiveDrive: 'V:' }),
      createNovelWindow: vi.fn().mockResolvedValue({ success: true }),
      reattachNovelModule: vi.fn().mockResolvedValue({ success: true }),
    } as typeof mockElectronAPI;
  });

  it('calls createNovelWindow and onPopOutComplete when popping out from main', async () => {
    const user = userEvent.setup();
    const onPopOutComplete = vi.fn();

    render(
      <NovelModule
        theme="brideware-purple"
        hostMode="embedded"
        onExit={vi.fn()}
        onPopOutComplete={onPopOutComplete}
      />
    );

    await user.click(screen.getByRole('button', { name: /pop out/i }));

    await waitFor(() => {
      expect(window.electronAPI.createNovelWindow).toHaveBeenCalledWith(
        expect.objectContaining({ screen: 'landing' })
      );
      expect(onPopOutComplete).toHaveBeenCalled();
    });
  });

  it('restores navigation state from initialNavigationState', async () => {
    render(
      <NovelModule
        theme="brideware-purple"
        hostMode="embedded"
        onExit={vi.fn()}
        initialNavigationState={{
          screen: 'library',
          editorNovelPath: null,
          editorDocument: null,
          currentSpreadIndex: 0,
        }}
        onNavigationStateConsumed={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Novel Library')).toBeInTheDocument();
    });
  });
});
