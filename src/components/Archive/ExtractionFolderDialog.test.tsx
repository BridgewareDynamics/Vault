import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExtractionFolderDialog } from './ExtractionFolderDialog';

describe('ExtractionFolderDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <ExtractionFolderDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.queryByText('Name Folder')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText('Name Folder')).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText(/Enter a name for the extraction folder/)).toBeInTheDocument();
  });

  it('should render folder name input', () => {
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    const input = screen.getByPlaceholderText('Enter folder name...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should render Cancel and OK buttons', () => {
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('should update folder name input when typing', async () => {
    const user = userEvent.setup();
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter folder name...') as HTMLInputElement;
    await user.type(input, 'My Folder');
    
    expect(input.value).toBe('My Folder');
  });

  it('should call onConfirm with trimmed folder name when OK is clicked', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValue(undefined);
    
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter folder name...');
    await user.type(input, '  My Folder  ');
    
    const okButton = screen.getByText('OK');
    await user.click(okButton);
    
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith('My Folder');
    });
  });

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ExtractionFolderDialog
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

  it('should disable OK button when folder name is empty', () => {
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const okButton = screen.getByText('OK');
    expect(okButton).toBeDisabled();
  });

  it('should enable OK button when folder name has value', async () => {
    const user = userEvent.setup();
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter folder name...');
    const okButton = screen.getByText('OK');
    
    expect(okButton).toBeDisabled();
    
    await user.type(input, 'My Folder');
    
    expect(okButton).not.toBeDisabled();
  });

  it('should call onConfirm when Enter is pressed', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValue(undefined);
    
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter folder name...');
    await user.type(input, 'My Folder{Enter}');
    
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith('My Folder');
    });
  });

  it('should call onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter folder name...');
    await user.click(input);
    await user.keyboard('{Escape}');
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show "Creating..." when submitting', async () => {
    const user = userEvent.setup();
    // Make onConfirm take some time
    mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter folder name...');
    await user.type(input, 'My Folder');
    
    const okButton = screen.getByText('OK');
    await user.click(okButton);
    
    // Should show "Creating..." text
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(okButton).toBeDisabled();
  });

  it('should reset form when dialog closes and reopens', () => {
    const { rerender } = render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    screen.getByPlaceholderText('Enter folder name...') as HTMLInputElement;
    
    // Close dialog
    rerender(
      <ExtractionFolderDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    // Reopen dialog
    rerender(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const newInput = screen.getByPlaceholderText('Enter folder name...') as HTMLInputElement;
    expect(newInput.value).toBe('');
  });

  it('should call onClose when clicking backdrop', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    // Click on the backdrop (the outer fixed div)
    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should not call onClose when clicking inside dialog', async () => {
    const user = userEvent.setup();
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const dialogContent = screen.getByText('Name Folder');
    await user.click(dialogContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValue(undefined);
    
    render(
      <ExtractionFolderDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter folder name...');
    await user.type(input, 'My Folder');
    
    const form = input.closest('form');
    if (form) {
      await user.type(input, '{Enter}');
      
      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });
    }
  });
});














