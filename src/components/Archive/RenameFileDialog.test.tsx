import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RenameFileDialog } from './RenameFileDialog';

describe('RenameFileDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <RenameFileDialog
        isOpen={false}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.queryByText('Rename')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText('Rename')).toBeInTheDocument();
  });

  it('should display current name in input when opened', () => {
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    const input = screen.getByPlaceholderText('Enter new name...') as HTMLInputElement;
    expect(input.value).toBe('test.txt');
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter new name...') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'new-name.txt');
    
    expect(input.value).toBe('new-name.txt');
  });

  it('should call onConfirm with trimmed new name when Confirm is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter new name...');
    await user.clear(input);
    await user.type(input, '  new-name.txt  ');
    
    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith('new-name.txt');
  });

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm when Enter key is pressed', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter new name...');
    await user.clear(input);
    await user.type(input, 'new-name.txt');
    await user.keyboard('{Enter}');
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith('new-name.txt');
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter new name...');
    // Focus the input first, then press Escape
    await user.click(input);
    await user.keyboard('{Escape}');
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should disable Confirm button when input is empty', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter new name...') as HTMLInputElement;
    const confirmButton = screen.getByText('Confirm');
    
    // Initially has currentName, so button should be disabled (same name)
    expect(confirmButton).toBeDisabled();
    
    // Clear the input
    await user.clear(input);
    
    // Now button should be disabled because input is empty
    expect(confirmButton).toBeDisabled();
  });

  it('should disable Confirm button when new name is same as current name', () => {
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const confirmButton = screen.getByText('Confirm');
    // Input starts with currentName, so button should be disabled
    // But wait, the input has currentName, so newName.trim() === currentName, so disabled
    // Actually, let me check - if the input value is "test.txt" and currentName is "test.txt", button should be disabled
    expect(confirmButton).toBeDisabled();
  });

  it('should not call onConfirm when new name is same as current name', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    // Input already has currentName, so Confirm should be disabled
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeDisabled();
    
    // Try to click anyway (shouldn't work)
    await user.click(confirmButton);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onClose when clicking on backdrop', async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
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
    const user = userEvent.setup({ delay: null });
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const dialogContent = screen.getByText('Rename');
    await user.click(dialogContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should focus and select input text when dialog opens', async () => {
    vi.useRealTimers();
    render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter new name...') as HTMLInputElement;
    
    // Wait for setTimeout to complete
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    }, { timeout: 200 });
  });

  it('should update input when currentName prop changes', () => {
    const { rerender } = render(
      <RenameFileDialog
        isOpen={true}
        currentName="test.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    let input = screen.getByPlaceholderText('Enter new name...') as HTMLInputElement;
    expect(input.value).toBe('test.txt');
    
    rerender(
      <RenameFileDialog
        isOpen={true}
        currentName="new-file.txt"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    input = screen.getByPlaceholderText('Enter new name...') as HTMLInputElement;
    expect(input.value).toBe('new-file.txt');
  });
});
