import { motion } from 'framer-motion';
import { Expand, FileText, HardDriveDownload, Loader2, X } from 'lucide-react';
import { usePdfThumbnail } from '../../hooks/usePdfThumbnail';
import type { ModuleMenuThemeTokens } from '../../theme/moduleMenuTheme';

interface PDFExtractionSourceHeroProps {
  filePath: string | null;
  fileName: string | null;
  totalPages: number;
  origin: 'vault' | 'external' | null;
  disabled: boolean;
  onBrowseExternal: () => void;
  onClear: () => void;
  onExpand: () => void;
  t: ModuleMenuThemeTokens;
  isPastel: boolean;
}

export function PDFExtractionSourceHero({
  filePath,
  fileName,
  totalPages,
  origin,
  disabled,
  onBrowseExternal,
  onClear,
  onExpand,
  t,
  isPastel,
}: PDFExtractionSourceHeroProps) {
  const { thumbnail, loading, unavailable } = usePdfThumbnail(filePath, { maxSize: 480 });

  if (!filePath || !fileName) {
    return (
      <div className={`rounded-[26px] border p-8 text-center ${t.dialogInset}`}>
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${t.button}`}>
          <FileText className="h-8 w-8 text-white" />
        </div>
        <p className={`mt-4 text-base font-semibold ${isPastel ? 'text-gray-900' : 'text-white'}`}>
          No document loaded
        </p>
        <p className={`mt-2 text-sm leading-6 ${t.mutedText}`}>
          Select a case PDF from the library or browse an external file to begin rasterization.
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={onBrowseExternal}
          className={`mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${t.secondaryButton}`}
        >
          <HardDriveDownload className="h-4 w-4" />
          Browse external PDF
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-[26px] border ${t.insetSurface}`}
    >
      <div className={`flex items-start justify-between gap-3 border-b px-4 py-3 ${t.softInsetSurface}`}>
        <div className="min-w-0 flex-1">
          <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Active document</p>
          <p className={`mt-1 truncate text-sm font-semibold ${isPastel ? 'text-gray-900' : 'text-white'}`}>
            {fileName}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {origin && (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  origin === 'vault' ? t.badgeVault : t.badgeNeutral
                }`}
              >
                {origin === 'vault' ? 'Vault' : 'External'}
              </span>
            )}
            {totalPages > 0 && (
              <span className={`text-xs ${t.mutedText}`}>{totalPages} pages detected</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={onExpand}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${t.secondaryButton}`}
            title="Open in PDF viewer"
          >
            <Expand className="h-4 w-4" />
            Open PDF
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className={`rounded-xl border p-2 disabled:opacity-50 ${t.dialogCancel}`}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={`relative min-h-[16rem] ${isPastel ? 'bg-black/[0.03]' : 'bg-black/25'}`}>
        {loading ? (
          <div className="flex min-h-[16rem] items-center justify-center gap-3">
            <Loader2 className={`h-7 w-7 animate-spin ${isPastel ? 'text-purple-400' : 'text-cyan-400'}`} />
            <span className={`text-sm ${t.mutedText}`}>Rendering preview…</span>
          </div>
        ) : thumbnail ? (
          <div className="flex min-h-[16rem] items-center justify-center p-5">
            <img
              src={thumbnail}
              alt={`Preview of ${fileName}`}
              className="max-h-[22rem] w-full rounded-[20px] object-contain shadow-2xl"
            />
          </div>
        ) : (
          <div className={`flex min-h-[16rem] flex-col items-center justify-center gap-3 ${t.mutedText}`}>
            <FileText className="h-12 w-12 opacity-40" />
            <p className="text-sm">
              {unavailable
                ? 'Cover preview unavailable — open the PDF viewer for full fidelity.'
                : 'Loading document preview…'}
            </p>
            <button
              type="button"
              disabled={disabled}
              onClick={onExpand}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${t.button}`}
            >
              <Expand className="h-4 w-4" />
              Open in viewer
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
