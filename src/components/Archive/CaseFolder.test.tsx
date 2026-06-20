import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CaseFolder } from './CaseFolder';
import { ArchiveCase } from '../../types';
import { mockElectronAPI } from '../../test-utils/mocks';
import { renderWithProviders } from '../../test-utils/render';

vi.mock('../../hooks/useCategoryTags', () => ({
  useCategoryTags: () => ({
    tags: [],
    getTagById: vi.fn(() => undefined),
    createTag: vi.fn(),
    deleteTag: vi.fn(),
    loadTags: vi.fn(),
  }),
}));

describe('CaseFolder', () => {
  const mockCase: ArchiveCase = {
    name: 'Test Case',
    path: '/path/to/case',
    description: 'Test description',
  };

  const mockOnClick = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnEditBackground = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.readFileData.mockResolvedValue({
      data: 'base64data',
      mimeType: 'image/png',
      fileName: 'bg.png',
    });
  });

  it('should render case name', async () => {
    await act(async () => {
      renderWithProviders(
        <CaseFolder
          caseItem={mockCase}
          onClick={mockOnClick}
        />
      );
    });
    expect(screen.getByText('Test Case')).toBeInTheDocument();
  });

  it('should render case description when provided', async () => {
    await act(async () => {
      renderWithProviders(
        <CaseFolder
          caseItem={mockCase}
          onClick={mockOnClick}
        />
      );
    });
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should not render description when not provided', async () => {
    const caseWithoutDesc: ArchiveCase = {
      name: 'Test Case',
      path: '/path/to/case',
    };
    await act(async () => {
      renderWithProviders(
        <CaseFolder
          caseItem={caseWithoutDesc}
          onClick={mockOnClick}
        />
      );
    });
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <CaseFolder
        caseItem={mockCase}
        onClick={mockOnClick}
      />
    );
    
    // Find the div with onClick handler (the one with border-gray-700)
    const caseElement = container.querySelector('.border-gray-700');
    if (caseElement) {
      await act(async () => {
        await user.click(caseElement);
      });
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CaseFolder
        caseItem={mockCase}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );
    
    // Hover to show delete button
    const caseElement = screen.getByText('Test Case').closest('.group');
    if (caseElement) {
      await act(async () => {
        await user.hover(caseElement);
      });
      
      // Wait for delete button to appear
      await waitFor(() => {
        const deleteButton = screen.getByLabelText('Delete case');
        expect(deleteButton).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText('Delete case');
      await act(async () => {
        await user.click(deleteButton);
      });
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    }
  });

  it('should call onEditBackground when edit background button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CaseFolder
        caseItem={mockCase}
        onClick={mockOnClick}
        onEditBackground={mockOnEditBackground}
      />
    );
    
    const editButton = screen.getByLabelText('Edit background image');
    await act(async () => {
      await user.click(editButton);
    });
    
    expect(mockOnEditBackground).toHaveBeenCalledTimes(1);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should resolve background image via vault-file protocol when backgroundImage is provided', async () => {
    const caseWithBg: ArchiveCase = {
      ...mockCase,
      backgroundImage: '/path/to/bg.png',
    };

    const { container } = renderWithProviders(
      <CaseFolder
        caseItem={caseWithBg}
        onClick={mockOnClick}
      />,
      { withToast: true },
    );

    const styled = container.querySelector('[style*="vault-file"]');
    expect(styled).toBeTruthy();
    expect(mockElectronAPI.readFileData).not.toHaveBeenCalled();
  });

  it('should show loading spinner when isExtracting is true', async () => {
    await act(async () => {
      renderWithProviders(
        <CaseFolder
          caseItem={mockCase}
          onClick={mockOnClick}
          isExtracting={true}
        />
      );
    });
    
    expect(screen.getByText('Extracting...')).toBeInTheDocument();
  });

  it('should not show loading spinner when isExtracting is false', async () => {
    await act(async () => {
      renderWithProviders(
        <CaseFolder
          caseItem={mockCase}
          onClick={mockOnClick}
          isExtracting={false}
        />
      );
    });
    
    expect(screen.queryByText('Extracting...')).not.toBeInTheDocument();
  });

  it('should not render delete button when onDelete is not provided', async () => {
    await act(async () => {
      renderWithProviders(
        <CaseFolder
          caseItem={mockCase}
          onClick={mockOnClick}
        />
      );
    });
    
    expect(screen.queryByLabelText('Delete case')).not.toBeInTheDocument();
  });

  it('should not render edit background button when onEditBackground is not provided', async () => {
    await act(async () => {
      renderWithProviders(
        <CaseFolder
          caseItem={mockCase}
          onClick={mockOnClick}
        />
      );
    });
    
    expect(screen.queryByLabelText('Edit background image')).not.toBeInTheDocument();
  });
});













