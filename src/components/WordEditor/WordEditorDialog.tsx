import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ChevronDown, Plus } from 'lucide-react';
import { useToast } from '../Toast/ToastContext';
import { useArchiveContext } from '../../contexts/ArchiveContext';
import { isValidFileName } from '../../utils/pathValidator';

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
  onNewFile: (fileName: string) => void;
  onOpenLibrary: () => void;
}

export function WordEditorDialog({ isOpen, onClose, onOpenFile, onNewFile, onOpenLibrary }: WordEditorDialogProps) {
  const [showRecent, setShowRecent] = useState(false);
  const [recentFiles, setRecentFiles] = useState<TextFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [fileName, setFileName] = useState('');
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
    setShowNameDialog(true);
    setError(null);
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

    // Ensure .txt extension
    const finalFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    
    // Final validation before confirming
    if (!isValidFileName(finalFileName)) {
      setError('Please enter a valid file name');
      return;
    }

    onNewFile(finalFileName);
    onClose();
    setShowNameDialog(false);
    setFileName('');
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
            className="fixed inset-0 bg-black/50 z-50"
          />
        )}
      </AnimatePresence>

      {/* Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900 border border-cyber-purple-500/30 rounded-lg shadow-2xl w-full max-w-md">
              {/* Header */}
              <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-purple bg-clip-text text-transparent">
                  Word Editor
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Open Recent */}
                <div className="relative">
                  <button
                    onClick={() => setShowRecent(!showRecent)}
                    className="w-full p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-cyber-purple-400" />
                      <span className="text-white">Open Recent</span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 transition-transform ${showRecent ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Recent Files Gallery */}
                  <AnimatePresence>
                    {showRecent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 overflow-hidden"
                      >
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 max-h-64 overflow-y-auto">
                          {loading ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyber-purple-400"></div>
                            </div>
                          ) : recentFiles.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">No recent files</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {recentFiles.map((file) => (
                                <motion.button
                                  key={file.path}
                                  onClick={() => handleOpenRecent(file.path)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="p-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-left transition-colors group"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <FileText size={14} className="text-cyber-purple-400 flex-shrink-0" />
                                    <p className="text-white text-xs font-medium truncate">{file.name}</p>
                                  </div>
                                  <p className="text-gray-500 text-xs">{formatDate(file.modified)}</p>
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
                <button
                  onClick={handleNewDocument}
                  className="w-full p-3 bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span>New Document</span>
                </button>

                {/* Text Library */}
                <button
                  onClick={() => {
                    onOpenLibrary();
                    onClose();
                  }}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FileText size={18} className="text-cyber-purple-400" />
                  <span className="text-white">Text Library</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name File Dialog */}
      <AnimatePresence>
        {showNameDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70"
            onClick={() => {
              setShowNameDialog(false);
              setFileName('');
              setError(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-cyber-purple-500/30 rounded-lg shadow-2xl w-full max-w-sm p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Name File</h3>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNew();
                  } else if (e.key === 'Escape') {
                    setShowNameDialog(false);
                    setFileName('');
                    setError(null);
                  }
                }}
                placeholder="Enter file name..."
                autoFocus
                className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none mb-2 ${
                  error 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-700 focus:border-cyber-purple-500'
                }`}
              />
              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowNameDialog(false);
                    setFileName('');
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNew}
                  disabled={!fileName.trim() || !!error}
                  className="px-4 py-2 bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

