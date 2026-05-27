import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, AudioLines, Clock3, FolderOpen, Trash2, X } from 'lucide-react';
import { Theme, TranscriptionListEntry } from '../../types';
import { useTranscriptionTheme } from './transcriptionTheme';

interface DeleteTranscriptionDialogProps {
  isOpen: boolean;
  theme: Theme;
  entry: TranscriptionListEntry | null;
  deleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function formatModifiedTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Updated just now';
  if (diffHours < 24) return `Updated ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `Updated ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function DeleteTranscriptionDialog({
  isOpen,
  theme,
  entry,
  deleting = false,
  onClose,
  onConfirm,
}: DeleteTranscriptionDialogProps) {
  const t = useTranscriptionTheme(theme);

  if (!isOpen || !entry) return null;

  const insetSurface = t.isPastel
    ? 'border-purple-200/40 bg-white/80'
    : 'border-white/10 bg-black/25';
  const scopeBadge = entry.casePath
    ? t.isPastel
      ? 'border-emerald-200/60 bg-emerald-50/90 text-emerald-700'
      : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
    : t.isPastel
      ? 'border-cyan-200/60 bg-cyan-50/90 text-cyan-700'
      : 'border-cyber-cyan-400/20 bg-cyber-cyan-500/10 text-cyber-cyan-300';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={deleting ? undefined : onClose}
        className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-transcription-dialog-title"
        aria-describedby="delete-transcription-dialog-description"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-lg overflow-hidden rounded-2xl border-2 shadow-2xl ${
            t.isPastel
              ? 'border-red-300/60 bg-gradient-to-br from-white to-pink-50'
              : 'border-red-500/50 bg-gradient-to-br from-gray-900 to-gray-950'
          }`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl border p-2 ${
                  t.isPastel
                    ? 'border-red-200 bg-red-50 text-red-500'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 id="delete-transcription-dialog-title" className="text-xl font-bold text-red-400">
                  Delete Transcription
                </h2>
                <p className={`text-sm ${t.muted}`}>Remove this workspace from your library</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-50"
              aria-label="Close delete dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 px-6 py-5">
            <p
              id="delete-transcription-dialog-description"
              className={`text-sm leading-6 ${t.isPastel ? 'text-gray-700' : 'text-gray-200'}`}
            >
              Are you sure you want to delete{' '}
              <span className="font-semibold">{entry.title.trim() ? `"${entry.title}"` : 'this workspace'}</span>
              ? This cannot be undone.
            </p>

            <div className={`rounded-2xl border p-4 ${insetSurface}`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-2xl p-2.5 ${t.button}`}>
                  <AudioLines className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${scopeBadge}`}
                    >
                      {entry.casePath ? 'Case linked' : 'Vault'}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                        t.isPastel
                          ? 'border-purple-200/60 bg-white/85 text-purple-600'
                          : 'border-white/10 bg-black/20 text-gray-200'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                  <p className={`text-base font-bold leading-snug ${t.isPastel ? 'text-gray-900' : 'text-white'}`}>
                    {entry.title}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className={`rounded-xl px-3 py-2.5 ${t.isPastel ? 'bg-white/90' : 'bg-black/30'}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${t.primary}`}>Sources</p>
                  <p className="mt-1 text-lg font-bold">{entry.sourceCount}</p>
                </div>
                <div className={`rounded-xl px-3 py-2.5 ${t.isPastel ? 'bg-white/90' : 'bg-black/30'}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${t.primary}`}>Last updated</p>
                  <div className={`mt-1 flex items-center gap-1.5 text-sm ${t.muted}`}>
                    <Clock3 className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatModifiedTime(entry.modified)}</span>
                  </div>
                </div>
              </div>

              <div className={`mt-3 rounded-xl px-3 py-2.5 ${t.isPastel ? 'bg-white/90' : 'bg-black/30'}`}>
                <div className="flex items-start gap-2">
                  <FolderOpen className={`mt-0.5 h-4 w-4 shrink-0 ${t.primary}`} />
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${t.primary}`}>Context</p>
                    <p className={`mt-1 text-sm ${t.muted}`}>{entry.caseName || 'Vault global storage'}</p>
                  </div>
                </div>
              </div>

              {entry.excerpt?.trim() && (
                <div className={`mt-3 rounded-xl px-3 py-2.5 ${t.isPastel ? 'bg-white/90' : 'bg-black/30'}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${t.primary}`}>Excerpt</p>
                  <p className={`mt-1 line-clamp-2 text-sm leading-relaxed ${t.muted}`}>{entry.excerpt}</p>
                </div>
              )}
            </div>

            <p className="text-sm text-red-400">
              Permanently removes the transcription folder, transcript text, and linked source assets from disk.
            </p>
          </div>

          <div
            className={`flex gap-3 border-t px-6 py-4 ${
              t.isPastel ? 'border-pink-200/30 bg-pink-50/30' : 'border-white/10 bg-black/20'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className={`flex-1 rounded-xl border px-4 py-2.5 font-medium disabled:opacity-50 ${t.card}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting…' : 'Delete Transcription'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
