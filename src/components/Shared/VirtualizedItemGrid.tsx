import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { FixedSizeGrid, type GridChildComponentProps } from 'react-window';
import {
  calculateVirtualGridDimensions,
  shouldVirtualizeGrid,
  VIRTUALIZATION_THRESHOLD,
} from '../../utils/virtualGridUtils';

interface VirtualizedItemGridProps<T> {
  items: T[];
  getItemKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  getColumnCount: (containerWidth: number) => number;
  threshold?: number;
  gap?: number;
  aspectRatio?: number;
  footerHeight?: number;
  nonVirtualClassName?: string;
  className?: string;
  scrollClassName?: string;
  heightOffset?: number;
  onVisibleIndicesChange?: (indices: number[]) => void;
}

function VirtualizedItemGridInner<T>({
  items,
  getItemKey,
  renderItem,
  getColumnCount,
  threshold = VIRTUALIZATION_THRESHOLD,
  gap = 16,
  aspectRatio = 4 / 3,
  footerHeight = 40,
  nonVirtualClassName = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4',
  className = 'w-full',
  scrollClassName = 'w-full overflow-y-auto',
  heightOffset = 128,
  onVisibleIndicesChange,
}: VirtualizedItemGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
  const useVirtualization = shouldVirtualizeGrid(items.length, threshold);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      } else {
        setContainerSize({ width: window.innerWidth, height: window.innerHeight });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [items.length]);

  const columnCount = Math.max(1, getColumnCount(containerSize.width));
  const { columnWidth, rowHeight } = calculateVirtualGridDimensions(
    containerSize.width,
    columnCount,
    gap,
    aspectRatio,
    footerHeight,
  );
  const rowCount = Math.ceil(items.length / columnCount);

  const handleItemsRendered = useCallback(
    ({
      visibleRowStartIndex,
      visibleRowStopIndex,
    }: {
      visibleRowStartIndex: number;
      visibleRowStopIndex: number;
    }) => {
      if (!onVisibleIndicesChange) {
        return;
      }

      const prefetchStart = Math.max(0, visibleRowStartIndex - 1);
      const prefetchStop = Math.min(rowCount - 1, visibleRowStopIndex + 1);
      const indices: number[] = [];

      for (let row = prefetchStart; row <= prefetchStop; row += 1) {
        for (let col = 0; col < columnCount; col += 1) {
          const index = row * columnCount + col;
          if (index < items.length) {
            indices.push(index);
          }
        }
      }

      onVisibleIndicesChange(indices);
    },
    [columnCount, items.length, onVisibleIndicesChange, rowCount],
  );

  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
      const index = rowIndex * columnCount + columnIndex;
      const item = items[index];
      if (!item) {
        return <div style={style} />;
      }

      return (
        <div style={{ ...style, padding: gap / 2 }}>
          {renderItem(item, index)}
        </div>
      );
    },
    [columnCount, gap, items, renderItem],
  );

  if (items.length === 0) {
    return null;
  }

  if (useVirtualization && containerSize.width > 0) {
    return (
      <div ref={containerRef} className={`${scrollClassName} ${className}`}>
        <FixedSizeGrid
          columnCount={columnCount}
          rowCount={rowCount}
          columnWidth={columnWidth}
          rowHeight={rowHeight}
          width={Math.max(containerSize.width - gap, columnCount * columnWidth)}
          height={Math.max(containerSize.height - heightOffset, rowHeight)}
          style={{ overflowX: 'hidden' }}
          onItemsRendered={handleItemsRendered}
        >
          {Cell}
        </FixedSizeGrid>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <div className={nonVirtualClassName}>
        {items.map((item, index) => (
          <div key={getItemKey(item, index)}>{renderItem(item, index)}</div>
        ))}
      </div>
    </div>
  );
}

export const VirtualizedItemGrid = memo(VirtualizedItemGridInner) as typeof VirtualizedItemGridInner;
