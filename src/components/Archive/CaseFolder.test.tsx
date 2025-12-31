import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CaseFolder } from './CaseFolder';
import { ArchiveCase } from '../../types';
import { mockElectronAPI } from '../../test-utils/mocks';
import { ToastProvider } from '../Toast/ToastContext';

// Helper to render with ToastProvider
const renderWithToast = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

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
      renderWithToast(
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
      renderWithToast(
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
      renderWithToast(
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
    const { container } = renderWithToast(
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
    renderWithToast(
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
    renderWithToast(
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

  it('should load background image when backgroundImage is provided', async () => {
    const caseWithBg: ArchiveCase = {
      ...mockCase,
      backgroundImage: '/path/to/bg.png',
    };
    
    await act(async () => {
      renderWithToast(
        <CaseFolder
          caseItem={caseWithBg}
          onClick={mockOnClick}
        />
      );
    });
    
    await waitFor(() => {
      expect(mockElectronAPI.readFileData).toHaveBeenCalledWith('/path/to/bg.png');
    });
  });

  it('should show loading spinner when isExtracting is true', async () => {
    await act(async () => {
      renderWithToast(
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
      renderWithToast(
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
      renderWithToast(
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
      renderWithToast(
        <CaseFolder
          caseItem={mockCase}
          onClick={mockOnClick}
        />
      );
    });
    
    expect(screen.queryByLabelText('Edit background image')).not.toBeInTheDocument();
  });
});













