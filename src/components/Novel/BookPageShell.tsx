import type { ReactNode, CSSProperties } from 'react';
import { Theme } from '../../types';
import { useNovelTheme } from './novelTheme';
import type { BookDisplayMetrics } from './engine/bookSizes';

interface BookPageShellProps {
  theme: Theme;
  metrics: BookDisplayMetrics;
  side: 'left' | 'right' | 'cover';
  pageNumber?: number | null;
  showPageNumbers?: boolean;
  variant?: 'content' | 'cover' | 'blank';
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
  isActiveTypingPage?: boolean;
  isImageDropTarget?: boolean;
}

export function BookPageShell({
  theme,
  metrics,
  side,
  pageNumber,
  showPageNumbers,
  variant = 'content',
  className = '',
  children,
  style,
  onDragOver,
  onDrop,
  isActiveTypingPage = false,
  isImageDropTarget = false,
}: BookPageShellProps) {
  const t = useNovelTheme(theme);
  const isCover = variant === 'cover';
  const isBlank = variant === 'blank';

  return (
    <div
      className={`group/page relative shrink-0 ${className} ${
        isActiveTypingPage ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-transparent' : ''
      } ${isImageDropTarget ? 'ring-2 ring-cyan-400/70 ring-offset-2 ring-offset-transparent' : ''}`}
      style={{
        width: metrics.pageWidthPx,
        height: metrics.pageHeightPx,
        ...style,
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div
        className={`absolute inset-0 overflow-hidden ${t.pagePaper} ${
          isBlank ? 'opacity-40' : ''
        }`}
        style={{
          borderRadius: side === 'left' ? '3px 0 0 3px' : side === 'right' ? '0 3px 3px 0' : '3px',
          boxShadow: t.pageDropShadow,
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.35]" style={{ background: t.pageTexture }} />
        {side === 'left' && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8"
            style={{ background: t.pageEdgeShadowLeft }}
          />
        )}
        {side === 'right' && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-8"
            style={{ background: t.pageEdgeShadowRight }}
          />
        )}
        {isCover && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10"
            style={{ background: t.coverSpineGradient }}
          />
        )}
        {!isBlank && (
          <div
            className={`relative flex h-full flex-col ${isCover ? 'overflow-visible' : 'overflow-hidden'}`}
            style={{ padding: metrics.marginPx }}
          >
            {children}
            {showPageNumbers && pageNumber != null && !isCover && (
              <div
                className={`pointer-events-none absolute bottom-0 left-0 right-0 text-center text-[10px] tracking-widest uppercase ${t.pageNumber}`}
                style={{ paddingBottom: Math.max(8, metrics.marginPx * 0.35) }}
              >
                {pageNumber}
              </div>
            )}
          </div>
        )}
      </div>
      <div
        className="pointer-events-none absolute -inset-x-1 -bottom-2 h-3 rounded-[100%] opacity-30 blur-md transition-opacity group-hover/page:opacity-45"
        style={{ background: t.pageCastShadow }}
      />
    </div>
  );
}
