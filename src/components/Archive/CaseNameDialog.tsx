import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';

interface CaseNameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (caseName: string, description: string) => void;
}

export function CaseNameDialog({ isOpen, onClose, onConfirm }: CaseNameDialogProps) {
  const [caseName, setCaseName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCaseName('');
      setDescription('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (caseName.trim()) {
      onConfirm(caseName.trim(), description.trim());
      setCaseName('');
      setDescription('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleTextareaKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Ctrl/Cmd + Enter to submit
      e.preventDefault();
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
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-cyber-purple-500/60 shadow-2xl p-6 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-purple rounded-lg">
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              Name File
            </h2>
          </div>

          <input
            type="text"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter case name..."
            autoFocus
            className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 mb-4 transition-colors"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleTextareaKeyPress}
            placeholder="Description..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 mb-4 resize-none transition-colors"
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!caseName.trim()}
              className="flex-1 px-4 py-2 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              OK
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



