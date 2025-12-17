import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryItem } from './GalleryItem';
import { ExtractedPage } from '../types';

describe('GalleryItem', () => {
  const mockPage: ExtractedPage = {
    pageNumber: 1,
    imagePath: '/path/to/image.png',
    imageData: 'data:image/png;base64,test',
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page number', () => {
    render(<GalleryItem page={mockPage} onClick={mockOnClick} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('should render image with correct alt text', () => {
    render(<GalleryItem page={mockPage} onClick={mockOnClick} />);
    const image = screen.getByAltText('Page 1');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'data:image/png;base64,test');
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    render(<GalleryItem page={mockPage} onClick={mockOnClick} />);
    
    const galleryItem = screen.getByAltText('Page 1').closest('.relative.cursor-pointer');
    if (galleryItem) {
      await user.click(galleryItem);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should render different page numbers correctly', () => {
    const page2: ExtractedPage = {
      ...mockPage,
      pageNumber: 2,
    };
    render(<GalleryItem page={page2} onClick={mockOnClick} />);
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByAltText('Page 2')).toBeInTheDocument();
  });

  it('should have cursor-pointer class for clickability', () => {
    const { container } = render(<GalleryItem page={mockPage} onClick={mockOnClick} />);
    const clickableElement = container.querySelector('.cursor-pointer');
    expect(clickableElement).toBeInTheDocument();
  });

  it('should render with lazy loading', () => {
    render(<GalleryItem page={mockPage} onClick={mockOnClick} />);
    const image = screen.getByAltText('Page 1');
    expect(image).toHaveAttribute('loading', 'lazy');
  });
});













