import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteFolderConfirmDialog } from './DeleteFolderConfirmDialog';

describe('DeleteFolderConfirmDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <DeleteFolderConfirmDialog
        isOpen={false}
        folderName="Test Folder"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.queryByText('Delete Folder?')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <DeleteFolderConfirmDialog
        isOpen={true}
        folderName="Test Folder"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText('Delete Folder?')).toBeInTheDocument();
  });

  it('should display folder name in confirmation message', () => {
    render(
      <DeleteFolderConfirmDialog
        isOpen={true}
        folderName="My Test Folder"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText(/My Test Folder/)).toBeInTheDocument();
  });

  it('should render warning message', () => {
    render(
      <DeleteFolderConfirmDialog
        isOpen={true}
        folderName="Test Folder"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText(/This will permanently delete/)).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
  });

  it('should render Cancel and Delete buttons', () => {
    render(
      <DeleteFolderConfirmDialog
        isOpen={true}
        folderName="Test Folder"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete Folder')).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DeleteFolderConfirmDialog
        isOpen={true}
        folderName="Test Folder"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm and onClose when Delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DeleteFolderConfirmDialog
        isOpen={true}
        folderName="Test Folder"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const deleteButton = screen.getByText('Delete Folder');
    await user.click(deleteButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking outside the dialog', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DeleteFolderConfirmDialog
        isOpen={true}
        folderName="Test Folder"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    // Click on the backdrop
    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should not call onClose when clicking inside the dialog', async () => {
    const user = userEvent.setup();
    render(
      <DeleteFolderConfirmDialog
        isOpen={true}
        folderName="Test Folder"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    // Click on the dialog content (not the backdrop)
    const dialogContent = screen.getByText('Delete Folder?');
    await user.click(dialogContent);
    
    // Should not close when clicking inside
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});







