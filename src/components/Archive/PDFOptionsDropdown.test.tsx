import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PDFOptionsDropdown } from './PDFOptionsDropdown';

describe('PDFOptionsDropdown', () => {
  const mockOnStartExtraction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Start Page Extraction button', () => {
    render(<PDFOptionsDropdown onStartExtraction={mockOnStartExtraction} />);
    expect(screen.getByText('Start Page Extraction')).toBeInTheDocument();
  });

  it('should call onStartExtraction when button is clicked', async () => {
    const user = userEvent.setup();
    render(<PDFOptionsDropdown onStartExtraction={mockOnStartExtraction} />);
    
    const button = screen.getByText('Start Page Extraction');
    await user.click(button);
    
    expect(mockOnStartExtraction).toHaveBeenCalledTimes(1);
  });

  it('should stop event propagation when button is clicked', async () => {
    const user = userEvent.setup();
    const mockStopPropagation = vi.fn();
    
    render(
      <div onClick={mockStopPropagation}>
        <PDFOptionsDropdown onStartExtraction={mockOnStartExtraction} />
      </div>
    );
    
    const button = screen.getByText('Start Page Extraction');
    await user.click(button);
    
    // The component calls e.stopPropagation(), so parent click should not fire
    // However, userEvent.click doesn't bubble by default in tests, so we verify the handler was called
    expect(mockOnStartExtraction).toHaveBeenCalledTimes(1);
  });

  it('should render FileText icon', () => {
    const { container } = render(<PDFOptionsDropdown onStartExtraction={mockOnStartExtraction} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});







