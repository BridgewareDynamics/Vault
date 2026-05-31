import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { NovelDocument } from '../../types';
import { Theme } from '../../types';
import { useNovelTheme } from './novelTheme';
import { BookPageShell } from './BookPageShell';
import type { BookDisplayMetrics } from './engine/bookSizes';

interface BookCoverPageProps {
  theme: Theme;
  metrics: BookDisplayMetrics;
  document: NovelDocument;
  onUpdateSettings: (settings: Partial<NovelDocument['settings']>) => void;
  onSelectCoverImage?: () => void;
  coverImageUrl?: string | null;
  selectingCoverImage?: boolean;
}

export function BookCoverPage({
  theme,
  metrics,
  document,
  onUpdateSettings,
  onSelectCoverImage,
  coverImageUrl,
  selectingCoverImage = false,
}: BookCoverPageProps) {
  const t = useNovelTheme(theme);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

  const triggerCoverImagePicker = () => {
    onSelectCoverImage?.();
  };

  return (
    <div className="relative shrink-0" style={{ width: metrics.pageWidthPx, height: metrics.pageHeightPx }}>
      <BookPageShell theme={theme} metrics={metrics} side="cover" variant="cover">
        {coverImageUrl && (
          <img
            src={coverImageUrl}
            alt=""
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-35"
          />
        )}
        <div className="relative z-10 flex h-full flex-col items-center justify-between py-[8%] text-center">
          <div className="w-full space-y-3 px-[6%]">
            <div
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              className="outline-none font-serif text-[clamp(1.1rem,4.5vw,1.75rem)] font-bold leading-tight tracking-tight"
              style={{ fontFamily: document.settings.fontFamily }}
              onBlur={() =>
                onUpdateSettings({ coverTitle: titleRef.current?.textContent?.trim() || document.title })
              }
            >
              {document.settings.coverTitle}
            </div>
            <div className={`mx-auto h-px w-12 ${t.isPastel ? 'bg-stone-400/50' : 'bg-amber-500/30'}`} />
            <div
              ref={subtitleRef}
              contentEditable
              suppressContentEditableWarning
              className="outline-none text-sm opacity-75"
              style={{ fontFamily: document.settings.fontFamily }}
              onBlur={() =>
                onUpdateSettings({ coverSubtitle: subtitleRef.current?.textContent?.trim() || '' })
              }
            >
              {document.settings.coverSubtitle || 'Subtitle or tagline'}
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.25em] opacity-60">Vault Research Edition</p>
        </div>
      </BookPageShell>

      {onSelectCoverImage && (
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            triggerCoverImagePicker();
          }}
          disabled={selectingCoverImage}
          className={`absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-lg transition-colors ${t.badgeNeutral} hover:opacity-90 disabled:cursor-wait disabled:opacity-60`}
        >
          <ImagePlus className="h-3.5 w-3.5" />
          {selectingCoverImage ? 'Opening image picker...' : coverImageUrl ? 'Change cover image' : 'Choose cover image'}
        </button>
      )}
    </div>
  );
}
