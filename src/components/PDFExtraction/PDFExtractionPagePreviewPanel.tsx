import { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckSquare, Square, ScanLine, X } from 'lucide-react';
import { ExtractedPage } from '../../types';
import type { ModuleMenuThemeTokens } from '../../theme/moduleMenuTheme';

interface PDFExtractionPagePreviewPanelProps {
  page: ExtractedPage;
  pages: ExtractedPage[];
  isSelected: boolean;
  onClose: () => void;
  onNavigate: (page: ExtractedPage) => void;
  onToggleSelect: (pageNumber: number, selected: boolean) => void;
  t: ModuleMenuThemeTokens;
  isPastel: boolean;
}

export function PDFExtractionPagePreviewPanel({
  page,
  pages,
  isSelected,
  onClose,
  onNavigate,
  onToggleSelect,
  t,
  isPastel,
}: PDFExtractionPagePreviewPanelProps) {
  const currentIndex = pages.findIndex((p) => p.pageNumber === page.pageNumber);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < pages.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      onNavigate(pages[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, pages, onNavigate]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      onNavigate(pages[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, pages, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, onClose]);

  const valueTone = isPastel ? 'text-purple-700' : 'text-cyan-200';

  return (
    <motion.div
      key="pdf-page-preview-panel"
      initial={{ opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      onClick={(event) => event.stopPropagation()}
      className={`flex max-h-[min(90vh,860px)] w-full min-w-[min(100%,20rem)] max-w-2xl shrink-0 flex-col overflow-hidden rounded-[32px] border shadow-2xl xl:min-w-[28rem] xl:max-w-[36rem] 2xl:max-w-[42rem] ${t.dialogShellLarge}`}
    >
      <div className={`shrink-0 border-b px-6 py-5 ${t.dialogHeader}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`shrink-0 rounded-2xl p-3 ${t.button}`}>
              <ScanLine className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className={`text-xs uppercase tracking-[0.28em] ${valueTone}`}>Frame inspector</p>
              <h2
                className={`truncate text-xl font-bold ${isPastel ? 'text-gray-900' : 'text-white'}`}
              >
                Page {page.pageNumber}
              </h2>
              <p className={`mt-1 text-sm ${t.mutedText}`}>
                {currentIndex >= 0 ? `${currentIndex + 1} of ${pages.length}` : ''} extracted pages
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 rounded-xl border p-2.5 ${t.dialogCancel}`}
            aria-label="Close page preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="vault-studio-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div
          className={`flex min-h-[min(58vh,640px)] items-center justify-center rounded-[26px] border p-4 ${t.dialogPreviewPanel}`}
        >
          <img
            src={page.imageData}
            alt={`Page ${page.pageNumber}`}
            className="max-h-[min(72vh,720px)] w-full rounded-[18px] object-contain shadow-xl"
          />
        </div>
      </div>

      <div className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-6 py-4 ${t.dialogFooter}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={goToPrev}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${t.secondaryButton}`}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <button
            type="button"
            disabled={!hasNext}
            onClick={goToNext}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${t.secondaryButton}`}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onToggleSelect(page.pageNumber, !isSelected)}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${t.secondaryButton}`}
          aria-label={isSelected ? 'Deselect page' : 'Select page for save'}
        >
          {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          {isSelected ? 'Selected for save' : 'Select for save'}
        </button>
      </div>
    </motion.div>
  );
}
