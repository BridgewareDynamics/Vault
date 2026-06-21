import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MapDocument } from '../../types';
import { MapEditorPage } from './MapEditorPage';

const mockUpdateDocument = vi.fn();
const mockSaveNow = vi.fn();
const mockRelayout = vi.fn();
let latestMapCanvasProps: Record<string, unknown> | null = null;

let mockDocument: MapDocument;
let mockWordEditorState = {
  isOpen: false,
  dividerPosition: 62,
  setDividerPosition: vi.fn(),
  isDividerDragging: false,
};

vi.mock('../../hooks/useMapDocument', () => ({
  useMapDocument: () => ({
    document: mockDocument,
    loading: false,
    saving: false,
    dirty: false,
    updateDocument: mockUpdateDocument,
    saveNow: mockSaveNow,
    relayout: mockRelayout,
  }),
}));

vi.mock('../../contexts/WordEditorContext', () => ({
  useWordEditor: () => mockWordEditorState,
}));

vi.mock('../Toast/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('./mapTheme', () => ({
  useMapTheme: () => ({
    bg: 'bg-gray-950',
    card: 'bg-gray-900 text-white border-white/10',
    button: 'bg-purple-600 text-white',
    heading: 'text-white',
    body: 'text-gray-100',
    muted: 'text-gray-400',
    primary: 'text-cyan-300',
    isPastel: false,
  }),
}));

vi.mock('./MapCanvas', () => ({
  MapCanvas: (props: Record<string, unknown>) => {
    latestMapCanvasProps = props;
    return <div data-testid="map-canvas">Canvas</div>;
  },
}));

vi.mock('./CreateBlockDialog', () => ({
  CreateBlockDialog: () => null,
}));

vi.mock('./BlockExpandModal', () => ({
  BlockExpandModal: () => null,
}));

vi.mock('./MapExportDialog', () => ({
  MapExportDialog: () => null,
}));

vi.mock('./DeleteBlockDialog', () => ({
  DeleteBlockDialog: () => null,
}));

vi.mock('../Archive/CaseSelectionDialog', () => ({
  CaseSelectionDialog: () => null,
}));

describe('MapEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    latestMapCanvasProps = null;
    mockWordEditorState = {
      isOpen: false,
      dividerPosition: 62,
      setDividerPosition: vi.fn(),
      isDividerDragging: false,
    };
    mockDocument = {
      id: 'map-1',
      title: 'Timeline Workspace',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      casePath: null,
      mapFolderPath: 'P:/Vault/Maps/map-1',
      blocks: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      layoutMode: 'timeline-vertical',
      defaultEdgeStyle: 'solid',
    };
  });

  it('opens the shared word editor panel from the map header', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <MapEditorPage
        theme="brideware-purple"
        mapFolderPath={mockDocument.mapFolderPath}
        onBack={vi.fn()}
        onHome={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /word editor/i }));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'open-word-editor-panel' })
    );
  });

  it('shows the inline editor dock layout and can close it from the same button', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    mockWordEditorState.isOpen = true;

    render(
      <MapEditorPage
        theme="brideware-purple"
        mapFolderPath={mockDocument.mapFolderPath}
        onBack={vi.fn()}
        onHome={vi.fn()}
      />
    );

    expect(screen.getByRole('separator', { name: 'Resize divider' })).toBeInTheDocument();
    expect(document.getElementById('map-word-editor-inline-container')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /word editor/i })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /word editor/i }));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'close-word-editor-panel' })
    );
  });

  it('updates the document when connector appearance changes from the canvas tools', () => {
    render(
      <MapEditorPage
        theme="brideware-purple"
        mapFolderPath={mockDocument.mapFolderPath}
        onBack={vi.fn()}
        onHome={vi.fn()}
      />
    );

    expect(latestMapCanvasProps).not.toBeNull();

    const onEdgeAppearanceChange = latestMapCanvasProps?.onEdgeAppearanceChange as
      | ((appearance: { colorMode: 'theme' | 'custom' | 'linked-blocks'; strokeColor?: string; glowColor?: string }) => void)
      | undefined;

    onEdgeAppearanceChange?.({
      colorMode: 'linked-blocks',
      strokeColor: '#A855F7',
      glowColor: '#14B8A6',
    });

    expect(mockUpdateDocument).toHaveBeenCalledWith(expect.any(Function));
  });
});
