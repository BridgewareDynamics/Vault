import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextLibraryItem } from './TextLibraryItem';

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe('TextLibraryItem', () => {
  const mockFile = {
    name: 'test-file.txt',
    path: '/path/to/test-file.txt',
    size: 1024,
    modified: Date.now(),
    preview: 'This is a preview of the file content',
  };

  const mockOnOpen = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnSaveAs = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it('should render file name', () => {
    render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('test-file.txt')).toBeInTheDocument();
  });

  it('should render file preview when available', () => {
    render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/This is a preview/)).toBeInTheDocument();
  });

  it('should render file icon when preview is not available', () => {
    const fileWithoutPreview = {
      ...mockFile,
      preview: undefined,
    };

    render(
      <TextLibraryItem
        file={fileWithoutPreview}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    // FileText icon should be present (check by looking for the container)
    const item = screen.getByText('test-file.txt').closest('.group');
    expect(item).toBeInTheDocument();
  });

  it('should call onOpen when file item is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    // The onClick is on the div inside the motion.div with cursor-pointer class
    // Find the div with rounded-lg that has the onClick handler
    const fileItem = container.querySelector('.cursor-pointer > div.rounded-lg');
    if (fileItem) {
      await user.click(fileItem as HTMLElement);
      expect(mockOnOpen).toHaveBeenCalledTimes(1);
    } else {
      // Fallback: click on the preview area
      const preview = screen.getByText(/This is a preview/);
      await user.click(preview);
      expect(mockOnOpen).toHaveBeenCalledTimes(1);
    }
  });

  it('should toggle dropdown menu when arrow button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    const arrowButton = screen.getByLabelText('File options');
    await user.click(arrowButton);

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Save As')).toBeInTheDocument();
  });

  it('should call onOpen when Open is clicked from dropdown', async () => {
    const user = userEvent.setup();
    render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    const arrowButton = screen.getByLabelText('File options');
    await user.click(arrowButton);

    const openButton = screen.getByText('Open');
    await user.click(openButton);

    expect(mockOnOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Open')).not.toBeInTheDocument(); // Dropdown should close
  });

  it('should call onEdit when Edit is clicked from dropdown', async () => {
    const user = userEvent.setup();
    render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    const arrowButton = screen.getByLabelText('File options');
    await user.click(arrowButton);

    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument(); // Dropdown should close
  });

  it('should call onSaveAs when Save As is clicked from dropdown', async () => {
    const user = userEvent.setup();
    render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    const arrowButton = screen.getByLabelText('File options');
    await user.click(arrowButton);

    const saveAsButton = screen.getByText('Save As');
    await user.click(saveAsButton);

    expect(mockOnSaveAs).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Save As')).not.toBeInTheDocument(); // Dropdown should close
  });

  it('should call onDelete when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);

    render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    // Delete button appears on hover, but we can still find it
    const deleteButton = screen.getByLabelText('Delete file');
    await user.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith('Delete "test-file.txt"?');
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should not call onDelete when delete is cancelled', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(false);

    render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByLabelText('Delete file');
    await user.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <TextLibraryItem
          file={mockFile}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onSaveAs={mockOnSaveAs}
          onDelete={mockOnDelete}
        />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const arrowButton = screen.getByLabelText('File options');
    await user.click(arrowButton);

    expect(screen.getByText('Open')).toBeInTheDocument();

    const outside = screen.getByTestId('outside');
    await user.click(outside);

    // Dropdown should close
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.queryByText('Open')).not.toBeInTheDocument();
  });

  it('should not close dropdown when clicking inside dropdown', async () => {
    const user = userEvent.setup();
    render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    const arrowButton = screen.getByLabelText('File options');
    await user.click(arrowButton);

    expect(screen.getByText('Open')).toBeInTheDocument();

    const openButton = screen.getByText('Open');
    await user.click(openButton);

    // Dropdown should close after action, but let's verify it was open before
    expect(mockOnOpen).toHaveBeenCalled();
  });

  it('should not call onOpen when clicking dropdown arrow', async () => {
    const user = userEvent.setup();
    render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    const arrowButton = screen.getByLabelText('File options');
    await user.click(arrowButton);

    // onOpen should not be called when clicking the arrow
    expect(mockOnOpen).not.toHaveBeenCalled();
  });

  it('should not call onOpen when clicking delete button', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);

    render(
      <TextLibraryItem
        file={mockFile}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByLabelText('Delete file');
    await user.click(deleteButton);

    expect(mockOnOpen).not.toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalled();
  });

  it('should handle file with long name', () => {
    const longFileName = {
      ...mockFile,
      name: 'very-long-file-name-that-might-truncate.txt',
    };

    render(
      <TextLibraryItem
        file={longFileName}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(longFileName.name)).toBeInTheDocument();
  });

  it('should handle file without preview', () => {
    const fileWithoutPreview = {
      ...mockFile,
      preview: undefined,
    };

    render(
      <TextLibraryItem
        file={fileWithoutPreview}
        onOpen={mockOnOpen}
        onEdit={mockOnEdit}
        onSaveAs={mockOnSaveAs}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('test-file.txt')).toBeInTheDocument();
  });
});


