import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArchiveDriveDialog } from './ArchiveDriveDialog';

describe('ArchiveDriveDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <ArchiveDriveDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.queryByText('Choose Vault Directory')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <ArchiveDriveDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText('Choose Vault Directory')).toBeInTheDocument();
  });

  it('should render welcome message', () => {
    render(
      <ArchiveDriveDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText(/Welcome to Vault!/)).toBeInTheDocument();
    expect(screen.getByText(/Please choose the directory where your vault will be stored/)).toBeInTheDocument();
  });

  it('should render Cancel and Select Directory buttons', () => {
    render(
      <ArchiveDriveDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Select Directory')).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ArchiveDriveDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm when Select Directory button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ArchiveDriveDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const selectButton = screen.getByText('Select Directory');
    await user.click(selectButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when clicking on backdrop', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ArchiveDriveDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
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
      <ArchiveDriveDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const dialogContent = screen.getByText('Choose Vault Directory');
    await user.click(dialogContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});













