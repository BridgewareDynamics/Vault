import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  CheckSquare,
  GalleryHorizontalEnd,
  LayoutGrid,
  Square,
} from 'lucide-react';
import { ExtractedPage } from '../types';
import type { ModuleMenuThemeTokens } from '../theme/moduleMenuTheme';
import { VirtualizedItemGrid } from './Shared/VirtualizedItemGrid';
import { getExtractionGridColumnCount } from '../utils/virtualGridUtils';

type ViewMode = 'filmstrip' | 'grid';

interface PDFExtractionResultsProps {
  pages: ExtractedPage[];
  selectedPages: Set<number>;
  onPageClick: (page: ExtractedPage) => void;
  onPageSelect: (pageNumber: number, selected: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isPastel?: boolean;
  activePageNumber?: number | null;
  t?: ModuleMenuThemeTokens;
}

interface PageCardProps {
  page: ExtractedPage;
  isSelected: boolean;
  isActive: boolean;
  isPastel: boolean;
  t?: ModuleMenuThemeTokens;
  viewMode: ViewMode;
  onInspect: () => void;
  onToggleSelect: () => void;
}

function PageCard({
  page,
  isSelected,
  isActive,
  isPastel,
  t,
  viewMode,
  onInspect,
  onToggleSelect,
}: PageCardProps) {
  const shellIdle = t?.promptIdle ?? (isPastel
    ? 'border-purple-200/50 bg-white/90 text-gray-800 hover:border-purple-300'
    : 'border-white/10 bg-gray-900/70 text-gray-100 hover:border-cyber-cyan-400/40');

  const activeShell = isPastel
    ? 'border-purple-500/80 bg-white shadow-[0_0_0_1px_rgba(168,85,247,0.35),0_16px_40px_rgba(168,85,247,0.18)] ring-1 ring-purple-300/50'
    : 'border-cyan-400/60 bg-gray-900/90 shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_16px_40px_rgba(34,211,238,0.12)] ring-1 ring-cyan-400/30';

  const selectedShell = isPastel
    ? 'border-pink-400/70 bg-white shadow-[0_8px_24px_rgba(236,72,153,0.12)]'
    : 'border-cyber-purple-400/50 bg-gray-900/85 shadow-[0_8px_24px_rgba(139,92,246,0.15)]';

  const shellClass = isActive ? activeShell : isSelected ? selectedShell : shellIdle;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      className={`group relative flex shrink-0 flex-col overflow-hidden rounded-[20px] border transition-shadow duration-200 ${
        viewMode === 'filmstrip' ? 'w-[8.75rem]' : 'w-full'
      } ${shellClass}`}
    >
      {isActive && (
        <span
          className={`absolute left-0 top-3 bottom-12 z-10 w-1 rounded-r-full ${
            isPastel ? 'bg-purple-500' : 'bg-cyan-400'
          }`}
          aria-hidden
        />
      )}

      <button
        type="button"
        onClick={onInspect}
        className={`relative block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isPastel
            ? 'focus-visible:ring-purple-400 focus-visible:ring-offset-white'
            : 'focus-visible:ring-cyan-400 focus-visible:ring-offset-gray-950'
        }`}
        aria-label={`Inspect page ${page.pageNumber}`}
        aria-pressed={isActive}
      >
        <div
          className={`relative aspect-[3/4] overflow-hidden ${
            isPastel ? 'bg-gradient-to-br from-purple-50/90 to-pink-50/50' : 'bg-black/35'
          }`}
        >
          <img
            src={page.imageData}
            alt={`Page ${page.pageNumber}`}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            draggable={false}
          />

          {isActive && (
            <span
              className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${
                isPastel ? 'bg-purple-600 text-white' : 'bg-cyan-500/90 text-gray-950'
              }`}
            >
              Inspecting
            </span>
          )}
        </div>
      </button>

      <div
        className={`flex items-center justify-between gap-2 border-t px-2.5 py-2 ${
          isPastel ? 'border-purple-100/80 bg-white/95' : 'border-white/10 bg-black/30'
        }`}
      >
        <div className="min-w-0">
          <p
            className={`font-mono text-[11px] font-semibold tabular-nums ${
              isPastel ? 'text-gray-800' : 'text-gray-100'
            }`}
          >
            {String(page.pageNumber).padStart(2, '0')}
          </p>
          <p
            className={`truncate text-[9px] uppercase tracking-[0.12em] opacity-0 transition-opacity group-hover:opacity-100 ${
              isPastel ? 'text-purple-600' : 'text-cyan-300'
            }`}
          >
            Inspect
          </p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelect();
          }}
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            isSelected
              ? isPastel
                ? 'border-pink-400/70 bg-pink-500 text-white'
                : 'border-cyber-purple-400/60 bg-cyber-purple-500/90 text-white'
              : isPastel
              ? `${t?.toolbar?.iconBtn ?? 'border-purple-200/60 bg-white/90 text-purple-600 hover:bg-purple-50'}`
              : `${t?.toolbar?.iconBtn ?? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}`
          }`}
          aria-label={isSelected ? `Deselect page ${page.pageNumber}` : `Select page ${page.pageNumber}`}
          aria-pressed={isSelected}
        >
          {isSelected ? <Check className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
        </button>
      </div>
    </motion.article>
  );
}

export function PDFExtractionResults({
  pages,
  selectedPages,
  onPageClick,
  onPageSelect,
  onSelectAll,
  onDeselectAll,
  isPastel = false,
  activePageNumber = null,
  t,
}: PDFExtractionResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('filmstrip');

  const allSelected = useMemo(
    () => pages.length > 0 && pages.every((p) => selectedPages.has(p.pageNumber)),
    [pages, selectedPages]
  );

  const someSelected = useMemo(
    () => pages.some((p) => selectedPages.has(p.pageNumber)),
    [pages, selectedPages]
  );

  const handleToggleAll = () => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const toolbarShell =
    t?.toolbar?.shell ??
    (isPastel
      ? 'border-purple-200/50 bg-white/88 text-gray-800'
      : 'border-cyber-purple-500/35 bg-gray-900/88 text-white');

  const secondaryBtn =
    t?.secondaryButton ??
    (isPastel
      ? 'border-purple-200/60 bg-white/80 text-gray-700 hover:border-purple-300 hover:bg-white'
      : 'border-white/10 bg-white/5 text-gray-200 hover:border-cyber-cyan-400/50 hover:bg-white/10');

  const sectionLabel = t?.sectionLabel ?? (isPastel ? 'font-semibold text-purple-800' : 'font-semibold text-cyan-200');
  const mutedText = t?.mutedText ?? (isPastel ? 'text-gray-700' : 'text-gray-200');

  const statBox = t?.statBox ?? (isPastel ? 'bg-white/85' : 'bg-black/25');
  const badgeNeutral = t?.badgeNeutral ?? (isPastel
    ? 'border-purple-200/60 bg-white/80 text-gray-700'
    : 'border-white/10 bg-black/20 text-gray-200');

  const renderGridPage = useCallback(
    (page: ExtractedPage) => (
      <PageCard
        page={page}
        isSelected={selectedPages.has(page.pageNumber)}
        isActive={activePageNumber === page.pageNumber}
        isPastel={isPastel}
        t={t}
        viewMode="grid"
        onInspect={() => onPageClick(page)}
        onToggleSelect={() => onPageSelect(page.pageNumber, !selectedPages.has(page.pageNumber))}
      />
    ),
    [activePageNumber, isPastel, onPageClick, onPageSelect, selectedPages, t],
  );

  if (pages.length === 0) {
    return (
      <div className={`py-10 text-center text-sm ${mutedText}`}>
        No pages extracted yet. Run conversion to populate the output queue.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-[22px] border p-4 ${toolbarShell}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-[10px] uppercase tracking-[0.24em] ${sectionLabel}`}>Output queue</p>
            <p className={`mt-1 text-sm leading-5 ${mutedText}`}>
              Select pages to save, or inspect any frame in the side preview.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${badgeNeutral}`}>
              {pages.length} frame{pages.length !== 1 ? 's' : ''}
            </span>
            {someSelected && (
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  isPastel ? t?.badgeVault ?? 'border-cyan-200/60 bg-cyan-50/90 text-cyan-700' : 'border-cyber-cyan-400/25 bg-cyber-cyan-500/10 text-cyber-cyan-300'
                }`}
              >
                {selectedPages.size} queued
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleToggleAll}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${secondaryBtn}`}
            aria-label={allSelected ? 'Deselect all pages' : 'Select all pages'}
          >
            {allSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
            {allSelected ? 'Clear queue' : 'Queue all'}
          </button>

          <div
            className={`inline-flex rounded-xl border p-0.5 ${isPastel ? 'border-purple-200/50 bg-white/70' : 'border-white/10 bg-black/25'}`}
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('filmstrip')}
              className={`inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                viewMode === 'filmstrip'
                  ? isPastel
                    ? t?.toolbar?.selected ?? 'bg-purple-50 text-gray-900'
                    : t?.toolbar?.selected ?? 'bg-cyan-500/15 text-white'
                  : isPastel
                  ? t?.toolbar?.unselected ?? 'text-gray-600 hover:bg-white'
                  : t?.toolbar?.unselected ?? 'text-gray-300 hover:bg-white/10'
              }`}
              aria-pressed={viewMode === 'filmstrip'}
            >
              <GalleryHorizontalEnd className="h-3.5 w-3.5" />
              Filmstrip
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                viewMode === 'grid'
                  ? isPastel
                    ? t?.toolbar?.selected ?? 'bg-purple-50 text-gray-900'
                    : t?.toolbar?.selected ?? 'bg-cyan-500/15 text-white'
                  : isPastel
                  ? t?.toolbar?.unselected ?? 'text-gray-600 hover:bg-white'
                  : t?.toolbar?.unselected ?? 'text-gray-300 hover:bg-white/10'
              }`}
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <VirtualizedItemGrid
              items={pages}
              getItemKey={(page) => String(page.pageNumber)}
              getColumnCount={getExtractionGridColumnCount}
              nonVirtualClassName={`vault-studio-scroll grid max-h-[min(52vh,520px)] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3 lg:grid-cols-4`}
              scrollClassName="vault-studio-scroll w-full overflow-y-auto max-h-[min(52vh,520px)] pr-1"
              heightOffset={64}
              gap={12}
              renderItem={renderGridPage}
            />
          </motion.div>
        ) : (
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={`vault-studio-scroll flex gap-3 overflow-x-auto pb-1 pt-0.5 ${statBox} rounded-[22px] border px-3 py-3 ${
            isPastel ? 'border-purple-200/40' : 'border-white/10'
          }`}
        >
          {pages.map((page) => (
            <PageCard
              key={page.pageNumber}
              page={page}
              isSelected={selectedPages.has(page.pageNumber)}
              isActive={activePageNumber === page.pageNumber}
              isPastel={isPastel}
              t={t}
              viewMode={viewMode}
              onInspect={() => onPageClick(page)}
              onToggleSelect={() => onPageSelect(page.pageNumber, !selectedPages.has(page.pageNumber))}
            />
          ))}
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
