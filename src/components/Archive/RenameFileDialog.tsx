import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Pencil } from 'lucide-react';

interface RenameFileDialogProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onConfirm: (newName: string) => void;
}

export function RenameFileDialog({ isOpen, currentName, onClose, onConfirm }: RenameFileDialogProps) {
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSelectedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      hasSelectedRef.current = false;
      // Use setTimeout to ensure the input is rendered before focusing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
          hasSelectedRef.current = true;
        }
      }, 100);
    } else {
      hasSelectedRef.current = false;
    }
  }, [isOpen, currentName]);

  const handleConfirm = () => {
    if (newName.trim() && newName.trim() !== currentName) {
      onConfirm(newName.trim());
      setNewName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
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
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-dialog-title"
        aria-describedby="rename-dialog-description"
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
              <Pencil className="w-6 h-6 text-white" />
            </div>
            <h2 id="rename-dialog-title" className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              Rename
            </h2>
          </div>

          <p id="rename-dialog-description" className="sr-only">
            Enter a new name for {currentName}
          </p>
          <label htmlFor="rename-input" className="sr-only">
            New file name
          </label>
          <input
            id="rename-input"
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              // Mark that user has started editing, so we don't auto-select on focus
              hasSelectedRef.current = true;
            }}
            onKeyDown={handleKeyPress}
            onMouseDown={(e) => {
              // Allow user to click and select text without interference
              if (hasSelectedRef.current) {
                e.stopPropagation();
              }
            }}
            placeholder="Enter new name..."
            aria-label="New file name"
            aria-required="true"
            className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 mb-4"
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Cancel renaming file"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!newName.trim() || newName.trim() === currentName}
              className="flex-1 px-4 py-2 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Confirm new file name"
              aria-disabled={!newName.trim() || newName.trim() === currentName}
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

