import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { FileText, X } from 'lucide-react';
import { isValidFileName } from '../../utils/pathValidator';

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
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFileName('');
      setError(null);
      // Focus input after dialog opens - use longer delay to ensure any native dialogs are fully closed
      // This is especially important after a native confirm() dialog closes
      const focusTimeout = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 200);
      
      return () => clearTimeout(focusTimeout);
    }
  }, [isOpen]);

  useEffect(() => {
    // Validate filename as user types
    if (fileName.trim()) {
      // Ensure .txt extension for validation
      const fileNameWithExt = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
      if (!isValidFileName(fileNameWithExt)) {
        // Check which validation failed
        const nameWithoutExt = fileName.endsWith('.txt') ? fileName.slice(0, -4) : fileName;
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
        if (invalidChars.test(nameWithoutExt)) {
          setError('File name contains invalid characters: < > : " / \\ | ? *');
        } else if (nameWithoutExt.endsWith('.') || nameWithoutExt.endsWith(' ')) {
          setError('File name cannot end with a period or space');
        } else if (fileName.length > 204) {
          setError('File name is too long (max 200 characters)');
        } else {
          setError('Invalid file name');
        }
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  }, [fileName]);

  const handleConfirm = () => {
    if (!fileName.trim()) {
      return;
    }

    // Ensure .txt extension
    const finalFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    
    // Final validation before confirming
    if (!isValidFileName(finalFileName)) {
      setError('Please enter a valid file name');
      return;
    }

    onConfirm(finalFileName);
    setFileName('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
      setFileName('');
      setError(null);
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
            style={{ pointerEvents: 'auto' }}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[71] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
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
                    setError(null);
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
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Enter file name..."
                  autoFocus
                  className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none mb-2 ${
                    error 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-700 focus:border-cyber-purple-500'
                  }`}
                  style={{ pointerEvents: 'auto' }}
                />
                {error && (
                  <p className="text-red-400 text-sm mb-4">{error}</p>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      setFileName('');
                      setError(null);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!fileName.trim() || !!error}
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








