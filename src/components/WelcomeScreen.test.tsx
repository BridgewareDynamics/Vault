import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeScreen } from './WelcomeScreen';

describe('WelcomeScreen', () => {
  const mockOnSelectFile = vi.fn();
  const mockOnOpenArchive = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render welcome title', () => {
    render(<WelcomeScreen onSelectFile={mockOnSelectFile} onOpenArchive={mockOnOpenArchive} />);
    expect(screen.getByText('Welcome to Vault')).toBeInTheDocument();
  });

  it('should render Select file button', () => {
    render(<WelcomeScreen onSelectFile={mockOnSelectFile} onOpenArchive={mockOnOpenArchive} />);
    expect(screen.getByText('Select file')).toBeInTheDocument();
  });

  it('should render The Vault button', () => {
    render(<WelcomeScreen onSelectFile={mockOnSelectFile} onOpenArchive={mockOnOpenArchive} />);
    expect(screen.getByText('The Vault')).toBeInTheDocument();
  });

  it('should call onSelectFile when Select file button is clicked', async () => {
    const user = userEvent.setup();
    render(<WelcomeScreen onSelectFile={mockOnSelectFile} onOpenArchive={mockOnOpenArchive} />);
    
    const selectFileButton = screen.getByText('Select file');
    await user.click(selectFileButton);
    
    expect(mockOnSelectFile).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenArchive when The Vault button is clicked', async () => {
    const user = userEvent.setup();
    render(<WelcomeScreen onSelectFile={mockOnSelectFile} onOpenArchive={mockOnOpenArchive} />);
    
    const vaultButton = screen.getByText('The Vault');
    await user.click(vaultButton);
    
    expect(mockOnOpenArchive).toHaveBeenCalledTimes(1);
  });

  it('should render PDF to PNG description', () => {
    render(<WelcomeScreen onSelectFile={mockOnSelectFile} onOpenArchive={mockOnOpenArchive} />);
    expect(screen.getByText('PDF to PNG')).toBeInTheDocument();
  });

  it('should render Lock icon', () => {
    const { container } = render(<WelcomeScreen onSelectFile={mockOnSelectFile} onOpenArchive={mockOnOpenArchive} />);
    // The Lock icon from lucide-react should be rendered
    const lockIcon = container.querySelector('svg');
    expect(lockIcon).toBeInTheDocument();
  });
});













