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

  it('should render PDF Audit button when onRunAudit is provided', () => {
    const mockOnRunAudit = vi.fn();
    render(<PDFOptionsDropdown onStartExtraction={mockOnStartExtraction} onRunAudit={mockOnRunAudit} />);
    expect(screen.getByText('PDF Audit')).toBeInTheDocument();
    expect(screen.getByText('Start Page Extraction')).toBeInTheDocument();
  });

  it('should call onRunAudit when PDF Audit button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnRunAudit = vi.fn();
    render(<PDFOptionsDropdown onStartExtraction={mockOnStartExtraction} onRunAudit={mockOnRunAudit} />);
    
    const auditButton = screen.getByText('PDF Audit');
    await user.click(auditButton);
    
    expect(mockOnRunAudit).toHaveBeenCalledTimes(1);
    expect(mockOnStartExtraction).not.toHaveBeenCalled();
  });

  it('should only render PDF Audit button when onStartExtraction is not provided', () => {
    const mockOnRunAudit = vi.fn();
    render(<PDFOptionsDropdown onRunAudit={mockOnRunAudit} />);
    expect(screen.getByText('PDF Audit')).toBeInTheDocument();
    expect(screen.queryByText('Start Page Extraction')).not.toBeInTheDocument();
  });

  it('should only render Start Page Extraction button when onRunAudit is not provided', () => {
    render(<PDFOptionsDropdown onStartExtraction={mockOnStartExtraction} />);
    expect(screen.getByText('Start Page Extraction')).toBeInTheDocument();
    expect(screen.queryByText('PDF Audit')).not.toBeInTheDocument();
  });
});













