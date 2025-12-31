import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-gray-800 border border-cyber-purple-500/30 rounded-lg shadow-2xl max-w-md w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold bg-gradient-purple bg-clip-text text-transparent">
                  Unsaved Changes
                </h3>
                <button
                  onClick={onCancel}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <p className="text-gray-300 mb-6">
                You have unsaved changes. What would you like to do?
              </p>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg transition-colors bg-gray-700 hover:bg-gray-600 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={onDiscard}
                  className="px-4 py-2 rounded-lg transition-colors bg-gray-700 hover:bg-gray-600 text-gray-300"
                >
                  Discard
                </button>
                <button
                  onClick={onSave}
                  className="px-4 py-2 rounded-lg transition-colors bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}





