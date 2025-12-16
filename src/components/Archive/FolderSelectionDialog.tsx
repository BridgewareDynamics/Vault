import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, FolderOpen } from 'lucide-react';

interface FolderSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDirectory: () => void;
  onMakeNewFolder: () => void;
}

export function FolderSelectionDialog({
  isOpen,
  onClose,
  onSelectDirectory,
  onMakeNewFolder,
}: FolderSelectionDialogProps) {
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
        aria-labelledby="folder-selection-dialog-title"
        aria-describedby="folder-selection-dialog-description"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-cyber-purple-500/60 shadow-2xl p-6 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-purple rounded-lg" aria-hidden="true">
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
            <h2 id="folder-selection-dialog-title" className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              Select Directory or Make New Folder
            </h2>
          </div>

          <p id="folder-selection-dialog-description" className="text-gray-300 mb-6">
            Choose to select an existing folder or create a new folder for the extraction.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                onSelectDirectory();
                // Don't call onClose here - let the parent handle dialog state transitions
              }}
              className="flex items-center gap-3 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 border-2 border-gray-600 hover:border-cyber-purple-500 rounded-lg transition-colors text-white"
              aria-label="Select existing directory"
            >
              <FolderOpen className="w-5 h-5 text-cyber-purple-400" aria-hidden="true" />
              <span className="font-medium">Select Directory</span>
            </button>

            <button
              onClick={() => {
                onMakeNewFolder();
                // Don't call onClose here - let the parent handle dialog state transitions
              }}
              className="flex items-center gap-3 px-4 py-3 bg-gradient-purple hover:opacity-90 rounded-lg transition-opacity text-white font-semibold"
              aria-label="Create new folder"
            >
              <FolderPlus className="w-5 h-5 text-white" aria-hidden="true" />
              <span>Make New Folder</span>
            </button>

            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Cancel folder selection"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


