import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface DeleteTextFileConfirmDialogProps {
  isOpen: boolean;
  fileName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteTextFileConfirmDialog({ 
  isOpen, 
  fileName, 
  onClose, 
  onConfirm 
}: DeleteTextFileConfirmDialogProps) {
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'Enter') {
          onConfirm();
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      // Focus the delete button for keyboard navigation
      setTimeout(() => {
        deleteButtonRef.current?.focus();
      }, 100);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-file-dialog-title"
          aria-describedby="delete-file-dialog-description"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-red-500/60 shadow-2xl p-6 max-w-md w-full"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-600/20 rounded-lg border border-red-500/50" aria-hidden="true">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h2 id="delete-file-dialog-title" className="text-2xl font-bold text-red-400">
                Delete File?
              </h2>
            </div>

            <div id="delete-file-dialog-description">
              <p className="text-gray-300 mb-2">
                Are you sure you want to delete <span className="font-semibold text-white">"{fileName}"</span>?
              </p>
              
              <p className="text-red-400 text-sm mb-6">
                ⚠️ This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                aria-label="Cancel deleting file"
              >
                Cancel
              </button>
              <button
                ref={deleteButtonRef}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                aria-label={`Confirm deletion of file ${fileName}`}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
