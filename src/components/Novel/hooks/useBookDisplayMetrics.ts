import { useEffect, useState } from 'react';
import {
  BookDisplayMetrics,
  computeBookDisplayMetrics,
  getBookSizePreset,
} from '../engine/bookSizes';

const FALLBACK: BookDisplayMetrics = computeBookDisplayMetrics(
  'us-trade',
  undefined,
  900,
  600
);

export function useBookDisplayMetrics(
  bookSizeId: string | undefined,
  marginMm: number | undefined,
  containerRef: React.RefObject<HTMLElement | null>
): BookDisplayMetrics {
  const [metrics, setMetrics] = useState<BookDisplayMetrics>(FALLBACK);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      setMetrics(
        computeBookDisplayMetrics(
          bookSizeId,
          marginMm,
          element.clientWidth,
          element.clientHeight
        )
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [bookSizeId, marginMm, containerRef]);

  return metrics;
}

export function useBookSizeLabel(bookSizeId: string | undefined): string {
  return getBookSizePreset(bookSizeId).name;
}
