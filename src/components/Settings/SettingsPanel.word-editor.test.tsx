import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';

const mockSetWordEditorOpen = vi.fn();
const mockUseWordEditorState = {
  isOpen: false,
};

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      hardwareAcceleration: true,
      ramLimitMB: 2048,
      fullscreen: false,
      extractionQuality: 'high',
      thumbnailSize: 200,
      performanceMode: 'auto',
      theme: 'brideware-purple',
    },
    loading: false,
    toggleHardwareAcceleration: vi.fn(),
    toggleFullscreen: vi.fn(),
    setRamLimit: vi.fn(),
    setExtractionQuality: vi.fn(),
    setThumbnailSize: vi.fn(),
    setPerformanceMode: vi.fn(),
    updateSettings: vi.fn(),
  }),
}));

vi.mock('../Toast/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../../contexts/WordEditorContext', () => ({
  useWordEditor: () => ({
    isOpen: mockUseWordEditorState.isOpen,
    setIsOpen: mockSetWordEditorOpen,
  }),
}));

vi.mock('../WordEditor/WordEditorPanel', () => ({
  WordEditorPanel: ({ layoutMode = 'overlay' }: { layoutMode?: 'overlay' | 'inline' }) => (
    <div data-testid={`word-editor-panel-${layoutMode}`}>{layoutMode}</div>
  ),
}));

vi.mock('../WordEditor/WordEditorDialog', () => ({
  WordEditorDialog: () => null,
}));

describe('SettingsPanel word editor docking', () => {
  let inlineContainer: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWordEditorState.isOpen = false;
    inlineContainer = document.createElement('div');
    inlineContainer.id = 'map-word-editor-inline-container';
    document.body.appendChild(inlineContainer);
  });

  afterEach(() => {
    cleanup();
    inlineContainer.remove();
  });

  it('docks the shared editor into the map inline container on open', async () => {
    render(
      <SettingsPanel
        hideWordEditorButton={true}
        hideFixedButtons={true}
        inlineWordEditorContainerId="map-word-editor-inline-container"
      />
    );

    act(() => {
      window.dispatchEvent(new CustomEvent('open-word-editor-panel'));
    });

    await waitFor(() => {
      expect(within(inlineContainer).getByTestId('word-editor-panel-inline')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('word-editor-panel-overlay')).not.toBeInTheDocument();
    expect(mockSetWordEditorOpen).toHaveBeenCalledWith(true);
  });

  it('reattaches back into the inline map dock instead of forcing the overlay panel', async () => {
    render(
      <SettingsPanel
        hideWordEditorButton={true}
        hideFixedButtons={true}
        inlineWordEditorContainerId="map-word-editor-inline-container"
      />
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent('reattach-word-editor-data', {
          detail: {
            content: '<p>Draft timeline notes</p>',
            filePath: null,
            viewState: 'editor',
          },
        })
      );
    });

    await waitFor(() => {
      expect(within(inlineContainer).getByTestId('word-editor-panel-inline')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('word-editor-panel-overlay')).not.toBeInTheDocument();
    expect(mockSetWordEditorOpen).toHaveBeenCalledWith(true);
  });
});
