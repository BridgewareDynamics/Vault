import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface SaveOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (folderName: string) => void;
}

export function SaveOptions({ isOpen, onClose, onConfirm }: SaveOptionsProps) {
  const [folderName, setFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onConfirm(folderName.trim());
      setFolderName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      setFolderName('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-options-dialog-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-800 rounded-xl border-2 border-cyber-purple-500 p-6 w-full max-w-md shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="save-options-dialog-title" className="text-xl font-bold text-white">Name Folder</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <label htmlFor="save-folder-name-input" className="sr-only">
              Folder name
            </label>
            <input
              id="save-folder-name-input"
              ref={inputRef}
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name..."
              aria-label="Folder name"
              aria-required="true"
              className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple-500 transition-colors mb-4"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                aria-label="Cancel naming folder"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!folderName.trim()}
                className="flex-1 px-4 py-2 bg-gradient-purple hover:opacity-90 text-white rounded-lg font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Confirm folder name"
                aria-disabled={!folderName.trim()}
              >
                OK
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



