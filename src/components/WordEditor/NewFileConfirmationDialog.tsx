import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Save, X, Trash2 } from 'lucide-react';

interface NewFileConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

export function NewFileConfirmationDialog({
  isOpen,
  onClose,
  onSave,
  onDiscard,
}: NewFileConfirmationDialogProps) {
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900 border border-cyber-purple-500/30 rounded-lg shadow-2xl w-full max-w-md">
              {/* Header */}
              <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyber-purple-500/20 rounded-lg">
                    <FileText size={20} className="text-cyber-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-purple bg-clip-text text-transparent">
                    Unsaved Changes
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-gray-300 mb-6">
                  You have unsaved changes. What would you like to do with the current file?
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      onSave();
                      onClose();
                    }}
                    className="w-full px-4 py-3 bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    <span>Save Current File</span>
                  </button>
                  <button
                    onClick={() => {
                      onDiscard();
                      onClose();
                    }}
                    className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    <span>Discard Current File</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}








