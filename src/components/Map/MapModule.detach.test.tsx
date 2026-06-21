import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapModule } from './MapModule';
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

vi.mock('./MapLandingPage', () => ({
  MapLandingPage: ({
    onPopOut,
    onReattach,
    hostMode,
  }: {
    onPopOut?: () => void;
    onReattach?: () => void;
    hostMode?: string;
  }) => (
    <div>
      <span>Map Landing</span>
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

vi.mock('./NewMapNameDialog', () => ({
  NewMapNameDialog: () => null,
}));

vi.mock('./MapLibraryPage', () => ({
  MapLibraryPage: () => <div>Map Library</div>,
}));

vi.mock('./MapEditorPage', () => ({
  MapEditorPage: () => <div>Map Editor</div>,
}));

vi.mock('../../utils/mapPrefetch', () => ({
  warmMapEntry: vi.fn(),
  prefetchMapLibrary: vi.fn(),
  prefetchMapEditorPage: vi.fn(),
  prefetchMapDocument: vi.fn(),
}));

vi.mock('../../utils/wordEditorSnapshot', () => ({
  collectWordEditorSnapshot: vi.fn().mockResolvedValue(undefined),
}));

describe('MapModule detach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = {
      ...mockElectronAPI,
      getArchiveConfig: vi.fn().mockResolvedValue({ archiveDrive: 'V:' }),
      createMapWindow: vi.fn().mockResolvedValue({ success: true }),
      reattachMapModule: vi.fn().mockResolvedValue({ success: true }),
    } as typeof mockElectronAPI;
  });

  it('calls createMapWindow and onPopOutComplete when popping out from main', async () => {
    const user = userEvent.setup();
    const onPopOutComplete = vi.fn();

    render(
      <MapModule
        theme="brideware-purple"
        hostMode="embedded"
        onExit={vi.fn()}
        onPopOutComplete={onPopOutComplete}
      />
    );

    await user.click(screen.getByRole('button', { name: /pop out/i }));

    await waitFor(() => {
      expect(window.electronAPI.createMapWindow).toHaveBeenCalledWith(
        expect.objectContaining({ screen: 'landing' })
      );
      expect(onPopOutComplete).toHaveBeenCalled();
    });
  });

  it('shows Dock to Vault in detached mode and calls reattachMapModule', async () => {
    const user = userEvent.setup();

    render(<MapModule theme="brideware-purple" hostMode="detached" onExit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /dock to vault/i }));

    await waitFor(() => {
      expect(window.electronAPI.reattachMapModule).toHaveBeenCalledWith(
        expect.objectContaining({ screen: 'landing' })
      );
    });
  });

  it('restores navigation state from initialNavigationState', async () => {
    render(
      <MapModule
        theme="brideware-purple"
        hostMode="embedded"
        onExit={vi.fn()}
        initialNavigationState={{
          screen: 'library',
          editorMapPath: null,
          editorDocument: null,
          autoEditTitleKey: null,
        }}
        onNavigationStateConsumed={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Map Library')).toBeInTheDocument();
    });
  });
});
