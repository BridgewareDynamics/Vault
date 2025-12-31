import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextLibrary } from './TextLibrary';
import { mockElectronAPI } from '../../test-utils/mocks';
import { ToastProvider } from '../Toast/ToastContext';

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
    (mockElectronAPI.listTextFiles as any).mockResolvedValue(mockFiles);
    (mockElectronAPI.deleteTextFile as any).mockResolvedValue(undefined);
  });

  it('should render loading state initially', () => {
    (mockElectronAPI.listTextFiles as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Loading files...')).toBeInTheDocument();
  });

  it('should load and display files', async () => {
    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('file2.txt')).toBeInTheDocument();
    });

    expect(mockElectronAPI.listTextFiles).toHaveBeenCalledTimes(1);
  });

  it('should render empty state when no files', async () => {
    (mockElectronAPI.listTextFiles as any).mockResolvedValue([]);

    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No text files yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first document')).toBeInTheDocument();
    });
  });

  it('should call onOpenFile when file is opened', async () => {
    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const openButtons = screen.getAllByText('Open');
    await userEvent.click(openButtons[0]);

    expect(mockOnOpenFile).toHaveBeenCalledWith('/path/to/file1.txt');
  });

  it('should call onNewFile when New button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    const newButton = screen.getByText('New');
    await user.click(newButton);

    expect(mockOnNewFile).toHaveBeenCalledTimes(1);
  });

  it('should call onNewFile when Create your first document is clicked', async () => {
    (mockElectronAPI.listTextFiles as any).mockResolvedValue([]);
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create your first document')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create your first document');
    await user.click(createButton);

    expect(mockOnNewFile).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />
      </ToastProvider>
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
    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
          onFileDeleted={mockOnFileDeleted}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockElectronAPI.deleteTextFile).toHaveBeenCalledWith('/path/to/file1.txt');
    });

    expect(mockElectronAPI.listTextFiles).toHaveBeenCalledTimes(2); // Initial load + after delete
  });

  it('should call onFileDeleted when file is deleted', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
          onFileDeleted={mockOnFileDeleted}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockOnFileDeleted).toHaveBeenCalledWith('/path/to/file1.txt');
    });
  });

  it('should handle delete error', async () => {
    const user = userEvent.setup();
    (mockElectronAPI.deleteTextFile as any).mockRejectedValue(new Error('Delete failed'));

    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const initialCallCount = (mockElectronAPI.listTextFiles as any).mock.calls.length;
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    // On delete error, the component doesn't reload files (only reloads on success)
    // So listTextFiles should still be called only once (initial load)
    await waitFor(() => {
      expect(mockElectronAPI.deleteTextFile).toHaveBeenCalled();
    });

    // Verify files are still displayed (not reloaded)
    expect(screen.getByText('file1.txt')).toBeInTheDocument();
    expect(mockElectronAPI.listTextFiles).toHaveBeenCalledTimes(initialCallCount);
  });

  it('should handle load files error', async () => {
    (mockElectronAPI.listTextFiles as any).mockRejectedValue(new Error('Load failed'));

    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />
      </ToastProvider>
    );

    // Should show empty state or error state
    await waitFor(() => {
      // Component should handle error gracefully
      expect(mockElectronAPI.listTextFiles).toHaveBeenCalled();
    });
  });

  it('should render in detached mode with different grid layout', async () => {
    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
          isDetached={true}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    // Check that files are rendered (layout is CSS, so we just verify items exist)
    const items = screen.getAllByTestId('library-item');
    expect(items.length).toBe(2);
  });

  it('should render in attached mode with different grid layout', async () => {
    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
          isDetached={false}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const items = screen.getAllByTestId('library-item');
    expect(items.length).toBe(2);
  });

  it('should not call onFileDeleted when prop is not provided', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    // Should not throw error even without onFileDeleted
    await waitFor(() => {
      expect(mockElectronAPI.deleteTextFile).toHaveBeenCalled();
    });
  });

  it('should work without electronAPI', async () => {
    const originalAPI = global.window.electronAPI;
    global.window.electronAPI = undefined as any;

    render(
      <ToastProvider>
        <TextLibrary
          onOpenFile={mockOnOpenFile}
          onNewFile={mockOnNewFile}
          onClose={mockOnClose}
        />
      </ToastProvider>
    );

    // Should not crash, just show empty or loading state
    await waitFor(() => {
      expect(screen.queryByText('Loading files...')).not.toBeInTheDocument();
    });

    global.window.electronAPI = originalAPI;
  });
});


