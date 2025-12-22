import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { FixedSizeGrid } from 'react-window';
import { ExtractedPage } from '../types';
import { GalleryItem } from './GalleryItem';

interface GalleryProps {
  pages: ExtractedPage[];
  onPageClick: (page: ExtractedPage) => void;
}

// Threshold for using virtualization (50 items as per plan)
const VIRTUALIZATION_THRESHOLD = 50;

// Calculate column count based on window width
function getColumnCount(width: number): number {
  if (width >= 1280) return 6; // xl
  if (width >= 1024) return 5; // lg
  if (width >= 768) return 4;  // md
  if (width >= 640) return 3;  // sm
  return 2; // default
}

// Calculate item dimensions based on column count and container width
function calculateItemDimensions(containerWidth: number, columnCount: number, gap: number = 16): { columnWidth: number; rowHeight: number } {
  const availableWidth = containerWidth - (gap * 2); // Account for padding
  const columnWidth = Math.floor((availableWidth - (gap * (columnCount - 1))) / columnCount);
  // Row height based on 3:4 aspect ratio (as seen in GalleryItem)
  const rowHeight = Math.floor(columnWidth * (4 / 3)) + 40; // Add some padding for badge
  return { columnWidth, rowHeight };
}

export const Gallery = memo(function Gallery({ pages, onPageClick }: GalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
  const [useVirtualization, setUseVirtualization] = useState(false);

  // Update container size and virtualization decision
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
        setUseVirtualization(pages.length >= VIRTUALIZATION_THRESHOLD);
      } else {
        // Fallback: use window dimensions
        setContainerSize({ width: window.innerWidth, height: window.innerHeight });
        setUseVirtualization(pages.length >= VIRTUALIZATION_THRESHOLD);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [pages.length]);

  const columnCount = getColumnCount(containerSize.width);
  const { columnWidth, rowHeight } = calculateItemDimensions(containerSize.width, columnCount);
  const rowCount = Math.ceil(pages.length / columnCount);

  // Cell renderer for virtualized grid
  const Cell = useCallback(({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const index = rowIndex * columnCount + columnIndex;
    const page = pages[index];
    
    if (!page) {
      return <div style={style} />;
    }

    return (
      <div style={{ ...style, padding: '8px' }}>
        <GalleryItem
          page={page}
          onClick={() => onPageClick(page)}
        />
      </div>
    );
  }, [pages, columnCount, onPageClick]);

  if (pages.length === 0) {
    return null;
  }

  // Use virtualization for large lists
  if (useVirtualization && containerSize.width > 0) {
    return (
      <div ref={containerRef} className="w-full h-full overflow-y-auto px-4 py-4 pb-32">
        <FixedSizeGrid
          columnCount={columnCount}
          rowCount={rowCount}
          columnWidth={columnWidth}
          rowHeight={rowHeight}
          width={containerSize.width - 32} // Account for padding
          height={containerSize.height - 128} // Account for padding and toolbar
          style={{ overflowX: 'hidden' }}
        >
          {Cell}
        </FixedSizeGrid>
      </div>
    );
  }

  // Fallback to regular grid for smaller lists
  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto px-4 py-4 pb-32">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {pages.map((page) => (
          <GalleryItem
            key={page.pageNumber}
            page={page}
            onClick={() => onPageClick(page)}
          />
        ))}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  if (prevProps.pages.length !== nextProps.pages.length) {
    return false;
  }
  
  // Check if pages array has changed
  if (prevProps.pages.length > 0 && nextProps.pages.length > 0) {
    const prevFirst = prevProps.pages[0];
    const nextFirst = nextProps.pages[0];
    if (prevFirst.pageNumber !== nextFirst.pageNumber || prevFirst.imageData !== nextFirst.imageData) {
      return false;
    }
  }
  
  // onPageClick is a function reference, so we assume it's stable
  return true;
});



