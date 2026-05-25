import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Theme } from '../../types';
import { useMapTheme } from './mapTheme';

interface DeleteBlockDialogProps {
  isOpen: boolean;
  theme: Theme;
  blockTitle?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteBlockDialog({
  isOpen,
  theme,
  blockTitle,
  onClose,
  onConfirm,
}: DeleteBlockDialogProps) {
  const t = useMapTheme(theme);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[85] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-block-dialog-title"
        aria-describedby="delete-block-dialog-description"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl border-2 shadow-2xl overflow-hidden ${
            t.isPastel
              ? 'bg-gradient-to-br from-white to-pink-50 border-red-300/60'
              : 'bg-gradient-to-br from-gray-900 to-gray-950 border-red-500/50'
          }`}
        >
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl border ${
                  t.isPastel
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 id="delete-block-dialog-title" className="text-xl font-bold text-red-400">
                  Delete Block
                </h2>
                <p className={`text-sm ${t.muted}`}>Remove this block from the timeline</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10"
              aria-label="Close delete dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5">
            <p id="delete-block-dialog-description" className={`${t.isPastel ? 'text-gray-700' : 'text-gray-200'} text-sm leading-6`}>
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {blockTitle?.trim() ? `"${blockTitle}"` : 'this block'}
              </span>
              ?
            </p>
            <p className="mt-3 text-sm text-red-400">
              This removes the block from the canvas timeline and reconnects the flow.
            </p>
          </div>

          <div
            className={`px-6 py-4 border-t flex gap-3 ${
              t.isPastel ? 'border-pink-200/30 bg-pink-50/30' : 'border-white/10 bg-black/20'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-xl border font-medium ${t.card}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Block
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
