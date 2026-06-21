import type { RefObject } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderInput,
  FolderOutput,
  ImagePlus,
  Save,
  StickyNote,
} from 'lucide-react';
import { useNovelTheme } from './novelTheme';
import { Theme } from '../../types';

interface NovelEditorToolbarProps {
  theme: Theme;
  titleDraft: string;
  onTitleChange: (value: string) => void;
  onTitleCommit: () => void;
  onTitleEscape: () => void;
  titleInputRef?: RefObject<HTMLInputElement>;
  bookSizeLabel?: string;
  saving: boolean;
  dirty: boolean;
  isWordEditorOpen: boolean;
  onSave: () => void;
  onAssignCase: () => void;
  onMoveToLibrary: () => void;
  onExport: () => void;
  onToggleWordEditor: () => void;
  onPrevSpread: () => void;
  onNextSpread: () => void;
  spreadLabel: string;
  showCoverImageButton?: boolean;
  selectingCoverImage?: boolean;
  onSelectCoverImage?: () => void;
}

export function NovelEditorToolbar({
  theme,
  titleDraft,
  onTitleChange,
  onTitleCommit,
  onTitleEscape,
  titleInputRef,
  bookSizeLabel,
  saving,
  dirty,
  isWordEditorOpen,
  onSave,
  onAssignCase,
  onMoveToLibrary,
  onExport,
  onToggleWordEditor,
  onPrevSpread,
  onNextSpread,
  spreadLabel,
  showCoverImageButton = false,
  selectingCoverImage = false,
  onSelectCoverImage,
}: NovelEditorToolbarProps) {
  const t = useNovelTheme(theme);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 ${t.dialogFooter}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <BookOpen className={`h-5 w-5 shrink-0 ${t.primary}`} />
        <div className="min-w-0 flex-1 max-w-md">
          <input
            ref={titleInputRef}
            type="text"
            value={titleDraft}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={onTitleCommit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
              if (event.key === 'Escape') {
                onTitleEscape();
                event.currentTarget.blur();
              }
            }}
            placeholder="Untitled Novel"
            className={`w-full truncate rounded-xl border px-3 py-1.5 text-base font-semibold outline-none ${t.titleInput}`}
            aria-label="Book title"
          />
          <p className={`mt-0.5 text-xs ${t.muted}`}>
            {spreadLabel}
            {bookSizeLabel ? ` · ${bookSizeLabel}` : ''}
            {dirty ? ' · Unsaved changes' : saving ? ' · Saving...' : ''}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className={`flex items-center rounded-xl border ${t.badgeNeutral}`}>
          <button
            type="button"
            onClick={onPrevSpread}
            className="rounded-l-xl px-3 py-2 hover:bg-white/5"
            aria-label="Previous spread"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className={`border-x px-3 py-2 text-xs ${t.muted}`}>{spreadLabel}</div>
          <button
            type="button"
            onClick={onNextSpread}
            className="rounded-r-xl px-3 py-2 hover:bg-white/5"
            aria-label="Next spread"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {showCoverImageButton && onSelectCoverImage && (
          <button
            type="button"
            onClick={onSelectCoverImage}
            disabled={selectingCoverImage}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${t.badgeNeutral} disabled:cursor-wait disabled:opacity-60`}
          >
            <ImagePlus className="h-4 w-4" />
            {selectingCoverImage ? 'Opening picker...' : 'Cover image'}
          </button>
        )}
        <button type="button" onClick={onSave} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${t.button}`}>
          <Save className="h-4 w-4" />
          Save
        </button>
        <button type="button" onClick={onAssignCase} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${t.badgeNeutral}`}>
          <FolderInput className="h-4 w-4" />
          Assign case
        </button>
        <button type="button" onClick={onMoveToLibrary} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${t.badgeNeutral}`}>
          <FolderOutput className="h-4 w-4" />
          Move to Library
        </button>
        <button type="button" onClick={onExport} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${t.badgeNeutral}`}>
          <Download className="h-4 w-4" />
          Export
        </button>
        <button
          type="button"
          onClick={onToggleWordEditor}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${isWordEditorOpen ? t.button : t.badgeNeutral}`}
        >
          <StickyNote className="h-4 w-4" />
          Notes
        </button>
      </div>
    </div>
  );
}
