import type { ReactNode, RefObject } from 'react';
import { Theme } from '../../types';
import { useNovelTheme } from './novelTheme';
import { formatBookDimensions } from './engine/bookSizes';
import type { BookDisplayMetrics } from './engine/bookSizes';

interface BookStageProps {
  theme: Theme;
  metrics: BookDisplayMetrics;
  containerRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

export function BookStage({ theme, metrics, containerRef, children }: BookStageProps) {
  const t = useNovelTheme(theme);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-1 min-h-0 flex-col overflow-hidden ${t.stageBackground}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: t.stageVignette }} />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6">
        <div className="mb-4 flex items-center gap-3 text-xs tracking-wide">
          <span className={`rounded-full border px-3 py-1 ${t.sizeBadge}`}>
            {metrics.preset.name}
          </span>
          <span className={t.muted}>{formatBookDimensions(metrics.preset)}</span>
        </div>
        <div
          className="relative flex items-stretch justify-center overflow-visible"
          style={{
            perspective: 2400,
            perspectiveOrigin: '50% 42%',
          }}
        >
        <div
          className="relative flex items-stretch"
          style={{
            transform: `scale(${Math.min(1, metrics.scale + 0.02)})`,
          }}
        >
            {children}
          </div>
          <div
            className="pointer-events-none absolute -bottom-6 left-1/2 h-8 w-[88%] -translate-x-1/2 rounded-[100%] blur-xl"
            style={{ background: t.bookDeskShadow }}
          />
        </div>
      </div>
    </div>
  );
}
