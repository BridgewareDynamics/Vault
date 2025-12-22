import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExtractionFolder } from './ExtractionFolder';
import { ArchiveFile } from '../../types';

describe('ExtractionFolder', () => {
  const mockFolder: ArchiveFile = {
    name: 'Extraction Folder',
    path: '/path/to/folder',
    size: 0,
    modified: Date.now(),
    type: 'other',
    isFolder: true,
    folderType: 'extraction',
    parentPdfName: 'parent.pdf',
  };

  const mockOnClick = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnRename = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render folder name', () => {
    render(
      <ExtractionFolder
        folder={mockFolder}
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText('Extraction Folder')).toBeInTheDocument();
  });

  it('should call onClick when clicked and onClick is provided', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ExtractionFolder
        folder={mockFolder}
        onClick={mockOnClick}
      />
    );
    
    // Find the div with onClick handler (the one with border-gray-700)
    const folderElement = container.querySelector('.border-gray-700');
    if (folderElement) {
      await user.click(folderElement);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should not be clickable when onClick is not provided', () => {
    const { container } = render(
      <ExtractionFolder
        folder={mockFolder}
      />
    );
    
    const folderElement = container.querySelector('.cursor-pointer');
    expect(folderElement).not.toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ExtractionFolder
        folder={mockFolder}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );
    
    // Hover to show delete button
    const folderElement = screen.getByText('Extraction Folder').closest('.group');
    if (folderElement) {
      await user.hover(folderElement);
      
      await waitFor(() => {
        const deleteButton = screen.getByLabelText('Delete folder');
        expect(deleteButton).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText('Delete folder');
      await user.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    }
  });

  it('should call onRename when rename button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ExtractionFolder
        folder={mockFolder}
        onClick={mockOnClick}
        onRename={mockOnRename}
      />
    );
    
    // Hover to show rename button
    const folderElement = screen.getByText('Extraction Folder').closest('.group');
    if (folderElement) {
      await user.hover(folderElement);
      
      await waitFor(() => {
        const renameButton = screen.getByLabelText('Rename folder');
        expect(renameButton).toBeInTheDocument();
      });
      
      const renameButton = screen.getByLabelText('Rename folder');
      await user.click(renameButton);
      expect(mockOnRename).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    }
  });

  it('should show loading spinner when isExtracting is true', () => {
    render(
      <ExtractionFolder
        folder={mockFolder}
        onClick={mockOnClick}
        isExtracting={true}
      />
    );
    
    expect(screen.getByText('Preparing...')).toBeInTheDocument();
  });

  it('should not show loading spinner when isExtracting is false', () => {
    render(
      <ExtractionFolder
        folder={mockFolder}
        onClick={mockOnClick}
        isExtracting={false}
      />
    );
    
    expect(screen.queryByText('Preparing...')).not.toBeInTheDocument();
  });

  it('should not render action buttons when isExtracting is true', () => {
    render(
      <ExtractionFolder
        folder={mockFolder}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onRename={mockOnRename}
        isExtracting={true}
      />
    );
    
    expect(screen.queryByLabelText('Delete folder')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Rename folder')).not.toBeInTheDocument();
  });

  it('should not render delete button when onDelete is not provided', () => {
    render(
      <ExtractionFolder
        folder={mockFolder}
        onClick={mockOnClick}
        onRename={mockOnRename}
      />
    );
    
    expect(screen.queryByLabelText('Delete folder')).not.toBeInTheDocument();
  });

  it('should not render rename button when onRename is not provided', () => {
    render(
      <ExtractionFolder
        folder={mockFolder}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.queryByLabelText('Rename folder')).not.toBeInTheDocument();
  });
});













