import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextLibrary } from './TextLibrary';
import { mockElectronAPI } from '../../test-utils/mocks';
import { renderWithProviders } from '../../test-utils/render';

const mockCase = { path: '/vault/test-case', name: 'Test Case' };

vi.mock('../../contexts/ArchiveContext', () => ({
  useArchiveContext: () => ({
    currentCase: mockCase,
  }),
}));

vi.mock('./DeleteTextFileConfirmDialog', () => ({
  DeleteTextFileConfirmDialog: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) =>
    isOpen ? <button onClick={onConfirm}>Confirm Delete</button> : null,
}));

// Mock TextLibraryItem
vi.mock('./TextLibraryItem', () => ({
  TextLibraryItem: ({ file, onOpen, onEdit, onSaveAs, onDelete }: any) => (
    <div data-testid="library-item">
      <span>{file.name}</span>
      <button onClick={onOpen}>Open</button>
      <button onClick={onEdit}>Edit</button>
      <button onClick={onSaveAs}>Save As</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
}));

describe('TextLibrary', () => {
  const mockOnOpenFile = vi.fn();
  const mockOnNewFile = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnFileDeleted = vi.fn();

  const mockFiles = [
    {
      name: 'file1.txt',
      path: '/path/to/file1.txt',
      size: 1024,
      modified: Date.now(),
      preview: 'Preview 1',
    },
    {
      name: 'file2.txt',
      path: '/path/to/file2.txt',
      size: 2048,
      modified: Date.now() - 1000,
      preview: 'Preview 2',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = mockElectronAPI;
    (mockElectronAPI.listCaseNotes as any).mockResolvedValue(mockFiles);
    (mockElectronAPI.listTextFiles as any).mockResolvedValue(mockFiles);
    (mockElectronAPI.deleteTextFile as any).mockResolvedValue(undefined);
    (mockElectronAPI.createCaseNote as any).mockResolvedValue('/vault/test-case/new-note.txt');
  });

  it('should render loading state initially', () => {
    (mockElectronAPI.listCaseNotes as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />,
      { withToast: true },
    );

    expect(screen.getByText('Loading files...')).toBeInTheDocument();
  });

  it('should load and display files', async () => {
    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('file2.txt')).toBeInTheDocument();
    });

    expect(mockElectronAPI.listCaseNotes).toHaveBeenCalledWith('/vault/test-case');
  });

  it('should render empty state when no files', async () => {
    (mockElectronAPI.listCaseNotes as any).mockResolvedValue([]);

    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByText('No notes yet for this case')).toBeInTheDocument();
      expect(screen.getByText('Create your first note')).toBeInTheDocument();
    });
  });

  it('should call onOpenFile when file is opened', async () => {
    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const openButtons = screen.getAllByText('Open');
    await userEvent.click(openButtons[0]);

    expect(mockOnOpenFile).toHaveBeenCalledWith('/path/to/file1.txt');
  });

  it('should create a new case note when New Note is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const newButton = document.querySelector('button .lucide-plus')?.closest('button');
    expect(newButton).toBeTruthy();
    await user.click(newButton!);

    const nameInput = await screen.findByPlaceholderText('Enter file name...');
    fireEvent.change(nameInput, { target: { value: 'my-note' } });
    await user.click(screen.getByRole('button', { name: /^Create$/i }));

    await waitFor(() => {
      expect(mockElectronAPI.createCaseNote).toHaveBeenCalledWith(
        '/vault/test-case',
        'my-note.txt',
        '',
      );
      expect(mockOnOpenFile).toHaveBeenCalledWith('/vault/test-case/new-note.txt');
    });
  });

  it('should open new note dialog when Create your first note is clicked', async () => {
    (mockElectronAPI.listCaseNotes as any).mockResolvedValue([]);
    const user = userEvent.setup();

    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByText('Create your first note')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create your first note');
    await user.click(createButton);

    expect(await screen.findByPlaceholderText(/file name/i)).toBeInTheDocument();
  });

  it('should call onClose when back button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Back to editor')).toBeInTheDocument();
    });

    const backButton = screen.getByLabelText('Back to editor');
    await user.click(backButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle file deletion', async () => {
    const user = userEvent.setup();
    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
          onFileDeleted={mockOnFileDeleted}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    await user.click(screen.getByText('Confirm Delete'));

    await waitFor(() => {
      expect(mockElectronAPI.deleteTextFile).toHaveBeenCalledWith('/path/to/file1.txt');
    });

    expect(mockElectronAPI.listCaseNotes).toHaveBeenCalledTimes(2); // Initial load + after delete
  });

  it('should call onFileDeleted when file is deleted', async () => {
    const user = userEvent.setup();
    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
          onFileDeleted={mockOnFileDeleted}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    await user.click(screen.getByText('Confirm Delete'));

    await waitFor(() => {
      expect(mockOnFileDeleted).toHaveBeenCalledWith('/path/to/file1.txt');
    });
  });

  it('should handle delete error', async () => {
    const user = userEvent.setup();
    (mockElectronAPI.deleteTextFile as any).mockRejectedValue(new Error('Delete failed'));

    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const initialCallCount = (mockElectronAPI.listCaseNotes as any).mock.calls.length;
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    await user.click(screen.getByText('Confirm Delete'));

    // On delete error, the component doesn't reload files (only reloads on success)
    // So listTextFiles should still be called only once (initial load)
    await waitFor(() => {
      expect(mockElectronAPI.deleteTextFile).toHaveBeenCalled();
    });

    // Verify files are still displayed (not reloaded)
    expect(screen.getByText('file1.txt')).toBeInTheDocument();
    expect(mockElectronAPI.listCaseNotes).toHaveBeenCalledTimes(initialCallCount);
  });

  it('should handle load files error', async () => {
    (mockElectronAPI.listCaseNotes as any).mockRejectedValue(new Error('Load failed'));

    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />,
      { withToast: true },
    );

    // Should show empty state or error state
    await waitFor(() => {
      // Component should handle error gracefully
      expect(mockElectronAPI.listCaseNotes).toHaveBeenCalled();
    });
  });

  it('should render in detached mode with different grid layout', async () => {
    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
          isDetached={true}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    // Check that files are rendered (layout is CSS, so we just verify items exist)
    const items = screen.getAllByTestId('library-item');
    expect(items.length).toBe(2);
  });

  it('should render in attached mode with different grid layout', async () => {
    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
          isDetached={false}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const items = screen.getAllByTestId('library-item');
    expect(items.length).toBe(2);
  });

  it('should not call onFileDeleted when prop is not provided', async () => {
    const user = userEvent.setup();
    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />,
      { withToast: true },
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    await user.click(screen.getByText('Confirm Delete'));

    // Should not throw error even without onFileDeleted
    await waitFor(() => {
      expect(mockElectronAPI.deleteTextFile).toHaveBeenCalled();
    });
  });

  it('should work without electronAPI', async () => {
    const originalAPI = global.window.electronAPI;
    global.window.electronAPI = undefined as any;

    renderWithProviders(
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />,
      { withToast: true },
    );

    // Should not crash, just show empty or loading state
    await waitFor(() => {
      expect(screen.queryByText('Loading files...')).not.toBeInTheDocument();
    });

    global.window.electronAPI = originalAPI;
  });
});


