import { useRef } from 'react';
import { Eye, EyeOff, ImagePlus } from 'lucide-react';
import { NovelDocument } from '../../types';
import { Theme } from '../../types';
import { useNovelTheme } from './novelTheme';
import { formatFontFamilyCss } from './novelFontUtils';
import { BookPageShell } from './BookPageShell';
import type { BookDisplayMetrics } from './engine/bookSizes';

const COVER_EDITION_LABEL = 'Vault Research Edition';
const AUTHOR_PLACEHOLDER = 'Author name';

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
  const authorRef = useRef<HTMLDivElement>(null);
  const showEditionBadge = document.settings.showCoverEditionBadge !== false;

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
              style={{ fontFamily: formatFontFamilyCss(document.settings.fontFamily) }}
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
              style={{ fontFamily: formatFontFamilyCss(document.settings.fontFamily) }}
              onBlur={() =>
                onUpdateSettings({ coverSubtitle: subtitleRef.current?.textContent?.trim() || '' })
              }
            >
              {document.settings.coverSubtitle || 'Subtitle or tagline'}
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-2 px-[6%] pb-10">
            <div
              ref={authorRef}
              contentEditable
              suppressContentEditableWarning
              className={`outline-none text-sm ${document.settings.coverAuthor ? 'opacity-90' : 'opacity-50 italic'}`}
              style={{ fontFamily: formatFontFamilyCss(document.settings.fontFamily) }}
              onBlur={() => {
                const raw = authorRef.current?.textContent?.trim() || '';
                const nextAuthor = raw === AUTHOR_PLACEHOLDER ? '' : raw;
                onUpdateSettings({ coverAuthor: nextAuthor });
              }}
            >
              {document.settings.coverAuthor || AUTHOR_PLACEHOLDER}
            </div>

            {showEditionBadge ? (
              <div className="group flex items-center gap-2">
                <p className="text-xs uppercase tracking-[0.25em] opacity-60">{COVER_EDITION_LABEL}</p>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateSettings({ showCoverEditionBadge: false });
                  }}
                  className={`rounded-md border p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 ${t.badgeNeutral}`}
                  title="Hide edition label"
                  aria-label="Hide Vault Research Edition label"
                >
                  <EyeOff className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.stopPropagation();
                  onUpdateSettings({ showCoverEditionBadge: true });
                }}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] uppercase tracking-[0.18em] opacity-60 transition-opacity hover:opacity-100 ${t.badgeNeutral}`}
                title="Show edition label"
              >
                <Eye className="h-3 w-3" />
                Show edition label
              </button>
            )}
          </div>
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
