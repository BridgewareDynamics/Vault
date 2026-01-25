import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Theme } from '../../types';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  theme?: Theme;
}

export function UnsavedChangesDialog({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  theme = 'brideware-purple',
}: UnsavedChangesDialogProps) {
  const isPastel = theme === 'pastel';
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
            <div className={`rounded-lg shadow-2xl max-w-md w-full p-6 ${
              isPastel
                ? 'bg-white/90 border border-pink-200/40 backdrop-blur-xl'
                : 'bg-gray-800 border border-cyber-purple-500/30'
            }`}
            style={isPastel ? {
              boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
            } : {}}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold bg-clip-text text-transparent ${
                  isPastel
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                    : 'bg-gradient-purple'
                }`}>
                  Unsaved Changes
                </h3>
                <button
                  onClick={onCancel}
                  className={`p-1 rounded transition-colors ${
                    isPastel
                      ? 'hover:bg-pink-100'
                      : 'hover:bg-gray-700'
                  }`}
                  aria-label="Close"
                >
                  <X size={20} className={isPastel ? 'text-gray-600' : 'text-gray-400'} />
                </button>
              </div>

              {/* Content */}
              <p className={`mb-6 ${
                isPastel ? 'text-gray-700' : 'text-gray-300'
              }`}>
                You have unsaved changes. What would you like to do?
              </p>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCancel}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isPastel
                      ? 'bg-pink-100 hover:bg-pink-200 text-gray-700'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={onDiscard}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isPastel
                      ? 'bg-pink-100 hover:bg-pink-200 text-gray-700'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  Discard
                </button>
                <button
                  onClick={onSave}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isPastel
                      ? 'bg-pink-500 hover:bg-pink-600 text-white'
                      : 'bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white'
                  }`}
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





