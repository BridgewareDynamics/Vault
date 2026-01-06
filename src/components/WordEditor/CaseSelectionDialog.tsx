import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, X, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCasePath, setSelectedCasePath] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCases();
      setSearchQuery('');
      setSelectedCasePath(null);
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

  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) {
      return cases;
    }
    const query = searchQuery.toLowerCase();
    return cases.filter(
      (caseItem) =>
        caseItem.name.toLowerCase().includes(query) ||
        caseItem.description?.toLowerCase().includes(query)
    );
  }, [cases, searchQuery]);

  const handleCreate = () => {
    if (selectedCasePath) {
      onSelectCase(selectedCasePath);
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
          className="bg-gray-900 border border-cyber-purple-500/30 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
            <h2 id="case-selection-dialog-title" className="text-xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              Select Case
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple-500"
                autoFocus
              />
            </div>
          </div>

          {/* Cases List */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading cases...</p>
                </div>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg mb-2">
                  {searchQuery ? 'No cases found' : 'No cases available'}
                </p>
                <p className="text-gray-500 text-sm">
                  {searchQuery ? 'Try a different search term' : 'Create a case in the archive to save documents'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCases.map((caseItem) => (
                  <button
                    key={caseItem.path}
                    onClick={() => setSelectedCasePath(caseItem.path)}
                    className={`w-full text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-800 border-2 rounded-lg transition-colors ${
                      selectedCasePath === caseItem.path
                        ? 'border-cyber-purple-500 bg-cyber-purple-500/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    aria-label={`Select case ${caseItem.name}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Radio Button */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedCasePath === caseItem.path
                              ? 'border-cyber-purple-500 bg-cyber-purple-500'
                              : 'border-gray-500'
                          }`}
                        >
                          {selectedCasePath === caseItem.path && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
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

          {/* Footer with Create Button */}
          <div className="p-4 border-t border-gray-700/50 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Cancel case selection"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!selectedCasePath}
              className="flex-1 px-4 py-2 bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Create document in selected case"
            >
              Create
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
