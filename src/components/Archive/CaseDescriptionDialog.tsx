import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FileText, X } from 'lucide-react';

interface CaseDescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (description: string) => void;
  initialDescription?: string;
}

export function CaseDescriptionDialog({ isOpen, onClose, onConfirm, initialDescription = '' }: CaseDescriptionDialogProps) {
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescription(initialDescription);
    }
  }, [isOpen, initialDescription]);

  const handleConfirm = () => {
    onConfirm(description.trim());
    // Don't clear here - useEffect will reset when dialog reopens
  };

  const handleTextareaKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="case-description-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-description-dialog-title"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl border-2 border-cyber-purple-400/40 shadow-2xl p-6 max-w-lg w-full backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl blur-xl opacity-50"></div>
                  <div className="relative p-3 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl shadow-2xl">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h2 id="case-description-dialog-title" className="text-xl font-bold bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent">
                  {initialDescription ? 'Edit Description' : 'Add Description'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Description Input */}
            <div className="mb-5">
              <label htmlFor="case-description-textarea" className="block text-sm font-semibold text-gray-300 mb-2.5">
                Description
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>
                <textarea
                  id="case-description-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleTextareaKeyPress}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Add a description for this case..."
                  rows={4}
                  aria-label="Case description"
                  className="relative w-full px-4 py-3.5 bg-gray-800/70 hover:bg-gray-800/80 border-2 border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none resize-none transition-all duration-300 backdrop-blur-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-gradient-to-r from-cyber-purple-500 to-cyber-cyan-500 hover:from-cyber-purple-600 hover:to-cyber-cyan-600 rounded-lg text-white font-medium transition-all duration-300 shadow-lg shadow-cyber-purple-500/20"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
