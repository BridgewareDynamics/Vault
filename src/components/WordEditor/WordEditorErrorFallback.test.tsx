import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordEditorErrorFallback } from './WordEditorErrorFallback';

describe('WordEditorErrorFallback', () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render error message', () => {
    const error = new Error('Test error message');
    render(<WordEditorErrorFallback error={error} onReset={mockOnReset} />);

    expect(screen.getByText('Word Editor Error')).toBeInTheDocument();
    expect(screen.getByText(/An error occurred in the word editor/)).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should render without error message when error is null', () => {
    render(<WordEditorErrorFallback error={null} onReset={mockOnReset} />);

    expect(screen.getByText('Word Editor Error')).toBeInTheDocument();
    expect(screen.getByText(/An error occurred in the word editor/)).toBeInTheDocument();
    expect(screen.queryByText(/Test error message/)).not.toBeInTheDocument();
  });

  it('should call onReset when reset button is clicked', async () => {
    const user = userEvent.setup();
    const error = new Error('Test error');
    render(<WordEditorErrorFallback error={error} onReset={mockOnReset} />);

    const resetButton = screen.getByText('Reset Editor');
    await user.click(resetButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('should display error message in error container', () => {
    const error = new Error('Detailed error message');
    render(<WordEditorErrorFallback error={error} onReset={mockOnReset} />);

    const errorContainer = screen.getByText('Detailed error message').closest('div');
    expect(errorContainer).toHaveClass('bg-red-900/50');
  });

  it('should render reset button', () => {
    render(<WordEditorErrorFallback error={null} onReset={mockOnReset} />);

    const resetButton = screen.getByText('Reset Editor');
    expect(resetButton).toBeInTheDocument();
    expect(resetButton.tagName).toBe('BUTTON');
  });

  it('should handle long error messages', () => {
    const longError = new Error('This is a very long error message that might wrap or be truncated in some way');
    render(<WordEditorErrorFallback error={longError} onReset={mockOnReset} />);

    expect(screen.getByText(longError.message)).toBeInTheDocument();
  });

  it('should handle special characters in error message', () => {
    const specialError = new Error('Error with special chars: <>&"\'');
    render(<WordEditorErrorFallback error={specialError} onReset={mockOnReset} />);

    expect(screen.getByText(specialError.message)).toBeInTheDocument();
  });
});




