import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { WordEditor, WordEditorHandle } from './WordEditor';
import { mockElectronAPI } from '../../test-utils/mocks';

// Mock LexicalEditor
const mockLexicalEditorHandle = {
  getContent: vi.fn(() => '<p>Test content</p>'),
  setContent: vi.fn(),
  getTextContent: vi.fn(() => 'Test content'),
  focus: vi.fn(),
  isEditable: vi.fn(() => true),
  toggleBold: vi.fn(),
  toggleItalic: vi.fn(),
  toggleUnderline: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
};

// Store LexicalEditor props for testing
let lexicalEditorProps: any = null;

vi.mock('./LexicalEditor', () => ({
  LexicalEditor: React.forwardRef((props: any, ref: any) => {
    // Store props for testing
    lexicalEditorProps = props;

    // Use useImperativeHandle to properly set ref without causing React warnings
    React.useImperativeHandle(ref, () => mockLexicalEditorHandle, []);

    // Simulate content change
    React.useEffect(() => {
      if (props.onContentChange) {
        // Use setTimeout to simulate async behavior
        const timer = setTimeout(() => {
          props.onContentChange('<p>Test content</p>');
        }, 0);
        return () => clearTimeout(timer);
      }
    }, [props.onContentChange]);

    return <div data-testid="lexical-editor">Lexical Editor</div>;
  }),
}));

// Mock other components
vi.mock('./WordEditorToolbar', () => ({
  WordEditorToolbar: ({ onFontSizeChange, onAlignmentChange, onToggleBold, onToggleItalic, onToggleUnderline, onUndo, onRedo }: any) => (
    <div data-testid="toolbar">
      <button onClick={() => onFontSizeChange(18)}>Font Size</button>
      <button onClick={() => onAlignmentChange('center')}>Align</button>
      <button onClick={onToggleBold}>Bold</button>
      <button onClick={onToggleItalic}>Italic</button>
      <button onClick={onToggleUnderline}>Underline</button>
      <button onClick={onUndo}>Undo</button>
      <button onClick={onRedo}>Redo</button>
    </div>
  ),
}));

vi.mock('./NewFileConfirmationDialog', () => ({
  NewFileConfirmationDialog: ({ isOpen, onSave, onDiscard, onClose }: any) =>
    isOpen ? (
      <div data-testid="new-file-confirmation">
        <button onClick={onSave}>Save</button>
        <button onClick={onDiscard}>Discard</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock('./NewFileNameDialog', () => ({
  NewFileNameDialog: ({ isOpen, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="new-file-name">
        <input data-testid="file-name-input" />
        <button onClick={() => onConfirm('new-file.txt')}>Create</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

// Mock hooks
vi.mock('../../hooks/useWordEditorState', () => ({
  useWordEditorState: vi.fn(() => ({
    content: '',
    setContent: vi.fn(),
    hasUnsavedChanges: false,
    setHasUnsavedChanges: vi.fn(),
    fontSize: 14,
    setFontSize: vi.fn(),
    textAlign: 'left' as const,
    setTextAlign: vi.fn(),
    showNewFileDialog: false,
    setShowNewFileDialog: vi.fn(),
    showFileNameDialog: false,
    setShowFileNameDialog: vi.fn(),
    isLoading: false,
    setIsLoading: vi.fn(),
    isSaving: false,
    setIsSaving: vi.fn(),
  })),
}));

vi.mock('../../hooks/useEditorShortcuts', () => ({
  useEditorShortcuts: vi.fn(),
}));

// Mock toast
vi.mock('../Toast/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock debugLog
vi.mock('../../utils/debugLogger', () => ({
  debugLog: vi.fn(),
}));

describe('WordEditor', () => {
  let mockOnFilePathChange: ReturnType<typeof vi.fn>;
  let mockSetContent: ReturnType<typeof vi.fn>;
  let mockSetHasUnsavedChanges: ReturnType<typeof vi.fn>;
  let mockSetIsLoading: ReturnType<typeof vi.fn>;
  let mockSetIsSaving: ReturnType<typeof vi.fn>;
  let mockSetShowNewFileDialog: ReturnType<typeof vi.fn>;
  let mockSetShowFileNameDialog: ReturnType<typeof vi.fn>;
  let mockUseWordEditorState: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Don't use fake timers - waitFor needs real timers to work properly
    
    // Reset lexicalEditorProps before each test
    lexicalEditorProps = null;

    mockOnFilePathChange = vi.fn();
    mockSetContent = vi.fn();
    mockSetHasUnsavedChanges = vi.fn();
    mockSetIsLoading = vi.fn();
    mockSetIsSaving = vi.fn();
    mockSetShowNewFileDialog = vi.fn();
    mockSetShowFileNameDialog = vi.fn();

    // Reset mock implementations
    mockLexicalEditorHandle.getContent.mockReturnValue('<p>Test content</p>');
    mockLexicalEditorHandle.getTextContent.mockReturnValue('Test content');
    mockLexicalEditorHandle.isEditable.mockReturnValue(true);

    // Setup localStorage mock
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;

    // Get the mock function from the module
    const useWordEditorStateModule = await import('../../hooks/useWordEditorState');
    mockUseWordEditorState = vi.mocked(useWordEditorStateModule.useWordEditorState);
    mockUseWordEditorState.mockReturnValue({
      content: '',
      setContent: mockSetContent,
      hasUnsavedChanges: false,
      setHasUnsavedChanges: mockSetHasUnsavedChanges,
      fontSize: 14,
      setFontSize: vi.fn(),
      textAlign: 'left' as const,
      setTextAlign: vi.fn(),
      showNewFileDialog: false,
      setShowNewFileDialog: mockSetShowNewFileDialog,
      showFileNameDialog: false,
      setShowFileNameDialog: mockSetShowFileNameDialog,
      isLoading: false,
      setIsLoading: mockSetIsLoading,
      isSaving: false,
      setIsSaving: mockSetIsSaving,
    });

    (mockElectronAPI.readTextFile as any).mockResolvedValue('File content');
    (mockElectronAPI.saveTextFile as any).mockResolvedValue(undefined);
    (mockElectronAPI.createTextFile as any).mockResolvedValue('/path/to/new-file.txt');
    (mockElectronAPI.exportTextFile as any).mockResolvedValue({ success: true, filePath: '/path/to/exported.pdf' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render WordEditor with no file', () => {
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    });

    it('should render with file path', () => {
      render(<WordEditor filePath="/path/to/file.txt" onFilePathChange={mockOnFilePathChange} />);

      expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
    });
  });

  describe('File Loading', () => {
    it('should load text file when filePath is provided', async () => {
      (mockElectronAPI.readTextFile as any).mockResolvedValue('Plain text content');

      render(<WordEditor filePath="/path/to/file.txt" onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        expect(mockElectronAPI.readTextFile).toHaveBeenCalledWith('/path/to/file.txt');
      });

      await waitFor(() => {
        expect(mockSetIsLoading).toHaveBeenCalledWith(true);
      });
    });

    it('should wrap plain text in paragraph tags for .txt files', async () => {
      (mockElectronAPI.readTextFile as any).mockResolvedValue('Line 1\nLine 2');

      render(<WordEditor filePath="/path/to/file.txt" onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        expect(mockLexicalEditorHandle.setContent).toHaveBeenCalled();
        const callArg = mockLexicalEditorHandle.setContent.mock.calls[0][0];
        expect(callArg).toContain('<p>');
      });
    });

    it('should use HTML content as-is for non-.txt files', async () => {
      const htmlContent = '<p>HTML content</p>';
      (mockElectronAPI.readTextFile as any).mockResolvedValue(htmlContent);

      render(<WordEditor filePath="/path/to/file.html" onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        expect(mockLexicalEditorHandle.setContent).toHaveBeenCalledWith(htmlContent);
      });
    });

    it('should handle file not found error', async () => {
      const error = new Error('ENOENT: no such file');
      (mockElectronAPI.readTextFile as any).mockRejectedValue(error);

      render(<WordEditor filePath="/path/to/missing.txt" onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        expect(mockOnFilePathChange).toHaveBeenCalledWith(null);
      });
    });

    it('should not reload same file if filePath unchanged', async () => {
      const { rerender } = render(
        <WordEditor filePath="/path/to/file.txt" onFilePathChange={mockOnFilePathChange} />
      );

      await waitFor(() => {
        expect(mockElectronAPI.readTextFile).toHaveBeenCalledTimes(1);
      });

      rerender(<WordEditor filePath="/path/to/file.txt" onFilePathChange={mockOnFilePathChange} />);

      // Should not call again
      expect(mockElectronAPI.readTextFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Methods', () => {
    it('should expose getContent method', async () => {
      const ref = { current: null } as React.RefObject<WordEditorHandle>;
      render(<WordEditor ref={ref} filePath={null} onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      const content = ref.current!.getContent();
      expect(content).toBe('<p>Test content</p>');
    });

    it('should expose setContent method', async () => {
      const ref = { current: null } as React.RefObject<WordEditorHandle>;
      render(<WordEditor ref={ref} filePath={null} onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      ref.current!.setContent('<p>New content</p>');
      expect(mockLexicalEditorHandle.setContent).toHaveBeenCalledWith('<p>New content</p>');
    });

    it('should expose getTextContent method', async () => {
      const ref = { current: null } as React.RefObject<WordEditorHandle>;
      render(<WordEditor ref={ref} filePath={null} onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      const textContent = ref.current!.getTextContent();
      expect(textContent).toBe('Test content');
    });

    it('should expose focus method', async () => {
      const ref = { current: null } as React.RefObject<WordEditorHandle>;
      render(<WordEditor ref={ref} filePath={null} onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      ref.current!.focus();
      expect(mockLexicalEditorHandle.focus).toHaveBeenCalled();
    });

    it('should expose hasUnsavedChanges method', async () => {
      const ref = { current: null } as React.RefObject<WordEditorHandle>;
      mockUseWordEditorState.mockReturnValue({
        content: '',
        setContent: mockSetContent,
        hasUnsavedChanges: true,
        setHasUnsavedChanges: mockSetHasUnsavedChanges,
        fontSize: 14,
        setFontSize: vi.fn(),
        textAlign: 'left' as const,
        setTextAlign: vi.fn(),
        showNewFileDialog: false,
        setShowNewFileDialog: mockSetShowNewFileDialog,
        showFileNameDialog: false,
        setShowFileNameDialog: mockSetShowFileNameDialog,
        isLoading: false,
        setIsLoading: mockSetIsLoading,
        isSaving: false,
        setIsSaving: mockSetIsSaving,
      });

      render(
        <WordEditor ref={ref} filePath={null} onFilePathChange={mockOnFilePathChange} />
      );

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      expect(ref.current!.hasUnsavedChanges()).toBe(true);
    });

    it('should expose markAsSaved method', async () => {
      const ref = { current: null } as React.RefObject<WordEditorHandle>;
      render(<WordEditor ref={ref} filePath={null} onFilePathChange={mockOnFilePathChange} />);

      ref.current!.markAsSaved();

      // Wait for debounced state update
      await waitFor(() => {
        expect(mockSetHasUnsavedChanges).toHaveBeenCalledWith(false);
      }, { timeout: 2000 });
    });
  });

  describe('Save Operations', () => {
    it('should save as txt when Save button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<WordEditor filePath="/path/to/file.txt" onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        expect(saveButton).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockElectronAPI.saveTextFile).toHaveBeenCalledWith('/path/to/file.txt', 'Test content');
      });
    });

    it('should create new file when saving without filePath', async () => {
      const user = userEvent.setup({ delay: null });
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        expect(saveButton).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockElectronAPI.createTextFile).toHaveBeenCalled();
      });
    });

    it('should handle save error', async () => {
      const user = userEvent.setup({ delay: null });
      (mockElectronAPI.saveTextFile as any).mockRejectedValue(new Error('Save failed'));

      render(<WordEditor filePath="/path/to/file.txt" onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        expect(saveButton).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockElectronAPI.saveTextFile).toHaveBeenCalled();
      });
    });
  });

  describe('Formatting', () => {
    it('should handle font size change', async () => {
      const user = userEvent.setup({ delay: null });
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      const fontSizeButton = screen.getByText('Font Size');
      await user.click(fontSizeButton);

      // Should update font size
      await waitFor(() => {
        expect(mockSetHasUnsavedChanges).toHaveBeenCalled();
      });
    });

    it('should handle alignment change', async () => {
      const user = userEvent.setup({ delay: null });
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      const alignButton = screen.getByText('Align');
      await user.click(alignButton);

      await waitFor(() => {
        expect(mockSetHasUnsavedChanges).toHaveBeenCalled();
      });
    });

    it('should handle bold toggle', async () => {
      const user = userEvent.setup({ delay: null });
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      // Wait for editor to be ready
      await waitFor(() => {
        expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
      });

      const boldButton = screen.getByText('Bold');
      await user.click(boldButton);

      await waitFor(() => {
        expect(mockLexicalEditorHandle.toggleBold).toHaveBeenCalled();
      });
    });

    it('should handle italic toggle', async () => {
      const user = userEvent.setup({ delay: null });
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      // Wait for editor to be ready
      await waitFor(() => {
        expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
      });

      const italicButton = screen.getByText('Italic');
      await user.click(italicButton);

      await waitFor(() => {
        expect(mockLexicalEditorHandle.toggleItalic).toHaveBeenCalled();
      });
    });

    it('should handle underline toggle', async () => {
      const user = userEvent.setup({ delay: null });
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      // Wait for editor to be ready
      await waitFor(() => {
        expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
      });

      const underlineButton = screen.getByText('Underline');
      await user.click(underlineButton);

      await waitFor(() => {
        expect(mockLexicalEditorHandle.toggleUnderline).toHaveBeenCalled();
      });
    });

    it('should handle undo', async () => {
      const user = userEvent.setup({ delay: null });
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      // Wait for editor to be ready
      await waitFor(() => {
        expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
      });

      const undoButton = screen.getByText('Undo');
      await user.click(undoButton);

      await waitFor(() => {
        expect(mockLexicalEditorHandle.undo).toHaveBeenCalled();
      });
    });

    it('should handle redo', async () => {
      const user = userEvent.setup({ delay: null });
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      // Wait for editor to be ready
      await waitFor(() => {
        expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
      });

      const redoButton = screen.getByText('Redo');
      await user.click(redoButton);

      await waitFor(() => {
        expect(mockLexicalEditorHandle.redo).toHaveBeenCalled();
      });
    });
  });

  describe('New File Flow', () => {
    it('should show confirmation dialog when creating new file with unsaved changes', async () => {
      const user = userEvent.setup({ delay: null });
      mockUseWordEditorState.mockReturnValue({
        content: 'Some content',
        setContent: mockSetContent,
        hasUnsavedChanges: true,
        setHasUnsavedChanges: mockSetHasUnsavedChanges,
        fontSize: 14,
        setFontSize: vi.fn(),
        textAlign: 'left' as const,
        setTextAlign: vi.fn(),
        showNewFileDialog: false,
        setShowNewFileDialog: mockSetShowNewFileDialog,
        showFileNameDialog: false,
        setShowFileNameDialog: mockSetShowFileNameDialog,
        isLoading: false,
        setIsLoading: mockSetIsLoading,
        isSaving: false,
        setIsSaving: mockSetIsSaving,
      });

      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      const newButton = screen.getByText('New');
      await user.click(newButton);

      expect(mockSetShowNewFileDialog).toHaveBeenCalledWith(true);
    });

    it('should show file name dialog when creating new file without unsaved changes', async () => {
      const user = userEvent.setup({ delay: null });
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      const newButton = screen.getByText('New');
      await user.click(newButton);

      expect(mockSetShowFileNameDialog).toHaveBeenCalledWith(true);
    });
  });

  describe('Text Statistics', () => {
    it('should display word count', async () => {
      mockLexicalEditorHandle.getTextContent.mockReturnValue('Hello world test');
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      // Wait for stats to calculate (debounced)
      await waitFor(() => {
        // Word count should be displayed in status bar
        expect(screen.getByText(/word/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should display sentence count', async () => {
      mockLexicalEditorHandle.getTextContent.mockReturnValue('First sentence. Second sentence.');
      render(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      // Wait for stats to calculate (debounced)
      await waitFor(() => {
        expect(screen.getByText(/sentence/)).toBeInTheDocument();
      });
    });
  });

  describe('Content Changes', () => {
    it('should mark as unsaved when content changes', async () => {
      render(<WordEditor filePath="/path/to/file.txt" onFilePathChange={mockOnFilePathChange} />);

      // Wait for LexicalEditor to render and store props
      await waitFor(() => {
        expect(lexicalEditorProps).toBeTruthy();
        expect(lexicalEditorProps.onContentChange).toBeDefined();
      });

      // Simulate content change
      if (lexicalEditorProps?.onContentChange) {
        lexicalEditorProps.onContentChange('<p>New content</p>');
      }

      await waitFor(() => {
        expect(mockSetHasUnsavedChanges).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('File Path Changes', () => {
    it('should clear editor when filePath changes to null', async () => {
      const { rerender } = render(
        <WordEditor filePath="/path/to/file.txt" onFilePathChange={mockOnFilePathChange} />
      );

      await waitFor(() => {
        expect(mockElectronAPI.readTextFile).toHaveBeenCalled();
      });

      // Wait for editor ref to be set
      await waitFor(() => {
        expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
      });

      rerender(<WordEditor filePath={null} onFilePathChange={mockOnFilePathChange} />);

      await waitFor(() => {
        expect(mockLexicalEditorHandle.setContent).toHaveBeenCalledWith('');
      }, { timeout: 5000 });
    });
  });
});


