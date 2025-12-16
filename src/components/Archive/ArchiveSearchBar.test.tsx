import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArchiveSearchBar } from './ArchiveSearchBar';

describe('ArchiveSearchBar', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input', () => {
    render(<ArchiveSearchBar value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should render with custom placeholder', () => {
    render(<ArchiveSearchBar value="" onChange={mockOnChange} placeholder="Search files..." />);
    expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
  });

  it('should display search value', () => {
    render(<ArchiveSearchBar value="test query" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('should call onChange when input value changes', async () => {
    const user = userEvent.setup();
    render(<ArchiveSearchBar value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test');
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should show clear button when value is not empty', () => {
    render(<ArchiveSearchBar value="test" onChange={mockOnChange} />);
    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  it('should not show clear button when value is empty', () => {
    render(<ArchiveSearchBar value="" onChange={mockOnChange} />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('should call onChange with empty string when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<ArchiveSearchBar value="test" onChange={mockOnChange} />);
    
    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should render search icon', () => {
    const { container } = render(<ArchiveSearchBar value="" onChange={mockOnChange} />);
    const searchIcon = container.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
  });
});







