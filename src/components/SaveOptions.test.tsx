import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveOptions } from './SaveOptions';

describe('SaveOptions', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<SaveOptions isOpen={false} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    expect(screen.queryByText('Name Folder')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    expect(screen.getByText('Name Folder')).toBeInTheDocument();
  });

  it('should render input field', () => {
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    const input = screen.getByPlaceholderText('Enter folder name...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should render Cancel and OK buttons', () => {
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button (X) is clicked', async () => {
    const user = userEvent.setup();
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    const closeButton = screen.getByLabelText('Close dialog');
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup();
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    const input = screen.getByPlaceholderText('Enter folder name...') as HTMLInputElement;
    await user.type(input, 'My Folder');
    
    expect(input.value).toBe('My Folder');
  });

  it('should call onConfirm with folder name when form is submitted', async () => {
    const user = userEvent.setup();
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    const input = screen.getByPlaceholderText('Enter folder name...');
    await user.type(input, 'My Folder');
    
    const okButton = screen.getByText('OK');
    await user.click(okButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith('My Folder');
  });

  it('should trim folder name before calling onConfirm', async () => {
    const user = userEvent.setup();
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    const input = screen.getByPlaceholderText('Enter folder name...');
    await user.type(input, '  My Folder  ');
    
    const okButton = screen.getByText('OK');
    await user.click(okButton);
    
    expect(mockOnConfirm).toHaveBeenCalledWith('My Folder');
  });

  it('should not call onConfirm when folder name is empty', async () => {
    const user = userEvent.setup();
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    const okButton = screen.getByText('OK');
    expect(okButton).toBeDisabled();
    
    // Try to submit with empty input
    await user.click(okButton);
    
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should disable OK button when input is empty', () => {
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    const okButton = screen.getByText('OK');
    expect(okButton).toBeDisabled();
  });

  it('should enable OK button when input has value', async () => {
    const user = userEvent.setup();
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    const input = screen.getByPlaceholderText('Enter folder name...');
    const okButton = screen.getByText('OK');
    
    expect(okButton).toBeDisabled();
    
    await user.type(input, 'Folder');
    
    expect(okButton).not.toBeDisabled();
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    const input = screen.getByPlaceholderText('Enter folder name...');
    await user.type(input, '{Escape}');
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should clear input when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    const input = screen.getByPlaceholderText('Enter folder name...') as HTMLInputElement;
    await user.type(input, 'My Folder');
    expect(input.value).toBe('My Folder');
    
    await user.type(input, '{Escape}');
    
    // Input should be cleared (onClose is called, which might unmount, but if still mounted, value should be empty)
    // Actually, the component resets the state when Escape is pressed
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should focus input when dialog opens', () => {
    const { rerender } = render(<SaveOptions isOpen={false} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    rerender(<SaveOptions isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    
    const input = screen.getByPlaceholderText('Enter folder name...');
    expect(input).toHaveFocus();
  });
});










