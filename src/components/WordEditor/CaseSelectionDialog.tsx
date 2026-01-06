import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, X, Search, Sparkles, Check, Zap } from 'lucide-react';
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
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-2 border-cyber-purple-400/40 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden backdrop-blur-xl"
        >
          {/* Enhanced Header */}
          <div className="relative p-6 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                  <div className="relative p-3 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                    <FolderOpen className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h2 
                    id="case-selection-dialog-title" 
                    className="text-2xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]"
                  >
                    Select Case
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">Choose where to save your new document</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800/80 rounded-lg transition-colors text-gray-400 hover:text-white"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="p-6 border-b border-cyber-purple-400/20 bg-gray-900/50">
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                  <div className="relative p-1.5 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                    <Search className="text-white" size={16} />
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases by name or description..."
                className="w-full pl-14 pr-4 py-3 bg-gray-800/80 border-2 border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 backdrop-blur-sm transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Enhanced Cases List */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <div className="inline-flex p-6 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 rounded-2xl border-2 border-cyber-cyan-400/30">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan-400"></div>
                  </div>
                  <p className="text-gray-300 text-lg">Loading cases...</p>
                </div>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="inline-flex p-8 bg-gray-800/50 rounded-2xl border border-cyber-purple-400/20 mb-6">
                  <FolderOpen className="w-20 h-20 text-cyber-purple-400/50" />
                </div>
                <h3 className="text-xl font-bold text-gray-300 mb-2">
                  {searchQuery ? 'No cases found' : 'No cases available'}
                </h3>
                <p className="text-gray-400 text-base max-w-md">
                  {searchQuery ? 'Try a different search term' : 'Create a case in the archive to save documents'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence>
                  {filteredCases.map((caseItem, index) => (
                    <motion.button
                      key={caseItem.path}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={() => setSelectedCasePath(caseItem.path)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ease-out text-left group ${
                        selectedCasePath === caseItem.path
                          ? 'border-cyber-purple-500/60 bg-cyber-purple-500/20 shadow-lg shadow-cyber-purple-500/30'
                          : 'border-gray-700/50 hover:border-cyber-purple-500/40 bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 shadow-lg hover:shadow-cyber-purple-500/20'
                      }`}
                      aria-label={`Select case ${caseItem.name}`}
                    >
                      {/* Glowing background effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                        selectedCasePath === caseItem.path
                          ? 'from-purple-600/20 via-purple-600/10 to-cyan-600/20'
                          : 'from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10'
                      }`}></div>
                      
                      <div className="relative p-5 flex items-center gap-4">
                        {/* Enhanced Selection Indicator */}
                        <div className="flex-shrink-0 relative">
                          <motion.div
                            initial={false}
                            animate={{
                              scale: selectedCasePath === caseItem.path ? 1 : 0.8,
                              opacity: selectedCasePath === caseItem.path ? 1 : 0.5,
                            }}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedCasePath === caseItem.path
                                ? 'border-cyber-purple-500 bg-gradient-to-br from-purple-600 to-cyan-600 shadow-lg shadow-cyber-purple-500/50'
                                : 'border-gray-500 bg-gray-700/50'
                            }`}
                          >
                            {selectedCasePath === caseItem.path && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </motion.div>
                          {selectedCasePath === caseItem.path && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1.5, opacity: 0 }}
                              className="absolute inset-0 rounded-full bg-cyber-purple-400"
                              transition={{ duration: 0.4 }}
                            />
                          )}
                        </div>

                        {/* Case Icon */}
                        <div className="relative flex-shrink-0">
                          <div className={`absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl blur-lg transition-all ${
                            selectedCasePath === caseItem.path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}></div>
                          <div className={`relative p-3 bg-gradient-to-br rounded-xl transition-all ${
                            selectedCasePath === caseItem.path
                              ? 'from-purple-600/40 to-cyan-600/40'
                              : 'from-purple-600/20 to-cyan-600/20 group-hover:from-purple-600/30 group-hover:to-cyan-600/30'
                          }`}>
                            <FolderOpen className={`w-6 h-6 transition-all ${
                              selectedCasePath === caseItem.path ? 'text-white' : 'text-cyber-purple-400 group-hover:text-white'
                            }`} />
                          </div>
                        </div>

                        {/* Case Info */}
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-base mb-1 truncate transition-all ${
                            selectedCasePath === caseItem.path
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400'
                              : 'text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400'
                          }`}>
                            {caseItem.name}
                          </div>
                          {caseItem.description && (
                            <div className="text-sm text-gray-400 line-clamp-2">{caseItem.description}</div>
                          )}
                        </div>

                        {/* Selection Indicator Icon */}
                        {selectedCasePath === caseItem.path && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="flex-shrink-0"
                          >
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full blur-md opacity-50"></div>
                              <div className="relative p-2 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full">
                                <Zap className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Enhanced Footer with Create Button */}
          <div className="p-6 border-t border-cyber-purple-400/20 bg-gray-900/50 flex gap-3">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-5 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-xl transition-all border border-gray-700/50 hover:border-gray-600/50 font-medium"
              aria-label="Cancel case selection"
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleCreate}
              disabled={!selectedCasePath}
              whileHover={{ scale: !selectedCasePath ? 1 : 1.02 }}
              whileTap={{ scale: !selectedCasePath ? 1 : 0.98 }}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 text-white rounded-xl transition-all shadow-lg hover:shadow-2xl hover:shadow-cyber-purple-500/50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg relative overflow-hidden group"
              aria-label="Create document in selected case"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Sparkles size={16} className="opacity-70" />
                Create Document
              </span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
