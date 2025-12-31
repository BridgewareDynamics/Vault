import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageViewer } from './ImageViewer';
import { ExtractedPage } from '../types';

describe('ImageViewer', () => {
  const mockOnClose = vi.fn();
  const mockPage: ExtractedPage = {
    pageNumber: 1,
    imagePath: '/path/to/page1.png',
    imageData: 'data:image/png;base64,page1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when page is null', () => {
    const { container } = render(<ImageViewer page={null} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render image when page is provided', () => {
    render(<ImageViewer page={mockPage} onClose={mockOnClose} />);
    
    const image = screen.getByAltText('Page 1');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'data:image/png;base64,page1');
  });

  it('should render page number', () => {
    render(<ImageViewer page={mockPage} onClose={mockOnClose} />);
    expect(screen.getByText('Page #1')).toBeInTheDocument();
  });

  it('should render close button', () => {
    render(<ImageViewer page={mockPage} onClose={mockOnClose} />);
    const closeButton = screen.getByLabelText('Close image viewer');
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ImageViewer page={mockPage} onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close image viewer');
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking outside the image', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageViewer page={mockPage} onClose={mockOnClose} />);
    
    // Click on the backdrop (the outer container)
    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should not call onClose when clicking on the image itself', async () => {
    const user = userEvent.setup();
    render(<ImageViewer page={mockPage} onClose={mockOnClose} />);
    
    const image = screen.getByAltText('Page 1');
    await act(async () => {
      await user.click(image);
    });
    
    // Clicking the image should toggle zoom, not close
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should render zoom in button initially', () => {
    render(<ImageViewer page={mockPage} onClose={mockOnClose} />);
    const zoomButton = screen.getByLabelText('Zoom in');
    expect(zoomButton).toBeInTheDocument();
  });

  it('should toggle zoom when zoom button is clicked', async () => {
    const user = userEvent.setup();
    render(<ImageViewer page={mockPage} onClose={mockOnClose} />);
    
    const zoomButton = screen.getByLabelText('Zoom in');
    await act(async () => {
      await user.click(zoomButton);
    });
    
    // After clicking, it should show zoom out
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.queryByLabelText('Zoom in')).not.toBeInTheDocument();
  });

  it('should toggle zoom when image is clicked', async () => {
    const user = userEvent.setup();
    render(<ImageViewer page={mockPage} onClose={mockOnClose} />);
    
    const image = screen.getByAltText('Page 1');
    await act(async () => {
      await user.click(image);
    });
    
    // After clicking image, it should show zoom out
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
  });

  it('should render different page numbers correctly', () => {
    const page2: ExtractedPage = {
      ...mockPage,
      pageNumber: 2,
    };
    render(<ImageViewer page={page2} onClose={mockOnClose} />);
    expect(screen.getByText('Page #2')).toBeInTheDocument();
    expect(screen.getByAltText('Page 2')).toBeInTheDocument();
  });
});










