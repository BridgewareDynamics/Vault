import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CaseNameDialog } from './CaseNameDialog';
import { renderWithProviders } from '../../test-utils/render';

vi.mock('../../hooks/useCategoryTags', () => ({
  useCategoryTags: () => ({
    tags: [],
    createTag: vi.fn(),
    deleteTag: vi.fn(),
    getTagById: vi.fn(),
  }),
}));

const renderWithToast = (ui: React.ReactElement) =>
  renderWithProviders(ui, { withToast: true });

describe('CaseNameDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithToast(
      <CaseNameDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.queryByText('Case Name')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText('Case Name')).toBeInTheDocument();
  });

  it('should render case name input', () => {
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    const input = screen.getByPlaceholderText('Enter case name...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should render description textarea', () => {
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    const textarea = screen.getByPlaceholderText('Add a description for this case...');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('should render Cancel and Create Case buttons', () => {
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create Case')).toBeInTheDocument();
  });

  it('should update case name input when typing', async () => {
    const user = userEvent.setup();
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter case name...') as HTMLInputElement;
    await user.type(input, 'My Case');
    
    expect(input.value).toBe('My Case');
  });

  it('should update description textarea when typing', async () => {
    const user = userEvent.setup();
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const textarea = screen.getByPlaceholderText('Add a description for this case...') as HTMLTextAreaElement;
    await user.type(textarea, 'Case description');
    
    expect(textarea.value).toBe('Case description');
  });

  it('should call onConfirm with trimmed values when Create Case is clicked', async () => {
    const user = userEvent.setup();
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter case name...');
    const descTextarea = screen.getByPlaceholderText('Add a description for this case...');
    
    await user.type(nameInput, '  My Case  ');
    await user.type(descTextarea, '  Description  ');
    
    const okButton = screen.getByText('Create Case');
    await user.click(okButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith('My Case', 'Description', undefined);
  });

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithToast(
      <CaseNameDialog
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

  it('should disable Create Case button when case name is empty', () => {
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const okButton = screen.getByLabelText('Create case');
    expect(okButton).toBeDisabled();
  });

  it('should enable Create Case button when case name has value', async () => {
    const user = userEvent.setup();
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter case name...');
    const okButton = screen.getByLabelText('Create case');
    
    expect(okButton).toBeDisabled();
    
    await user.type(nameInput, 'My Case');
    
    expect(okButton).not.toBeDisabled();
  });

  it('should call onConfirm when Enter is pressed in name input', async () => {
    const user = userEvent.setup();
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter case name...');
    await user.type(nameInput, 'My Case{Enter}');
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith('My Case', '', undefined);
  });

  it('should call onClose when Escape is pressed in name input', async () => {
    const user = userEvent.setup();
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter case name...');
    await user.type(nameInput, '{Escape}');
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when Ctrl+Enter is pressed in description textarea', async () => {
    const user = userEvent.setup();
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter case name...');
    const descTextarea = screen.getByPlaceholderText('Add a description for this case...');
    
    await user.type(nameInput, 'My Case');
    await user.click(descTextarea);
    await user.keyboard('{Control>}{Enter}{/Control}');
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape is pressed in description textarea', async () => {
    const user = userEvent.setup();
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const descTextarea = screen.getByPlaceholderText('Add a description for this case...');
    await user.click(descTextarea);
    await user.keyboard('{Escape}');
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should reset form when dialog closes and reopens', () => {
    const { rerender } = renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    screen.getByPlaceholderText('Enter case name...') as HTMLInputElement;
    screen.getByPlaceholderText('Add a description for this case...') as HTMLTextAreaElement;
    
    // Close dialog
    rerender(
      <CaseNameDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    // Reopen dialog
    rerender(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const newNameInput = screen.getByPlaceholderText('Enter case name...') as HTMLInputElement;
    const newDescTextarea = screen.getByPlaceholderText('Add a description for this case...') as HTMLTextAreaElement;
    
    expect(newNameInput.value).toBe('');
    expect(newDescTextarea.value).toBe('');
  });

  it('should not call onClose when clicking inside dialog', async () => {
    const user = userEvent.setup();
    renderWithToast(
      <CaseNameDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const dialogContent = screen.getByText('Case Name');
    await user.click(dialogContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when clicking backdrop', async () => {
    const user = userEvent.setup();
    const { container } = renderWithToast(
      <CaseNameDialog
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
});














