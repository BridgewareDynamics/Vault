import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeletePDFConfirmDialogProps {
  isOpen: boolean;
  fileName: string;
  onClose: () => void;
  onConfirm: (deleteImageFolder: boolean) => void;
  hasExistingFolder?: boolean; // Whether there's an existing PDF folder to delete
}

export function DeletePDFConfirmDialog({ 
  isOpen, 
  fileName, 
  onClose, 
  onConfirm,
  hasExistingFolder = false
}: DeletePDFConfirmDialogProps) {
  const [deleteImageFolder, setDeleteImageFolder] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(deleteImageFolder);
    onClose();
    // Reset checkbox state after closing
    setDeleteImageFolder(false);
  };

  const handleClose = () => {
    onClose();
    // Reset checkbox state when closing
    setDeleteImageFolder(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-pdf-dialog-title"
        aria-describedby="delete-pdf-dialog-description"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-red-500/60 shadow-2xl p-6 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-600/20 rounded-lg border border-red-500/50" aria-hidden="true">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h2 id="delete-pdf-dialog-title" className="text-2xl font-bold text-red-400">
              Delete PDF?
            </h2>
          </div>

          <div id="delete-pdf-dialog-description">
            <p className="text-gray-300 mb-2">
              Are you sure you want to delete <span className="font-semibold text-white">"{fileName}"</span>?
            </p>
            
            <p className="text-red-400 text-sm mb-4">
              ⚠️ This action cannot be undone.
            </p>

            {/* Checkbox for deleting PDF folder - only show if folder exists */}
            {hasExistingFolder && (
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={deleteImageFolder}
                      onChange={(e) => setDeleteImageFolder(e.target.checked)}
                      className="sr-only"
                      aria-label="Delete PDF Folder"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        deleteImageFolder
                          ? 'bg-red-600 border-red-500'
                          : 'bg-transparent border-gray-500 group-hover:border-red-400'
                      }`}
                    >
                      {deleteImageFolder && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-white transition-colors">
                    Delete PDF Folder
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Cancel deleting PDF"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
              aria-label={`Confirm deletion of PDF ${fileName}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Delete PDF
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
