import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, FileText, Folder, Sparkles, TrendingUp, Plus } from 'lucide-react';
import { useToast } from '../Toast/ToastContext';
import { useCategoryTags } from '../../hooks/useCategoryTags';
import { CategoryTag } from '../Archive/CategoryTag';
import { ArchiveCase } from '../../types';
import { NewFileNameDialog } from './NewFileNameDialog';
import { DeleteTextFileConfirmDialog } from './DeleteTextFileConfirmDialog';

interface TextFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  preview?: string;
}

interface CaseNotesGalleryProps {
  onSelectCase?: (casePath: string, caseName?: string) => void;
  onClose: () => void;
  onOpenFile: (filePath: string) => void;
  onNewFile: (fileName: string) => void;
  onFileDeleted?: (filePath: string) => void;
}

export function CaseNotesGallery({ onSelectCase, onClose, onOpenFile, onNewFile, onFileDeleted }: CaseNotesGalleryProps) {
  const [cases, setCases] = useState<ArchiveCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<ArchiveCase | null>(null);
  const [caseNoteCounts, setCaseNoteCounts] = useState<Record<string, number>>({});
  const toast = useToast();
  const { getTagById } = useCategoryTags();

  useEffect(() => {
    loadCases();
  }, []);

  // Load note counts for each case
  useEffect(() => {
    if (cases.length > 0) {
      loadNoteCounts();
    }
  }, [cases]);

  const loadCases = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const casesList = await window.electronAPI.listArchiveCases();
      setCases(casesList);
    } catch (error) {
      toast.error('Failed to load cases');
      console.error('Load cases error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNoteCounts = async () => {
    if (!window.electronAPI) return;

    const counts: Record<string, number> = {};
    
    await Promise.all(
      cases.map(async (caseItem) => {
        try {
          const notes = await window.electronAPI.listCaseNotes(caseItem.path);
          counts[caseItem.path] = notes.length;
        } catch (error) {
          counts[caseItem.path] = 0;
        }
      })
    );

    setCaseNoteCounts(counts);
  };

  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) {
      return cases;
    }

    const queryLower = searchQuery.toLowerCase();
    return cases.filter(caseItem => {
      // Match case name
      if (caseItem.name.toLowerCase().includes(queryLower)) {
        return true;
      }
      // Match description
      if (caseItem.description?.toLowerCase().includes(queryLower)) {
        return true;
      }
      // Match tag name if case has a tag
      if (caseItem.categoryTagId) {
        const tag = getTagById(caseItem.categoryTagId);
        if (tag && tag.name.toLowerCase().includes(queryLower)) {
          return true;
        }
      }
      return false;
    });
  }, [cases, searchQuery, getTagById]);

  const handleCaseClick = (caseItem: ArchiveCase) => {
    if (onSelectCase) {
      // Call the handler with both path and name - parent will handle state
      onSelectCase(caseItem.path, caseItem.name);
    } else {
      // If no handler, use internal state (for standalone gallery view)
      setSelectedCase(caseItem);
    }
  };

  const handleBackToGallery = () => {
    setSelectedCase(null);
  };

  // If a case is selected AND we don't have an onSelectCase handler (standalone mode), show its notes
  // If onSelectCase is provided, the parent (TextLibrary) will handle showing notes
  if (selectedCase && !onSelectCase) {
    // We need to temporarily set the context for this case
    // For now, we'll create a wrapper that provides the context
    return (
      <div className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
        <div className="relative p-3 sm:p-4 md:p-6 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
            <motion.button
              onClick={handleBackToGallery}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 sm:p-2 hover:bg-gray-800/80 rounded-xl transition-colors text-gray-400 hover:text-white flex-shrink-0"
              aria-label="Back to gallery"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl sm:rounded-2xl blur-xl opacity-50"></div>
              <div className="relative p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl sm:rounded-2xl shadow-2xl">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] truncate">
                {selectedCase.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 hidden sm:block">Case notes and documents</p>
            </div>
          </div>
        </div>
        <CaseNotesView
          casePath={selectedCase.path}
          caseName={selectedCase.name}
          onOpenFile={onOpenFile}
          onNewFile={onNewFile}
          onFileDeleted={onFileDeleted}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
        <div className="text-center space-y-6">
          <div className="inline-flex p-6 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 rounded-2xl border-2 border-cyber-cyan-400/30">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan-400"></div>
          </div>
          <div>
            <p className="text-gray-300 text-lg font-medium">Loading cases...</p>
            <p className="text-gray-500 text-sm mt-1">Preparing your case notes library</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
      {/* Enhanced Header - Responsive */}
      <div className="relative p-3 sm:p-4 md:p-6 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 sm:p-2 hover:bg-gray-800/80 rounded-xl transition-colors text-gray-400 hover:text-white flex-shrink-0"
              aria-label="Back to editor"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl sm:rounded-2xl blur-xl opacity-50"></div>
              <div className="relative p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl sm:rounded-2xl shadow-2xl">
                <Folder className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] truncate">
                Case Notes Library
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 hidden sm:block">Browse and manage notes across all cases</p>
            </div>
          </div>
          {filteredCases.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-800/60 rounded-lg sm:rounded-xl border border-cyber-purple-400/20 flex-shrink-0">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-cyber-purple-400" />
              <span className="text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">{filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Search Bar - Responsive */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-cyber-purple-400/20 bg-gray-900/50 flex-shrink-0">
        <div className="relative">
          <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
              <div className="relative p-1 sm:p-1.5 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                <Search className="text-white w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 sm:pl-12 md:pl-14 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 bg-gray-800/80 border-2 border-gray-700/50 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 backdrop-blur-sm transition-all"
          />
        </div>
      </div>

      {/* Enhanced Cases Grid - Responsive */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        {filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="inline-flex p-6 sm:p-8 bg-gray-800/50 rounded-xl sm:rounded-2xl border border-cyber-purple-400/20 mb-4 sm:mb-6">
              <Folder className="w-16 h-16 sm:w-20 sm:h-20 text-cyber-purple-400/50" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-300 mb-2">
              {searchQuery ? 'No cases match your search' : 'No cases found'}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base max-w-md">
              {searchQuery ? 'Try adjusting your search terms' : 'Create a case in the archive to start organizing your notes'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            <AnimatePresence>
              {filteredCases.map((caseItem, index) => {
                const categoryTag = getTagById(caseItem.categoryTagId);
                const noteCount = caseNoteCounts[caseItem.path] || 0;
                
                return (
                  <motion.div
                    key={caseItem.path}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative cursor-pointer group"
                    onClick={() => handleCaseClick(caseItem)}
                  >
                    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border-2 border-gray-700/50 hover:border-cyber-purple-500/60 transition-all duration-300 ease-out bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 shadow-lg hover:shadow-2xl hover:shadow-cyber-purple-500/20 p-3 sm:p-4 md:p-5 min-h-[120px] sm:min-h-[140px] md:min-h-[160px] flex flex-col">
                      {/* Glowing background effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10 transition-all duration-500"></div>
                      
                      {/* Category Tag */}
                      {categoryTag && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
                          <CategoryTag tag={categoryTag} size="xs" />
                        </div>
                      )}

                      {/* Enhanced Note Count Badge - Responsive */}
                      <motion.div 
                        className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10"
                        whileHover={{ scale: 1.1 }}
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-md sm:rounded-lg blur-sm opacity-60"></div>
                          <div className="relative bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg flex items-center gap-1 sm:gap-1.5 shadow-lg">
                            <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-90" />
                            <span>{noteCount}</span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Case Icon - Responsive */}
                      <div className="flex-1 flex items-center justify-center mt-1 sm:mt-2 mb-2 sm:mb-3">
                        <motion.div
                          className="relative"
                          animate={{
                            filter: [
                              'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
                              'drop-shadow(0 0 25px rgba(139, 92, 246, 0.9))',
                              'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl sm:rounded-2xl blur-xl"></div>
                          <div className="relative p-2 sm:p-3 md:p-4 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-xl sm:rounded-2xl">
                            <Folder className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                          </div>
                        </motion.div>
                      </div>

                      {/* Case Name - Responsive */}
                      <div className="flex-1 flex items-center justify-center min-h-0">
                        <h4 className="text-white font-semibold text-xs sm:text-sm text-center line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400 transition-all duration-300 px-1">
                          {caseItem.name}
                        </h4>
                      </div>

                      {/* Description (if available) - Responsive */}
                      {caseItem.description && (
                        <p className="text-gray-400 text-[10px] sm:text-xs mt-1 sm:mt-2 line-clamp-2 text-center leading-relaxed px-1">
                          {caseItem.description}
                        </p>
                      )}

                      {/* Hover indicator */}
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component for showing notes of a selected case
interface CaseNotesViewProps {
  casePath: string;
  caseName: string;
  onOpenFile: (filePath: string) => void;
  onNewFile: (fileName: string) => void;
  onFileDeleted?: (filePath: string) => void;
}

function CaseNotesView({ casePath, caseName: _caseName, onOpenFile, onNewFile: _onNewFile, onFileDeleted }: CaseNotesViewProps) {
  const [files, setFiles] = useState<TextFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ path: string; name: string } | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadFiles();
  }, [casePath]);

  const loadFiles = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fileList = await window.electronAPI.listCaseNotes(casePath);
      setFiles(fileList);
    } catch (error) {
      toast.error('Failed to load notes');
      console.error('Load files error:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleDeleteClick = (filePath: string, fileName: string) => {
  //   setFileToDelete({ path: filePath, name: fileName });
  //   setShowDeleteDialog(true);
  // };

  const handleDeleteConfirm = async () => {
    if (!window.electronAPI || !fileToDelete) return;

    try {
      await window.electronAPI.deleteTextFile(fileToDelete.path);
      await loadFiles();
      toast.success('Note deleted');
      if (onFileDeleted) {
        onFileDeleted(fileToDelete.path);
      }
      setFileToDelete(null);
    } catch (error) {
      toast.error('Failed to delete note');
      console.error('Delete error:', error);
    }
  };

  const handleNewFileClick = () => {
    setShowNewFileDialog(true);
  };

  const handleNewFileConfirm = async (fileName: string) => {
    if (!window.electronAPI) {
      toast.error('Electron API not available');
      return;
    }
    try {
      const newFilePath = await window.electronAPI.createCaseNote(casePath, fileName, '');
      setShowNewFileDialog(false);
      await loadFiles();
      onOpenFile(newFilePath);
      toast.success('Note created');
    } catch (error) {
      toast.error('Failed to create note');
      console.error('Create note error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
        <div className="text-center space-y-6">
          <div className="inline-flex p-6 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 rounded-2xl border-2 border-cyber-cyan-400/30">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan-400"></div>
          </div>
          <div>
            <p className="text-gray-300 text-lg font-medium">Loading notes...</p>
            <p className="text-gray-500 text-sm mt-1">Preparing your documents</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
      {/* Enhanced Action Bar - Responsive */}
      <div className="mb-4 sm:mb-5 md:mb-6 flex justify-end">
        <motion.button
          onClick={handleNewFileClick}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden rounded-lg sm:rounded-xl border-2 border-transparent bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 text-white font-semibold transition-all shadow-lg hover:shadow-2xl hover:shadow-cyber-purple-500/50 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 flex items-center gap-2 sm:gap-3 group text-sm sm:text-base"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-md sm:rounded-lg blur-sm"></div>
            <div className="relative p-1 sm:p-1.5 bg-white/20 rounded-md sm:rounded-lg">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4 md:h-4 relative z-10" />
            </div>
          </div>
          <span className="relative z-10 whitespace-nowrap">New Note</span>
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 relative z-10 opacity-70 hidden sm:block" />
        </motion.button>
      </div>

      {/* Enhanced Notes Grid - Responsive */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="inline-flex p-6 sm:p-8 bg-gray-800/50 rounded-xl sm:rounded-2xl border border-cyber-purple-400/20 mb-4 sm:mb-6">
            <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-cyber-purple-400/50" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-300 mb-2">No notes yet</h3>
          <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">Create your first note to get started</p>
          <motion.button
            onClick={handleNewFileClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 hover:from-cyan-700 hover:via-purple-700 hover:to-cyan-700 rounded-lg sm:rounded-xl font-semibold text-white text-sm sm:text-base transition-all shadow-lg hover:shadow-cyan-500/50 transform relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Create your first note</span>
            </span>
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={file.path}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-gray-700/50 hover:border-cyber-purple-500/60 transition-all duration-300 ease-out bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 shadow-lg hover:shadow-2xl hover:shadow-cyber-purple-500/20 cursor-pointer group"
                onClick={() => onOpenFile(file.path)}
              >
                {/* Glowing background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10 transition-all duration-500"></div>
                
                <div className="relative p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
                  {/* File Icon & Name - Responsive */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg sm:rounded-xl blur-lg"></div>
                      <div className="relative p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg sm:rounded-xl">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-sm sm:text-base mb-1 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400 transition-all duration-300">
                        {file.name}
                      </h4>
                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-cyber-purple-400/60"></span>
                          {new Date(file.modified).toLocaleDateString()}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview - Responsive */}
                  {file.preview && (
                    <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 leading-relaxed pl-8 sm:pl-10 md:pl-12">
                      {file.preview}
                    </p>
                  )}

                  {/* Hover indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Dialogs */}
      {showNewFileDialog && (
        <NewFileNameDialog
          isOpen={showNewFileDialog}
          onClose={() => setShowNewFileDialog(false)}
          onConfirm={handleNewFileConfirm}
        />
      )}

      {showDeleteDialog && fileToDelete && (
        <DeleteTextFileConfirmDialog
          isOpen={showDeleteDialog}
          fileName={fileToDelete.name}
          onClose={() => {
            setShowDeleteDialog(false);
            setFileToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
