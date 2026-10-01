import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileConverterModule } from './FileConverterModule';
import { mockElectronAPI } from '../../test-utils/mocks';

vi.mock('../Toast/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('./FileConverterLandingPage', () => ({
  FileConverterLandingPage: ({
    onPopOut,
    onReattach,
    hostMode,
  }: {
    onPopOut?: () => void;
    onReattach?: () => void;
    hostMode?: string;
  }) => (
    <div>
      <span>File Converter Landing</span>
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

vi.mock('./FileConverterWorkspacePage', () => ({
  FileConverterWorkspacePage: () => <div>File Converter Workspace</div>,
}));

vi.mock('../../utils/fileConverterPrefetch', () => ({
  warmFileConverterEntry: vi.fn(),
}));

describe('FileConverterModule detach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = {
      ...mockElectronAPI,
      createFileConverterWindow: vi.fn().mockResolvedValue({ success: true }),
      reattachFileConverterModule: vi.fn().mockResolvedValue({ success: true }),
    } as typeof mockElectronAPI;
  });

  it('calls createFileConverterWindow and onPopOutComplete when popping out', async () => {
    const user = userEvent.setup();
    const onPopOutComplete = vi.fn();

    render(
      <FileConverterModule
        theme="brideware-purple"
        hostMode="embedded"
        onExit={vi.fn()}
        onPopOutComplete={onPopOutComplete}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Pop out' }));

    await waitFor(() => {
      expect(window.electronAPI.createFileConverterWindow).toHaveBeenCalledWith({
        screen: 'landing',
        source: null,
        target: expect.objectContaining({ format: 'png' }),
        selectedCasePath: null,
      });
    });
    expect(onPopOutComplete).toHaveBeenCalled();
  });

  it('shows Dock to Vault in detached mode and calls reattachFileConverterModule', async () => {
    const user = userEvent.setup();

    render(
      <FileConverterModule theme="brideware-purple" hostMode="detached" onExit={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: 'Dock to Vault' }));

    await waitFor(() => {
      expect(window.electronAPI.reattachFileConverterModule).toHaveBeenCalledWith({
        screen: 'landing',
        source: null,
        target: expect.objectContaining({ format: 'png' }),
        selectedCasePath: null,
      });
    });
  });
});
