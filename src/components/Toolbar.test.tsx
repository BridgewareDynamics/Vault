import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  const mockOnSelectSaveDirectory = vi.fn();
  const mockOnToggleSaveParentFile = vi.fn();
  const mockOnToggleSaveToZip = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    saveDirectory: null,
    saveParentFile: false,
    saveToZip: false,
    onSelectSaveDirectory: mockOnSelectSaveDirectory,
    onToggleSaveParentFile: mockOnToggleSaveParentFile,
    onToggleSaveToZip: mockOnToggleSaveToZip,
    onSave: mockOnSave,
    canSave: true,
  };

  it('should render Select Save Directory button when no directory is selected', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByText('Select Save Directory')).toBeInTheDocument();
  });

  it('should render Change Directory button when directory is selected', () => {
    render(<Toolbar {...defaultProps} saveDirectory="/path/to/directory" />);
    expect(screen.getByText('Change Directory')).toBeInTheDocument();
    expect(screen.queryByText('Select Save Directory')).not.toBeInTheDocument();
  });

  it('should call onSelectSaveDirectory when directory button is clicked', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...defaultProps} />);
    
    const button = screen.getByText('Select Save Directory');
    await user.click(button);
    
    expect(mockOnSelectSaveDirectory).toHaveBeenCalledTimes(1);
  });

  it('should not render save options when no directory is selected', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.queryByText('Save Parent File')).not.toBeInTheDocument();
    expect(screen.queryByText('Save into Zip Folder')).not.toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('should render save options when directory is selected', () => {
    render(<Toolbar {...defaultProps} saveDirectory="/path/to/directory" />);
    expect(screen.getByText('Save Parent File')).toBeInTheDocument();
    expect(screen.getByText('Save into Zip Folder')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should call onToggleSaveParentFile when Save Parent File is clicked', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...defaultProps} saveDirectory="/path/to/directory" />);
    
    const button = screen.getByText('Save Parent File');
    await user.click(button);
    
    expect(mockOnToggleSaveParentFile).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleSaveToZip when Save into Zip Folder is clicked', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...defaultProps} saveDirectory="/path/to/directory" />);
    
    const button = screen.getByText('Save into Zip Folder');
    await user.click(button);
    
    expect(mockOnToggleSaveToZip).toHaveBeenCalledTimes(1);
  });

  it('should disable Save button when canSave is false', () => {
    render(<Toolbar {...defaultProps} saveDirectory="/path/to/directory" canSave={false} />);
    
    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('should disable Save button when neither saveParentFile nor saveToZip is true', () => {
    render(
      <Toolbar
        {...defaultProps}
        saveDirectory="/path/to/directory"
        saveParentFile={false}
        saveToZip={false}
      />
    );
    
    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('should enable Save button when saveParentFile is true', () => {
    render(
      <Toolbar
        {...defaultProps}
        saveDirectory="/path/to/directory"
        saveParentFile={true}
        saveToZip={false}
        canSave={true}
      />
    );
    
    const saveButton = screen.getByText('Save');
    expect(saveButton).not.toBeDisabled();
  });

  it('should enable Save button when saveToZip is true', () => {
    render(
      <Toolbar
        {...defaultProps}
        saveDirectory="/path/to/directory"
        saveParentFile={false}
        saveToZip={true}
        canSave={true}
      />
    );
    
    const saveButton = screen.getByText('Save');
    expect(saveButton).not.toBeDisabled();
  });

  it('should call onSave directly when saveToZip is false', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar
        {...defaultProps}
        saveDirectory="/path/to/directory"
        saveParentFile={true}
        saveToZip={false}
      />
    );
    
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    // onSave is called without arguments when saveToZip is false
    expect(mockOnSave).toHaveBeenCalledWith();
  });

  it('should open folder name dialog when saveToZip is true and Save is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar
        {...defaultProps}
        saveDirectory="/path/to/directory"
        saveParentFile={false}
        saveToZip={true}
      />
    );
    
    const saveButton = screen.getByText('Save');
    await act(async () => {
      await user.click(saveButton);
    });
    
    // Dialog should appear
    expect(screen.getByText('Name Folder')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should call onSave with folder name when dialog is confirmed', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar
        {...defaultProps}
        saveDirectory="/path/to/directory"
        saveParentFile={false}
        saveToZip={true}
      />
    );
    
    // Open dialog
    const saveButton = screen.getByText('Save');
    await act(async () => {
      await user.click(saveButton);
    });
    
    // Enter folder name and confirm
    const input = screen.getByPlaceholderText('Enter folder name...');
    await act(async () => {
      await user.type(input, 'My Folder');
    });
    const okButton = screen.getByText('OK');
    await act(async () => {
      await user.click(okButton);
    });
    
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith('My Folder');
  });
});













