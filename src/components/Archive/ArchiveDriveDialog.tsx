import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen } from 'lucide-react';

interface ArchiveDriveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ArchiveDriveDialog({ isOpen, onClose, onConfirm }: ArchiveDriveDialogProps) {
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
        aria-labelledby="archive-drive-dialog-title"
        aria-describedby="archive-drive-dialog-description"
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
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <h2 id="archive-drive-dialog-title" className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              Choose Vault Directory
            </h2>
          </div>

          <p id="archive-drive-dialog-description" className="text-gray-300 mb-6">
            Welcome to Vault! Please choose the directory where your vault will be stored. This location will be remembered for future sessions.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Cancel selecting vault directory"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
              aria-label="Confirm vault directory selection"
            >
              Select Directory
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


