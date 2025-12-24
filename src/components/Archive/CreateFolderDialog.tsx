import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (folderName: string) => void;
}

export function CreateFolderDialog({ isOpen, onClose, onConfirm }: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (folderName.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        const name = folderName.trim();
        setFolderName('');
        await onConfirm(name);
        setIsSubmitting(false);
      } catch (error) {
        setIsSubmitting(false);
        throw error; // Re-throw to let parent handle it
      }
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
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
        onClick={(e) => {
          // Only close if clicking the backdrop, not the dialog content
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-folder-dialog-title"
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
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
            <h2 id="create-folder-dialog-title" className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              New folder
            </h2>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleConfirm();
            }}
          >
            <label htmlFor="folder-name-input" className="sr-only">
              Folder name
            </label>
            <input
              id="folder-name-input"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter folder name..."
              autoFocus
              aria-label="Folder name"
              aria-required="true"
              className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 mb-4 transition-colors"
            />
          </form>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Cancel creating folder"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!folderName.trim() || isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isSubmitting ? 'Creating folder' : 'Create folder'}
              aria-disabled={!folderName.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'OK'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



