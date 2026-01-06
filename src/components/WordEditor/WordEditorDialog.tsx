import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ChevronDown, Plus, FolderOpen, Sparkles } from 'lucide-react';
import { useToast } from '../Toast/ToastContext';
import { useArchiveContext } from '../../contexts/ArchiveContext';
import { isValidFileName } from '../../utils/pathValidator';
import { CaseSelectionDialog } from './CaseSelectionDialog';

interface TextFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  preview?: string;
}

interface WordEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (filePath: string) => void;
  onNewFile: (fileName: string, casePath: string) => void;
  onOpenLibrary: () => void;
}

export function WordEditorDialog({ isOpen, onClose, onOpenFile, onNewFile, onOpenLibrary }: WordEditorDialogProps) {
  const [showRecent, setShowRecent] = useState(false);
  const [recentFiles, setRecentFiles] = useState<TextFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCaseSelectionDialog, setShowCaseSelectionDialog] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedCasePath, setSelectedCasePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { currentCase } = useArchiveContext();

  useEffect(() => {
    if (isOpen) {
      loadRecentFiles();
    }
  }, [isOpen, currentCase?.path]);

  const loadRecentFiles = async () => {
    if (!window.electronAPI) {
      return;
    }

    try {
      setLoading(true);
      // If we have a current case, load case notes; otherwise load global files
      const fileList = currentCase?.path 
        ? await window.electronAPI.listCaseNotes(currentCase.path)
        : await window.electronAPI.listTextFiles();
      // Sort by modified date, most recent first, limit to 10
      const sorted = fileList
        .sort((a, b) => b.modified - a.modified)
        .slice(0, 10);
      setRecentFiles(sorted);
    } catch (error) {
      toast.error('Failed to load recent files');
      console.error('Load recent files error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecent = (filePath: string) => {
    onOpenFile(filePath);
    onClose();
  };

  const handleNewDocument = () => {
    // If we're already in a case, use it directly; otherwise show case selection
    if (currentCase?.path) {
      setSelectedCasePath(currentCase.path);
      setShowNameDialog(true);
    } else {
      setShowCaseSelectionDialog(true);
    }
    setError(null);
  };

  const handleCaseSelected = (casePath: string) => {
    setSelectedCasePath(casePath);
    setShowCaseSelectionDialog(false);
    setShowNameDialog(true);
  };

  useEffect(() => {
    // Validate filename as user types
    if (showNameDialog && fileName.trim()) {
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
    } else if (showNameDialog) {
      setError(null);
    }
  }, [fileName, showNameDialog]);

  const handleCreateNew = async () => {
    if (!fileName.trim()) {
      toast.error('Please enter a file name');
      return;
    }

    if (!selectedCasePath) {
      toast.error('Please select a case');
      return;
    }

    // Ensure .txt extension
    const finalFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    
    // Final validation before confirming
    if (!isValidFileName(finalFileName)) {
      setError('Please enter a valid file name');
      return;
    }

    onNewFile(finalFileName, selectedCasePath);
    onClose();
    setShowNameDialog(false);
    setShowCaseSelectionDialog(false);
    setFileName('');
    setSelectedCasePath(null);
    setError(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
        )}
      </AnimatePresence>

      {/* Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-2 border-cyber-purple-400/40 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden backdrop-blur-xl">
              {/* Enhanced Header */}
              <div className="relative p-6 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                      <div className="relative p-3 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                        Word Editor
                      </h2>
                      <p className="text-sm text-gray-400 mt-0.5">Create and manage documents</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-800/80 rounded-lg transition-colors text-gray-400 hover:text-white"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Open Recent */}
                <div className="relative">
                  <motion.button
                    onClick={() => setShowRecent(!showRecent)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full relative overflow-hidden rounded-2xl border-2 border-gray-700/50 hover:border-cyber-purple-500/60 transition-all duration-300 ease-out bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 shadow-lg hover:shadow-2xl hover:shadow-cyber-purple-500/20 p-4 flex items-center justify-between group"
                  >
                    {/* Glowing background effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10 transition-all duration-500"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl blur-lg"></div>
                        <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-xl">
                          <FileText size={18} className="text-white" />
                        </div>
                      </div>
                      <span className="text-white font-semibold text-base group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400 transition-all duration-300">
                        Open Recent
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 group-hover:text-cyber-purple-400 transition-all duration-300 relative z-10 ${showRecent ? 'rotate-180' : ''}`}
                    />
                  </motion.button>

                  {/* Recent Files Gallery */}
                  <AnimatePresence>
                    {showRecent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="bg-gray-800/50 border-2 border-gray-700/50 rounded-2xl p-4 max-h-64 overflow-y-auto backdrop-blur-sm">
                          {loading ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="inline-flex p-4 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 rounded-2xl border-2 border-cyber-cyan-400/30">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-cyan-400"></div>
                              </div>
                            </div>
                          ) : recentFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <div className="inline-flex p-4 bg-gray-800/50 rounded-2xl border border-cyber-purple-400/20 mb-3">
                                <FileText className="w-12 h-12 text-cyber-purple-400/50" />
                              </div>
                              <p className="text-gray-400 text-sm">No recent files</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              {recentFiles.map((file, index) => (
                                <motion.button
                                  key={file.path}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2, delay: index * 0.05 }}
                                  onClick={() => handleOpenRecent(file.path)}
                                  whileHover={{ y: -2, scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="relative overflow-hidden rounded-xl border-2 border-gray-700/50 hover:border-cyber-purple-500/60 transition-all duration-300 ease-out bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 shadow-lg hover:shadow-cyber-purple-500/20 p-3 text-left group"
                                >
                                  {/* Glowing background effect */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10 transition-all duration-500"></div>
                                  <div className="flex items-center gap-2 mb-2 relative z-10">
                                    <div className="relative">
                                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                                      <div className="relative p-1.5 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                                        <FileText size={12} className="text-white" />
                                      </div>
                                    </div>
                                    <p className="text-white text-xs font-semibold truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400 transition-all duration-300">{file.name}</p>
                                  </div>
                                  <p className="text-gray-500 text-xs relative z-10">{formatDate(file.modified)}</p>
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* New Document */}
                <motion.button
                  onClick={handleNewDocument}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full relative overflow-hidden rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 text-white font-semibold transition-all shadow-lg hover:shadow-2xl hover:shadow-cyber-purple-500/50 p-4 flex items-center justify-center gap-3 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl blur-sm"></div>
                    <div className="relative p-1.5 bg-white/20 rounded-xl">
                      <Plus size={18} className="relative z-10" />
                    </div>
                  </div>
                  <span className="relative z-10 text-base">New Document</span>
                  <Sparkles size={16} className="relative z-10 opacity-70" />
                </motion.button>

                {/* Text Library */}
                <motion.button
                  onClick={() => {
                    onOpenLibrary();
                    onClose();
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full relative overflow-hidden rounded-2xl border-2 border-gray-700/50 hover:border-cyber-purple-500/60 transition-all duration-300 ease-out bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 shadow-lg hover:shadow-2xl hover:shadow-cyber-purple-500/20 p-4 flex items-center justify-center gap-3 group"
                >
                  {/* Glowing background effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10 transition-all duration-500"></div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl blur-lg"></div>
                    <div className="relative p-1.5 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-xl">
                      <FolderOpen size={18} className="text-white" />
                    </div>
                  </div>
                  <span className="text-white font-semibold text-base group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400 transition-all duration-300 relative z-10">
                    Text Library
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Case Selection Dialog */}
      <CaseSelectionDialog
        isOpen={showCaseSelectionDialog}
        onClose={() => {
          setShowCaseSelectionDialog(false);
          setSelectedCasePath(null);
        }}
        onSelectCase={handleCaseSelected}
      />

      {/* Name File Dialog */}
      <AnimatePresence>
        {showNameDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowNameDialog(false);
              setShowCaseSelectionDialog(false);
              setFileName('');
              setSelectedCasePath(null);
              setError(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-2 border-cyber-purple-400/40 rounded-2xl shadow-2xl w-full max-w-sm p-6 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl blur-xl opacity-50"></div>
                  <div className="relative p-2 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent">
                  Name File
                </h3>
              </div>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNew();
                  } else if (e.key === 'Escape') {
                    setShowNameDialog(false);
                    setShowCaseSelectionDialog(false);
                    setFileName('');
                    setSelectedCasePath(null);
                    setError(null);
                  }
                }}
                placeholder="Enter file name..."
                autoFocus
                className={`w-full px-4 py-3 bg-gray-800/80 border-2 rounded-xl text-white placeholder-gray-500 focus:outline-none mb-3 backdrop-blur-sm transition-all ${
                  error 
                    ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                    : 'border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20'
                }`}
              />
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm mb-4 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  {error}
                </motion.p>
              )}
              <div className="flex gap-3 justify-end">
                <motion.button
                  onClick={() => {
                    setShowNameDialog(false);
                    setShowCaseSelectionDialog(false);
                    setFileName('');
                    setSelectedCasePath(null);
                    setError(null);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-xl transition-all border border-gray-700/50 hover:border-gray-600/50 font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCreateNew}
                  disabled={!fileName.trim() || !!error}
                  whileHover={{ scale: !fileName.trim() || !!error ? 1 : 1.02 }}
                  whileTap={{ scale: !fileName.trim() || !!error ? 1 : 0.98 }}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 text-white rounded-xl transition-all shadow-lg hover:shadow-cyber-purple-500/50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative z-10">Create</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

