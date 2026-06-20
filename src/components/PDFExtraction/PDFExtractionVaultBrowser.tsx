import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Expand, FileText, Loader2 } from 'lucide-react';
import { usePdfThumbnail } from '../../hooks/usePdfThumbnail';
import type { ModuleMenuThemeTokens } from '../../theme/moduleMenuTheme';
import { VirtualizedItemGrid } from '../Shared/VirtualizedItemGrid';
import { getVaultBrowserColumnCount } from '../../utils/virtualGridUtils';

export interface VaultPdfEntry {
  name: string;
  path: string;
}

interface PdfCardProps {
  file: VaultPdfEntry;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onExpand: () => void;
  t: ModuleMenuThemeTokens;
  isPastel: boolean;
}

const PdfCard = memo(function PdfCard({
  file,
  selected,
  disabled,
  onSelect,
  onExpand,
  t,
  isPastel,
}: PdfCardProps) {
  const { thumbnail, loading, unavailable } = usePdfThumbnail(file.path, { maxSize: 240 });

  return (
    <motion.button
      type="button"
      layout
      disabled={disabled}
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative flex flex-col overflow-hidden rounded-[22px] border text-left transition-shadow disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? isPastel
            ? 'border-purple-400/70 bg-white shadow-[0_12px_40px_rgba(168,85,247,0.2)] ring-2 ring-purple-300/40'
            : 'border-cyan-400/50 bg-gray-900/80 shadow-[0_12px_40px_rgba(34,211,238,0.15)] ring-2 ring-cyan-400/30'
          : `${t.promptIdle} hover:shadow-lg`
      }`}
    >
      <div
        className={`relative aspect-[3/4] w-full overflow-hidden ${
          isPastel ? 'bg-gradient-to-br from-purple-50/80 to-pink-50/60' : 'bg-black/30'
        }`}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className={`h-6 w-6 animate-spin ${isPastel ? 'text-purple-400' : 'text-cyan-400'}`} />
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
            <FileText className={`h-10 w-10 ${isPastel ? 'text-purple-300' : 'text-gray-500'}`} />
            {unavailable && (
              <span className={`text-[10px] uppercase tracking-wider ${t.mutedText}`}>No preview</span>
            )}
          </div>
        )}

        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t ${
            isPastel ? 'from-white via-white/80 to-transparent' : 'from-gray-950 via-gray-950/70 to-transparent'
          } p-3 pt-10`}
        >
          <p className={`truncate text-xs font-semibold ${isPastel ? 'text-gray-900' : 'text-white'}`}>
            {file.name}
          </p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onExpand();
          }}
          className={`absolute right-2 top-2 rounded-xl border p-2 opacity-0 shadow-lg transition-all group-hover:opacity-100 focus-visible:opacity-100 ${
            isPastel
              ? 'border-purple-200/60 bg-white/95 text-purple-600 hover:bg-white'
              : 'border-cyan-400/30 bg-gray-900/90 text-cyan-300 hover:bg-gray-800'
          }`}
          aria-label={`Open ${file.name} in PDF viewer`}
          title="Open in PDF viewer"
        >
          <Expand className="h-4 w-4" />
        </button>

        {selected && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isPastel ? 'bg-purple-500 text-white' : 'bg-cyan-500/90 text-gray-950'
            }`}
          >
            Active
          </span>
        )}
      </div>
    </motion.button>
  );
}, (prev, next) => (
  prev.file.path === next.file.path
  && prev.selected === next.selected
  && prev.disabled === next.disabled
  && prev.isPastel === next.isPastel
));

interface PDFExtractionVaultBrowserProps {
  files: VaultPdfEntry[];
  selectedPath: string | null;
  loading: boolean;
  disabled: boolean;
  onSelect: (path: string) => void;
  onExpand: (path: string) => void;
  t: ModuleMenuThemeTokens;
  isPastel: boolean;
  emptyHint?: string;
}

export function PDFExtractionVaultBrowser({
  files,
  selectedPath,
  loading,
  disabled,
  onSelect,
  onExpand,
  t,
  isPastel,
  emptyHint,
}: PDFExtractionVaultBrowserProps) {
  const renderCard = useCallback(
    (file: VaultPdfEntry) => (
      <PdfCard
        file={file}
        selected={selectedPath === file.path}
        disabled={disabled}
        onSelect={() => onSelect(file.path)}
        onExpand={() => onExpand(file.path)}
        t={t}
        isPastel={isPastel}
      />
    ),
    [disabled, isPastel, onExpand, onSelect, selectedPath, t],
  );

  if (loading) {
    return (
      <div className={`flex min-h-[10rem] items-center justify-center rounded-[22px] border ${t.compactInsetSurface}`}>
        <Loader2 className={`h-6 w-6 animate-spin ${isPastel ? 'text-purple-400' : 'text-cyan-400'}`} />
        <span className={`ml-3 text-sm ${t.mutedText}`}>Indexing case PDFs…</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={`rounded-[22px] border px-5 py-8 text-center ${t.compactInsetSurface}`}>
        <FileText className={`mx-auto h-10 w-10 ${isPastel ? 'text-purple-300' : 'text-gray-500'}`} />
        <p className={`mt-3 text-sm font-medium leading-6 ${t.mutedText}`}>
          {emptyHint ?? 'No PDF files in this case yet.'}
        </p>
      </div>
    );
  }

  return (
    <VirtualizedItemGrid
      items={files}
      getItemKey={(file) => file.path}
      getColumnCount={getVaultBrowserColumnCount}
      nonVirtualClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3"
      scrollClassName="w-full overflow-y-auto max-h-[min(52vh,520px)] pr-1"
      heightOffset={64}
      gap={12}
      renderItem={renderCard}
    />
  );
}
