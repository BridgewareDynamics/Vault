import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, X } from 'lucide-react';
import { ArchiveCase, Theme } from '../../types';
import { useSettingsContext } from '../../utils/settingsContext';

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
          className={`rounded-lg border-2 shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col ${
            isPastel
              ? 'bg-gradient-to-br from-slate-50 to-pink-50/30 border-pink-200/40'
              : 'bg-gradient-to-br from-gray-800 to-gray-900 border-cyber-purple-500/60'
          }`}
          style={isPastel ? {
            boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
          } : {}}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isPastel
                  ? 'bg-gradient-to-br from-pink-100 to-purple-100 border border-pink-200/40'
                  : 'bg-gradient-purple'
              }`} aria-hidden="true">
                <FolderOpen className={`w-6 h-6 ${
                  isPastel ? 'text-pink-600' : 'text-white'
                }`} />
              </div>
              <h2 id="case-selection-dialog-title" className={`text-2xl font-bold bg-clip-text text-transparent ${
                isPastel
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                  : 'bg-gradient-purple'
              }`}>
                Select Case
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isPastel ? 'hover:bg-pink-100' : 'hover:bg-gray-700'
              }`}
              aria-label="Close dialog"
            >
              <X className={`w-5 h-5 ${isPastel ? 'text-gray-600' : 'text-gray-400'}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className={`inline-flex p-4 rounded-2xl border-2 ${
                    isPastel
                      ? 'bg-gradient-to-br from-pink-100/60 to-purple-100/60 border-pink-300/40'
                      : 'bg-gradient-to-br from-cyan-900/40 to-purple-900/40 border-cyber-cyan-400/30'
                  }`}>
                    <div className="relative w-8 h-8">
                      {isPastel ? (
                        <>
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-pink-400 border-r-purple-400 animate-spin"></div>
                          <div className="absolute inset-1 rounded-full border border-transparent border-b-purple-400 border-l-pink-400 animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}></div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyber-purple-400 border-r-cyber-cyan-400 animate-spin"></div>
                          <div className="absolute inset-1 rounded-full border border-transparent border-b-cyber-cyan-400 border-l-cyber-purple-400 animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}></div>
                        </>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${
                    isPastel ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Loading cases...
                  </p>
                </div>
              </div>
            ) : cases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className={`w-16 h-16 mb-4 ${
                  isPastel ? 'text-gray-500' : 'text-gray-600'
                }`} />
                <p className={`text-lg mb-2 ${
                  isPastel ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  No cases found
                </p>
                <p className={`text-sm ${
                  isPastel ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  Create a case in the archive to save reports
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map((caseItem) => (
                  <button
                    key={caseItem.path}
                    onClick={() => handleSelectCase(caseItem.path)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors border-2 ${
                      isPastel
                        ? 'bg-pink-100/50 hover:bg-pink-200 border-pink-200 hover:border-pink-300 text-gray-700'
                        : 'bg-gray-700/50 hover:bg-gray-700 border-gray-600 hover:border-cyber-purple-500 text-white'
                    }`}
                    aria-label={`Select case ${caseItem.name}`}
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className={`w-5 h-5 flex-shrink-0 ${
                        isPastel ? 'text-pink-500' : 'text-cyber-purple-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${
                          isPastel ? 'text-gray-700' : 'text-white'
                        }`}>
                          {caseItem.name}
                        </div>
                        {caseItem.description && (
                          <div className={`text-sm truncate mt-1 ${
                            isPastel ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {caseItem.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`mt-6 pt-4 border-t ${
            isPastel ? 'border-pink-200/40' : 'border-gray-700'
          }`}>
            <button
              onClick={onClose}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${
                isPastel
                  ? 'bg-pink-100 hover:bg-pink-200 text-gray-700'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
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

