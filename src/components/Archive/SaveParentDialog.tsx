import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';

interface SaveParentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (saveParent: boolean) => void;
}

export function SaveParentDialog({ isOpen, onClose, onConfirm }: SaveParentDialogProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-parent-dialog-title"
        aria-describedby="save-parent-dialog-description"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-cyber-purple-500/60 shadow-2xl p-6 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-purple rounded-lg" aria-hidden="true">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 id="save-parent-dialog-title" className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              Save Parent Document?
            </h2>
          </div>

          <p id="save-parent-dialog-description" className="text-gray-300 mb-6">
            Would you like to save the original PDF file along with the extracted pages?
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                onConfirm(false);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Do not save parent document"
            >
              No
            </button>
            <button
              onClick={() => {
                onConfirm(true);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
              aria-label="Save parent document"
            >
              Yes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



