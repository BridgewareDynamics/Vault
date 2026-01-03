import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, X } from 'lucide-react';
import { ArchiveCase } from '../../types';

interface CaseSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (casePath: string) => void;
}

export function CaseSelectionDialog({
  isOpen,
  onClose,
  onSelectCase,
}: CaseSelectionDialogProps) {
  const [cases, setCases] = useState<ArchiveCase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCases();
    }
  }, [isOpen]);

  const loadCases = async () => {
    if (!window.electronAPI) {
      return;
    }

    try {
      setLoading(true);
      const casesList = await window.electronAPI.listArchiveCases();
      setCases(casesList);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCase = (casePath: string) => {
    onSelectCase(casePath);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-selection-dialog-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-cyber-purple-500/60 shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-purple rounded-lg" aria-hidden="true">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <h2 id="case-selection-dialog-title" className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
                Select Case
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading cases...</p>
                </div>
              </div>
            ) : cases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg mb-2">No cases found</p>
                <p className="text-gray-500 text-sm">Create a case in the archive to save reports</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map((caseItem) => (
                  <button
                    key={caseItem.path}
                    onClick={() => handleSelectCase(caseItem.path)}
                    className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-700 border-2 border-gray-600 hover:border-cyber-purple-500 rounded-lg transition-colors text-white"
                    aria-label={`Select case ${caseItem.name}`}
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5 text-cyber-purple-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{caseItem.name}</div>
                        {caseItem.description && (
                          <div className="text-sm text-gray-400 truncate mt-1">{caseItem.description}</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Cancel case selection"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

