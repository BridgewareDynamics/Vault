import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveParentDialog } from './SaveParentDialog';

describe('SaveParentDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <SaveParentDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.queryByText('Save Parent Document?')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <SaveParentDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText('Save Parent Document?')).toBeInTheDocument();
  });

  it('should render confirmation message', () => {
    render(
      <SaveParentDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText(/Would you like to save the original PDF file/)).toBeInTheDocument();
  });

  it('should render No and Yes buttons', () => {
    render(
      <SaveParentDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('should call onConfirm with false and onClose when No is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SaveParentDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const noButton = screen.getByText('No');
    await user.click(noButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith(false);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm with true and onClose when Yes is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SaveParentDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const yesButton = screen.getByText('Yes');
    await user.click(yesButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith(true);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking on backdrop', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SaveParentDialog
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
      <SaveParentDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const dialogContent = screen.getByText('Save Parent Document?');
    await user.click(dialogContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});










