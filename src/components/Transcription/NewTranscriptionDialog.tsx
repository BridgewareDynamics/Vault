import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AudioLines, FolderOpen, X } from 'lucide-react';
import { Theme } from '../../types';
import { useTranscriptionTheme } from './transcriptionTheme';

interface NewTranscriptionDialogProps {
  isOpen: boolean;
  theme: Theme;
  defaultTitle?: string;
  linkedCaseName?: string | null;
  onClose: () => void;
  onConfirm: (title: string) => void;
  onAssignCase: () => void;
  onClearCase?: () => void;
}

export function NewTranscriptionDialog({
  isOpen,
  theme,
  defaultTitle = 'Untitled Transcription',
  linkedCaseName = null,
  onClose,
  onConfirm,
  onAssignCase,
  onClearCase,
}: NewTranscriptionDialogProps) {
  const t = useTranscriptionTheme(theme);
  const [title, setTitle] = useState(defaultTitle);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
    }
  }, [defaultTitle, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm(title.trim() || defaultTitle);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.form
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
            className={`w-full max-w-lg overflow-hidden rounded-3xl border-2 shadow-2xl ${t.body} ${
              t.isPastel
                ? 'border-purple-200/60 bg-gradient-to-br from-white to-pink-50/80'
                : 'border-cyber-purple-500/40 bg-gradient-to-br from-gray-900 to-gray-950'
            }`}
          >
            <div className={`border-b px-6 py-5 ${t.isPastel ? 'border-pink-200/40' : 'border-white/10'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl p-3 ${t.button}`}>
                    <AudioLines className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>
                      New workspace
                    </p>
                    <h2 className={`mt-1 text-2xl font-bold ${t.heading}`}>Create transcription</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-inherit transition-colors hover:bg-white/10"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="space-y-3">
                <label htmlFor="transcription-title" className="text-sm font-semibold">
                  Workspace title
                </label>
                <input
                  id="transcription-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Untitled Transcription"
                  className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                    t.isPastel
                      ? 'border-purple-200/60 bg-white text-gray-800 focus:border-purple-300'
                      : 'border-white/10 bg-black/20 text-white focus:border-cyber-cyan-400/50'
                  }`}
                />
              </div>

              <div
                className={`rounded-2xl border p-4 ${
                  t.isPastel ? 'border-purple-200/50 bg-white/80' : 'border-white/10 bg-black/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Case link</p>
                    <p className={`mt-1 text-sm ${t.muted}`}>
                      {linkedCaseName
                        ? `Linked to ${linkedCaseName}`
                        : 'Optional — store this workspace inside a case folder'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onAssignCase}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
                        t.isPastel
                          ? 'border-purple-200/60 bg-white text-gray-700 hover:border-purple-300'
                          : 'border-white/10 bg-white/5 text-gray-200 hover:border-cyber-cyan-400/40'
                      }`}
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      {linkedCaseName ? 'Change case' : 'Assign case'}
                    </button>
                    {linkedCaseName && onClearCase ? (
                      <button
                        type="button"
                        onClick={onClearCase}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                          t.isPastel
                            ? 'border-pink-200/60 text-gray-600 hover:bg-pink-50'
                            : 'border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`flex flex-wrap justify-end gap-3 border-t px-6 py-4 ${
                t.isPastel ? 'border-pink-200/40 bg-pink-50/30' : 'border-white/10 bg-black/20'
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold ${
                  t.isPastel
                    ? 'border-purple-200/60 bg-white text-gray-700'
                    : 'border-white/10 bg-white/5 text-gray-200'
                }`}
              >
                Cancel
              </button>
              <button type="submit" className={`rounded-2xl px-4 py-2.5 text-sm font-semibold ${t.button}`}>
                Create Workspace
              </button>
            </div>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
