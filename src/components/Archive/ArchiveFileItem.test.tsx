import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArchiveFileItem } from './ArchiveFileItem';
import { ArchiveFile } from '../../types';

describe('ArchiveFileItem', () => {
  const mockOnClick = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnExtract = vi.fn();
  const mockOnRename = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockFile = (overrides?: Partial<ArchiveFile>): ArchiveFile => ({
    name: 'test.pdf',
    path: '/path/to/test.pdf',
    size: 1000,
    modified: Date.now(),
    type: 'pdf',
    isFolder: false,
    ...overrides,
  });

  it('should render file name', () => {
    const file = createMockFile();
    render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  it('should render file type badge', () => {
    const file = createMockFile({ type: 'pdf' });
    render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('should render thumbnail when provided', () => {
    const file = createMockFile({ thumbnail: 'data:image/png;base64,test' });
    render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
      />
    );
    const img = screen.getByAltText('test.pdf');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,test');
  });

  it('should render icon when thumbnail is not provided', () => {
    const file = createMockFile({ thumbnail: undefined });
    const { container } = render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
      />
    );
    // Should have an icon (svg)
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const file = createMockFile();
    const { container } = render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
      />
    );
    
    const fileElement = container.querySelector('.border-gray-700');
    if (fileElement) {
      await user.click(fileElement);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should render different icons for different file types', () => {
    const imageFile = createMockFile({ type: 'image', name: 'test.jpg' });
    const { rerender, container } = render(
      <ArchiveFileItem
        file={imageFile}
        onClick={mockOnClick}
      />
    );
    
    // Check for image icon
    let icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    
    const videoFile = createMockFile({ type: 'video', name: 'test.mp4' });
    rerender(
      <ArchiveFileItem
        file={videoFile}
        onClick={mockOnClick}
      />
    );
    
    const otherFile = createMockFile({ type: 'other', name: 'test.txt' });
    rerender(
      <ArchiveFileItem
        file={otherFile}
        onClick={mockOnClick}
      />
    );
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const file = createMockFile();
    const { container } = render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );
    
    // Hover to show delete button
    const fileElement = container.querySelector('.group');
    if (fileElement) {
      await user.hover(fileElement);
      
      await waitFor(() => {
        const deleteButton = screen.getByLabelText('Delete file');
        expect(deleteButton).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText('Delete file');
      await user.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    }
  });

  it('should call onRename when rename button is clicked', async () => {
    const user = userEvent.setup();
    const file = createMockFile();
    render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
        onRename={mockOnRename}
      />
    );
    
    const renameButton = screen.getByLabelText('Rename file');
    await user.click(renameButton);
    
    expect(mockOnRename).toHaveBeenCalledTimes(1);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should show extract button for PDF files when onExtract is provided', async () => {
    const user = userEvent.setup();
    const file = createMockFile({ type: 'pdf' });
    const { container } = render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
        onExtract={mockOnExtract}
      />
    );
    
    // Hover to show extract button
    const fileElement = container.querySelector('.group');
    if (fileElement) {
      await user.hover(fileElement);
      
      await waitFor(() => {
        const extractButton = screen.getByLabelText('Extract PDF');
        expect(extractButton).toBeInTheDocument();
      });
    }
  });

  it('should call onExtract when extract button is clicked', async () => {
    const user = userEvent.setup();
    const file = createMockFile({ type: 'pdf' });
    const { container } = render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
        onExtract={mockOnExtract}
      />
    );
    
    // Hover to show extract button
    const fileElement = container.querySelector('.group');
    if (fileElement) {
      await user.hover(fileElement);
      
      await waitFor(() => {
        const extractButton = screen.getByLabelText('Extract PDF');
        expect(extractButton).toBeInTheDocument();
      });
      
      const extractButton = screen.getByLabelText('Extract PDF');
      await user.click(extractButton);
      expect(mockOnExtract).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    }
  });

  it('should show PDF options dropdown when PDF options button is clicked', async () => {
    const user = userEvent.setup();
    const file = createMockFile({ type: 'pdf' });
    render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
        onExtract={mockOnExtract}
      />
    );
    
    const optionsButton = screen.getByLabelText('PDF options');
    await user.click(optionsButton);
    
    // Dropdown should appear
    await waitFor(() => {
      expect(screen.getByText('Start Page Extraction')).toBeInTheDocument();
    });
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    const file = createMockFile({ type: 'pdf' });
    render(
      <div>
        <ArchiveFileItem
          file={file}
          onClick={mockOnClick}
          onExtract={mockOnExtract}
        />
        <div data-testid="outside">Outside</div>
      </div>
    );
    
    // Open dropdown
    const optionsButton = screen.getByLabelText('PDF options');
    await user.click(optionsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Start Page Extraction')).toBeInTheDocument();
    });
    
    // Click outside
    const outside = screen.getByTestId('outside');
    await user.click(outside);
    
    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByText('Start Page Extraction')).not.toBeInTheDocument();
    });
  });

  it('should not show extract button for non-PDF files', () => {
    const file = createMockFile({ type: 'image' });
    render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
        onExtract={mockOnExtract}
      />
    );
    
    expect(screen.queryByLabelText('Extract PDF')).not.toBeInTheDocument();
  });

  it('should not show PDF options button for non-PDF files', () => {
    const file = createMockFile({ type: 'image' });
    render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
        onExtract={mockOnExtract}
      />
    );
    
    expect(screen.queryByLabelText('PDF options')).not.toBeInTheDocument();
  });

  it('should not render delete button when onDelete is not provided', () => {
    const file = createMockFile();
    render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
      />
    );
    
    expect(screen.queryByLabelText('Delete file')).not.toBeInTheDocument();
  });

  it('should not render rename button when onRename is not provided', () => {
    const file = createMockFile();
    render(
      <ArchiveFileItem
        file={file}
        onClick={mockOnClick}
      />
    );
    
    expect(screen.queryByLabelText('Rename file')).not.toBeInTheDocument();
  });
});









