import { motion } from 'framer-motion';
import { Loader2, X, Zap } from 'lucide-react';
import { FileConverterProgress as ProgressType, Theme } from '../../types';
import { useFileConverterTheme } from './fileConverterTheme';

interface FileConverterProgressProps {
  progress: ProgressType;
  onCancel?: () => void;
  theme: Theme;
}

export function FileConverterProgressPanel({ progress, onCancel, theme }: FileConverterProgressProps) {
  const t = useFileConverterTheme(theme);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.button}`}>
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
          <div>
            <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Engine active</p>
            <p className={`text-lg font-semibold ${t.heading}`}>Converting evidence…</p>
            <p className={`mt-1 text-sm ${t.mutedText}`}>{progress.statusMessage}</p>
          </div>
        </div>
        {progress.cancellable && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`rounded-2xl border p-2.5 ${t.dialogCancel}`}
            aria-label="Cancel conversion"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className={`rounded-[22px] border p-4 ${t.softInsetSurface}`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className={`h-4 w-4 ${t.primary}`} />
            <span className={`text-xs uppercase tracking-[0.18em] ${t.sectionLabel}`}>{progress.phase}</span>
          </div>
          <span className={`text-sm font-semibold ${t.heading}`}>{Math.round(progress.percent)}%</span>
        </div>
        <div className={`h-2.5 overflow-hidden rounded-full ${t.progressTrack}`}>
          <motion.div
            className={`h-full rounded-full ${t.button}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
