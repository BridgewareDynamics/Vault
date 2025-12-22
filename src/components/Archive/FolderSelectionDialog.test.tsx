import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderSelectionDialog } from './FolderSelectionDialog';

describe('FolderSelectionDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSelectDirectory = vi.fn();
  const mockOnMakeNewFolder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <FolderSelectionDialog
        isOpen={false}
        onClose={mockOnClose}
        onSelectDirectory={mockOnSelectDirectory}
        onMakeNewFolder={mockOnMakeNewFolder}
      />
    );
    expect(screen.queryByText('Select Directory or Make New Folder')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <FolderSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSelectDirectory={mockOnSelectDirectory}
        onMakeNewFolder={mockOnMakeNewFolder}
      />
    );
    expect(screen.getByText('Select Directory or Make New Folder')).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(
      <FolderSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSelectDirectory={mockOnSelectDirectory}
        onMakeNewFolder={mockOnMakeNewFolder}
      />
    );
    expect(screen.getByText(/Choose to select an existing folder/)).toBeInTheDocument();
  });

  it('should render Select Directory button', () => {
    render(
      <FolderSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSelectDirectory={mockOnSelectDirectory}
        onMakeNewFolder={mockOnMakeNewFolder}
      />
    );
    expect(screen.getByText('Select Directory')).toBeInTheDocument();
  });

  it('should render Make New Folder button', () => {
    render(
      <FolderSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSelectDirectory={mockOnSelectDirectory}
        onMakeNewFolder={mockOnMakeNewFolder}
      />
    );
    expect(screen.getByText('Make New Folder')).toBeInTheDocument();
  });

  it('should render Cancel button', () => {
    render(
      <FolderSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSelectDirectory={mockOnSelectDirectory}
        onMakeNewFolder={mockOnMakeNewFolder}
      />
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should call onSelectDirectory when Select Directory button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FolderSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSelectDirectory={mockOnSelectDirectory}
        onMakeNewFolder={mockOnMakeNewFolder}
      />
    );
    
    const selectButton = screen.getByText('Select Directory');
    await user.click(selectButton);
    
    expect(mockOnSelectDirectory).toHaveBeenCalledTimes(1);
    // Note: onClose is not called automatically - parent handles it
  });

  it('should call onMakeNewFolder when Make New Folder button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FolderSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSelectDirectory={mockOnSelectDirectory}
        onMakeNewFolder={mockOnMakeNewFolder}
      />
    );
    
    const newFolderButton = screen.getByText('Make New Folder');
    await user.click(newFolderButton);
    
    expect(mockOnMakeNewFolder).toHaveBeenCalledTimes(1);
    // Note: onClose is not called automatically - parent handles it
  });

  it('should call onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FolderSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSelectDirectory={mockOnSelectDirectory}
        onMakeNewFolder={mockOnMakeNewFolder}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking on backdrop', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FolderSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSelectDirectory={mockOnSelectDirectory}
        onMakeNewFolder={mockOnMakeNewFolder}
      />
    );
    
    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should not call onClose when clicking inside dialog', async () => {
    const user = userEvent.setup();
    render(
      <FolderSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSelectDirectory={mockOnSelectDirectory}
        onMakeNewFolder={mockOnMakeNewFolder}
      />
    );
    
    const dialogContent = screen.getByText('Select Directory or Make New Folder');
    await user.click(dialogContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});













