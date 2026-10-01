import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Check, FolderOpen, Ruler, X } from 'lucide-react';
import { Theme } from '../../types';
import { useNovelTheme } from './novelTheme';
import { CaseSelectionDialog } from '../Archive/CaseSelectionDialog';
import {
  BOOK_SIZE_PRESETS,
  DEFAULT_BOOK_SIZE_ID,
  formatBookDimensions,
  getBookSizePreset,
} from './engine/bookSizes';

interface NewNovelDialogProps {
  isOpen: boolean;
  theme: Theme;
  onClose: () => void;
  onConfirm: (name: string, casePath: string | null, bookSizeId: string) => void;
}

const CATEGORY_LABELS = {
  fiction: 'Fiction & General',
  international: 'International',
  specialty: 'Specialty & Reports',
} as const;

export function NewNovelDialog({ isOpen, theme, onClose, onConfirm }: NewNovelDialogProps) {
  const t = useNovelTheme(theme);
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('Untitled Novel');
  const [selectedCasePath, setSelectedCasePath] = useState<string | null>(null);
  const [bookSizeId, setBookSizeId] = useState(DEFAULT_BOOK_SIZE_ID);
  const [showCaseDialog, setShowCaseDialog] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle('Untitled Novel');
    setSelectedCasePath(null);
    setBookSizeId(DEFAULT_BOOK_SIZE_ID);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const normalized = title.trim() || 'Untitled Novel';
  const selectedPreset = getBookSizePreset(bookSizeId);

  const grouped = (['fiction', 'international', 'specialty'] as const).map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    presets: BOOK_SIZE_PRESETS.filter((preset) => preset.category === category),
  }));

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border p-6 shadow-2xl ${t.body} ${t.dialogShellLarge}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl border p-3 ${t.dialogIconBox}`}>
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${t.primary}`}>Create Novel</p>
                  <h2 className={`text-xl font-bold ${t.heading}`}>Set up your book</h2>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-white/10" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="mt-6 space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                onConfirm(normalized, selectedCasePath, bookSizeId);
              }}
            >
              <div>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-wider ${t.muted}`}>
                  Book title
                </label>
                <input
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-lg font-semibold outline-none ${t.titleInput}`}
                  placeholder="Untitled Novel"
                />
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Ruler className={`h-4 w-4 ${t.primary}`} />
                  <label className={`text-xs font-semibold uppercase tracking-wider ${t.muted}`}>
                    Trim size
                  </label>
                </div>
                <div className="space-y-4">
                  {grouped.map(({ category, label, presets }) => (
                    <div key={category}>
                      <p className={`mb-2 text-xs font-medium ${t.muted}`}>{label}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {presets.map((preset) => {
                          const selected = preset.id === bookSizeId;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setBookSizeId(preset.id)}
                              className={`rounded-2xl border p-3 text-left transition-all ${
                                selected
                                  ? `${t.button} ring-2 ring-amber-400/40`
                                  : `${t.badgeNeutral} hover:opacity-90`
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold">{preset.name}</span>
                                {selected && <Check className="h-4 w-4 shrink-0 opacity-90" />}
                              </div>
                              <p className={`mt-1 text-xs ${selected ? 'opacity-90' : t.muted}`}>
                                {formatBookDimensions(preset)}
                              </p>
                              <p className={`mt-1 text-[11px] leading-snug ${selected ? 'opacity-80' : t.muted}`}>
                                {preset.typicalUse}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className={`mt-3 text-xs ${t.muted}`}>
                  Selected: <strong className={t.heading}>{selectedPreset.name}</strong> — pages will match real print
                  dimensions at {formatBookDimensions(selectedPreset)}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCaseDialog(true)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm ${t.badgeNeutral}`}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  {selectedCasePath ? 'Linked to case' : 'Save to Vault Library (optional case link)'}
                </span>
                <span className={`text-xs ${t.muted}`}>{selectedCasePath ? 'Change' : 'Choose case'}</span>
              </button>
              {selectedCasePath && (
                <button
                  type="button"
                  onClick={() => setSelectedCasePath(null)}
                  className={`text-xs ${t.muted} underline`}
                >
                  Clear case link
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className={`flex-1 rounded-2xl border px-4 py-3 ${t.dialogCancel}`}>
                  Cancel
                </button>
                <button type="submit" className={`flex-1 rounded-2xl px-4 py-3 font-semibold ${t.button}`}>
                  Create book
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <CaseSelectionDialog
        isOpen={showCaseDialog}
        onClose={() => setShowCaseDialog(false)}
        onSelectCase={(casePath) => {
          setSelectedCasePath(casePath);
          setShowCaseDialog(false);
        }}
      />
    </>
  );
}
