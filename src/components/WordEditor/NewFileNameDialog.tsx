import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { FileText, X } from 'lucide-react';

interface NewFileNameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fileName: string) => void;
}

export function NewFileNameDialog({
  isOpen,
  onClose,
  onConfirm,
}: NewFileNameDialogProps) {
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFileName('');
      // Focus input after dialog opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!fileName.trim()) {
      return;
    }

    // Ensure .txt extension
    const finalFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    onConfirm(finalFileName);
    setFileName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
      setFileName('');
    }
  };

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
            className="fixed inset-0 bg-black/50 z-[70]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900 border border-cyber-purple-500/30 rounded-lg shadow-2xl w-full max-w-sm">
              {/* Header */}
              <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyber-purple-500/20 rounded-lg">
                    <FileText size={20} className="text-cyber-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-purple bg-clip-text text-transparent">
                    New File
                  </h2>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    setFileName('');
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <label htmlFor="new-file-name-input" className="block text-sm text-gray-300 mb-2">
                  File Name
                </label>
                <input
                  id="new-file-name-input"
                  ref={inputRef}
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter file name..."
                  autoFocus
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple-500 mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      setFileName('');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!fileName.trim()}
                    className="px-4 py-2 bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
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








