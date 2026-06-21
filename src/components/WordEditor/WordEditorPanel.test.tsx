import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { WordEditorPanel } from './WordEditorPanel';
import { mockElectronAPI } from '../../test-utils/mocks';
import { renderWithProviders, setupTestSettings } from '../../test-utils/render';

// Mock WordEditor
let mockWordEditorHandle = {
  getContent: vi.fn(() => '<p>Content</p>'),
  setContent: vi.fn(),
  getTextContent: vi.fn(() => 'Content'),
  focus: vi.fn(),
  hasUnsavedChanges: vi.fn(() => false),
  markAsSaved: vi.fn(),
};

// Mock WordEditor with useImperativeHandle - standard React pattern
vi.mock('./WordEditor', () => ({
  WordEditor: React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => mockWordEditorHandle);
    return <div data-testid="word-editor">Editor Content</div>;
  }),
}));

// Mock other components
vi.mock('./TextLibrary', () => ({
  TextLibrary: ({ onOpenFile, onNewFile, onClose, onFileDeleted }: any) => (
    <div data-testid="text-library">
      <button onClick={() => onOpenFile('/path/to/file.txt')}>Open File</button>
      <button onClick={onNewFile}>New File</button>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onFileDeleted('/path/to/file.txt')}>Delete File</button>
    </div>
  ),
}));

vi.mock('./WordEditorErrorBoundary', () => ({
  WordEditorErrorBoundary: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('./UnsavedChangesDialog', () => ({
  UnsavedChangesDialog: ({ isOpen, onSave, onDiscard, onCancel }: any) =>
    isOpen ? (
      <div data-testid="unsaved-dialog">
        <button onClick={onSave}>Save</button>
        <button onClick={onDiscard}>Discard</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock('../Toast/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock WordEditorContext
const mockSetIsOpen = vi.fn();
const mockSetPanelWidth = vi.fn();
vi.mock('../../contexts/WordEditorContext', () => ({
  useWordEditor: () => ({
    setIsOpen: mockSetIsOpen,
    panelWidth: 500,
    setPanelWidth: mockSetPanelWidth,
    dividerPosition: 50,
    setDividerPosition: vi.fn(),
    isDividerDragging: false,
    setIsDividerDragging: vi.fn(),
  }),
}));

vi.mock('../../contexts/ArchiveContext', () => ({
  useArchiveContext: () => ({
    currentCase: { path: '/vault/test-case', name: 'Test Case' },
  }),
}));

describe('WordEditorPanel', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setupTestSettings();

    // Reset mock handle to ensure clean state
    mockWordEditorHandle = {
      getContent: vi.fn(() => '<p>Content</p>'),
      setContent: vi.fn(),
      getTextContent: vi.fn(() => 'Content'),
      focus: vi.fn(),
      hasUnsavedChanges: vi.fn(() => false),
      markAsSaved: vi.fn(),
    };

    window.electronAPI = mockElectronAPI;
    mockOnClose = vi.fn();
    (mockElectronAPI.createWordEditorWindow as any).mockResolvedValue(undefined);
    (mockElectronAPI.saveTextFile as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Panel Visibility', () => {
    it('should not render when isOpen is false', () => {
      renderWithProviders(<WordEditorPanel isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText('Word Editor')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('Word Editor')).toBeInTheDocument();
      expect(screen.getByTestId('word-editor')).toBeInTheDocument();
    });

    it('should update context when isOpen changes', () => {
      const { rerender } = renderWithProviders(<WordEditorPanel isOpen={false} onClose={mockOnClose} />);

      rerender(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      expect(mockSetIsOpen).toHaveBeenCalledWith(true);
    });
  });

  describe('Initial File Path', () => {
    it('should set initial file path', () => {
      renderWithProviders(
        <WordEditorPanel
          isOpen={true}
          onClose={mockOnClose}
          initialFilePath="/path/to/initial.txt"
        />
      );

      // File path should be set (tested via WordEditor receiving it)
      expect(screen.getByTestId('word-editor')).toBeInTheDocument();
    });

    it('should update file path when initialFilePath changes', () => {
      const { rerender } = renderWithProviders(
        <WordEditorPanel
          isOpen={true}
          onClose={mockOnClose}
          initialFilePath="/path/to/file1.txt"
        />
      );

      rerender(
        <WordEditorPanel
          isOpen={true}
          onClose={mockOnClose}
          initialFilePath="/path/to/file2.txt"
        />
      );

      // File path should update
      expect(screen.getByTestId('word-editor')).toBeInTheDocument();
    });
  });

  describe('Library Toggle', () => {
    it('should show library when library button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      const libraryButton = screen.getByLabelText('Open text library');
      await user.click(libraryButton);

      expect(screen.getByTestId('text-library')).toBeInTheDocument();
      expect(screen.queryByTestId('word-editor')).not.toBeInTheDocument();
    });

    it('should open library if openLibrary prop is true', () => {
      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} openLibrary={true} />);

      expect(screen.getByTestId('text-library')).toBeInTheDocument();
    });
  });

  describe('Detach Functionality', () => {
    it('should detach to separate window', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      const detachButton = screen.getByLabelText('Detach editor to separate window');
      await user.click(detachButton);

      await waitFor(() => {
        expect(mockElectronAPI.createWordEditorWindow).toHaveBeenCalledWith({
          content: '<p>Content</p>',
          filePath: null,
          viewState: 'editor',
          casePath: '/vault/test-case',
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should detach with current file path', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(
        <WordEditorPanel
          isOpen={true}
          onClose={mockOnClose}
          initialFilePath="/path/to/file.txt"
        />
      );

      const detachButton = screen.getByLabelText('Detach editor to separate window');
      await user.click(detachButton);

      await waitFor(() => {
        expect(mockElectronAPI.createWordEditorWindow).toHaveBeenCalledWith({
          content: '<p>Content</p>',
          filePath: '/path/to/file.txt',
          viewState: 'editor',
          casePath: '/vault/test-case',
        });
      });
    });

    it('should handle detach error', async () => {
      const user = userEvent.setup({ delay: null });
      (mockElectronAPI.createWordEditorWindow as any).mockRejectedValue(new Error('Detach failed'));

      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      const detachButton = screen.getByLabelText('Detach editor to separate window');
      await user.click(detachButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockElectronAPI.createWordEditorWindow).toHaveBeenCalled();
      });
    });

    it('should handle missing electronAPI', async () => {
      const user = userEvent.setup({ delay: null });
      const originalAPI = window.electronAPI;

      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);
      delete (window as any).electronAPI;

      const detachButton = screen.getByLabelText('Detach editor to separate window');
      await user.click(detachButton);

      // Should not crash or attempt detach without API
      expect(mockElectronAPI.createWordEditorWindow).not.toHaveBeenCalled();

      window.electronAPI = originalAPI;
    });
  });

  describe('Close Functionality', () => {
    it('should close panel when close button is clicked without unsaved changes', async () => {
      const user = userEvent.setup({ delay: null });
      mockWordEditorHandle.hasUnsavedChanges.mockReturnValue(false);

      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close editor');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should show unsaved dialog when closing with unsaved changes', async () => {
      const user = userEvent.setup({ delay: null });
      mockWordEditorHandle.hasUnsavedChanges.mockReturnValue(true);

      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close editor');
      await user.click(closeButton);

      expect(screen.getByTestId('unsaved-dialog')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should save and close when Save is clicked in dialog', async () => {
      const user = userEvent.setup({ delay: null });
      mockWordEditorHandle.hasUnsavedChanges.mockReturnValue(true);

      renderWithProviders(
        <WordEditorPanel
          isOpen={true}
          onClose={mockOnClose}
          initialFilePath="/path/to/file.txt"
        />
      );

      const closeButton = screen.getByLabelText('Close editor');
      await user.click(closeButton);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockElectronAPI.saveTextFile).toHaveBeenCalledWith('/path/to/file.txt', 'Content');
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should discard and close when Discard is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      mockWordEditorHandle.hasUnsavedChanges.mockReturnValue(true);

      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close editor');
      await user.click(closeButton);

      const discardButton = screen.getByText('Discard');
      await user.click(discardButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should cancel close when Cancel is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      mockWordEditorHandle.hasUnsavedChanges.mockReturnValue(true);

      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close editor');
      await user.click(closeButton);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.queryByTestId('unsaved-dialog')).not.toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('File Operations', () => {
    it('should open file from library', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      const libraryButton = screen.getByLabelText('Open text library');
      await user.click(libraryButton);

      const openFileButton = screen.getByText('Open File');
      await user.click(openFileButton);

      expect(screen.queryByTestId('text-library')).not.toBeInTheDocument();
      expect(screen.getByTestId('word-editor')).toBeInTheDocument();
    });

    it('should create new file from library', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Open text library')).toBeInTheDocument();
      });

      const libraryButton = screen.getByLabelText('Open text library');
      await user.click(libraryButton);

      await waitFor(() => {
        expect(screen.getByText('New File')).toBeInTheDocument();
      });

      const newFileButton = screen.getByText('New File');
      await user.click(newFileButton);

      await waitFor(() => {
        expect(screen.queryByTestId('text-library')).not.toBeInTheDocument();
      });
    });

    it('should handle file deletion', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(
        <WordEditorPanel
          isOpen={true}
          onClose={mockOnClose}
          initialFilePath="/path/to/file.txt"
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Open text library')).toBeInTheDocument();
      });

      const libraryButton = screen.getByLabelText('Open text library');
      await user.click(libraryButton);

      await waitFor(() => {
        expect(screen.getByText('Delete File')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete File');
      await user.click(deleteButton);

      // Library remains open after delete; editor remounts when returning from library
      expect(screen.getByTestId('text-library')).toBeInTheDocument();
    });
  });

  describe('Reattach Handling', () => {
    it('should handle reattach event from detached window', async () => {
      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('word-editor')).toBeInTheDocument();
      });

      const event = new CustomEvent('reattach-word-editor-data', {
        detail: {
          content: '<p>Reattached content</p>',
          filePath: '/path/to/reattached.txt',
        },
      });

      window.dispatchEvent(event);

      // Content should be set (wait for debounced handler)
      await waitFor(() => {
        expect(mockWordEditorHandle.setContent).toHaveBeenCalledWith('<p>Reattached content</p>');
      }, { timeout: 2000 });
      expect(mockWordEditorHandle.markAsSaved).toHaveBeenCalled();
    });

    it('should handle reattach event without filePath', async () => {
      renderWithProviders(<WordEditorPanel isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('word-editor')).toBeInTheDocument();
      });

      const event = new CustomEvent('reattach-word-editor-data', {
        detail: {
          content: '<p>Reattached content</p>',
        },
      });

      window.dispatchEvent(event);

      // Wait for debounced handler
      await waitFor(() => {
        expect(mockWordEditorHandle.setContent).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle save error gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      mockWordEditorHandle.hasUnsavedChanges.mockReturnValue(true);
      (mockElectronAPI.saveTextFile as any).mockRejectedValue(new Error('Save failed'));

      renderWithProviders(
        <WordEditorPanel
          isOpen={true}
          onClose={mockOnClose}
          initialFilePath="/path/to/file.txt"
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Close editor')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close editor');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      // Should handle error and not close
      await waitFor(() => {
        expect(mockElectronAPI.saveTextFile).toHaveBeenCalled();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});



