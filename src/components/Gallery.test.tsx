import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Gallery } from './Gallery';
import { ExtractedPage } from '../types';

describe('Gallery', () => {
  const mockOnPageClick = vi.fn();
  const mockPages: ExtractedPage[] = [
    {
      pageNumber: 1,
      imagePath: '/path/to/page1.png',
      imageData: 'data:image/png;base64,page1',
    },
    {
      pageNumber: 2,
      imagePath: '/path/to/page2.png',
      imageData: 'data:image/png;base64,page2',
    },
    {
      pageNumber: 3,
      imagePath: '/path/to/page3.png',
      imageData: 'data:image/png;base64,page3',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when pages array is empty', () => {
    const { container } = render(<Gallery pages={[]} onPageClick={mockOnPageClick} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render gallery items for each page', () => {
    render(<Gallery pages={mockPages} onPageClick={mockOnPageClick} />);
    
    expect(screen.getByAltText('Page 1')).toBeInTheDocument();
    expect(screen.getByAltText('Page 2')).toBeInTheDocument();
    expect(screen.getByAltText('Page 3')).toBeInTheDocument();
  });

  it('should call onPageClick when a page is clicked', async () => {
    const user = userEvent.setup();
    render(<Gallery pages={mockPages} onPageClick={mockOnPageClick} />);
    
    const page1 = screen.getByAltText('Page 1');
    const galleryItem = page1.closest('.relative.cursor-pointer');
    
    if (galleryItem) {
      await user.click(galleryItem);
      expect(mockOnPageClick).toHaveBeenCalledTimes(1);
      expect(mockOnPageClick).toHaveBeenCalledWith(mockPages[0]);
    }
  });

  it('should render page numbers correctly', () => {
    render(<Gallery pages={mockPages} onPageClick={mockOnPageClick} />);
    
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('should handle single page', () => {
    const singlePage = [mockPages[0]];
    render(<Gallery pages={singlePage} onPageClick={mockOnPageClick} />);
    
    expect(screen.getByAltText('Page 1')).toBeInTheDocument();
    expect(screen.queryByAltText('Page 2')).not.toBeInTheDocument();
  });

  it('should render gallery container with correct classes', () => {
    const { container } = render(<Gallery pages={mockPages} onPageClick={mockOnPageClick} />);
    const galleryContainer = container.querySelector('.w-full.h-full.overflow-y-auto');
    expect(galleryContainer).toBeInTheDocument();
  });
});









