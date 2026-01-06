import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, FileText, Folder } from 'lucide-react';
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
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleBackToGallery}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label="Back to gallery"
          >
            <ArrowLeft size={18} className="text-gray-400" />
          </button>
          <h3 className="text-lg font-semibold text-white">Notes: {selectedCase.name}</h3>
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label="Back to editor"
          >
            <ArrowLeft size={18} className="text-gray-400" />
          </button>
          <h3 className="text-lg font-semibold text-white">Case Notes Library</h3>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700/50 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Cases Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Folder size={48} className="text-gray-600 mb-4" />
            <p className="text-gray-400 mb-2">
              {searchQuery ? 'No cases match your search' : 'No cases found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredCases.map((caseItem) => {
              const categoryTag = getTagById(caseItem.categoryTagId);
              const noteCount = caseNoteCounts[caseItem.path] || 0;
              
              return (
                <motion.div
                  key={caseItem.path}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative cursor-pointer group"
                  onClick={() => handleCaseClick(caseItem)}
                >
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-700 hover:border-cyber-purple-500 transition-colors bg-gray-800/50 p-4 min-h-[120px] flex flex-col">
                    {/* Category Tag */}
                    {categoryTag && (
                      <div className="absolute top-2 left-2 z-10">
                        <CategoryTag tag={categoryTag} size="xs" />
                      </div>
                    )}

                    {/* Note Count Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-cyber-purple-500/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <FileText size={12} />
                        <span>{noteCount}</span>
                      </div>
                    </div>

                    {/* Case Name */}
                    <div className="flex-1 flex items-center justify-center mt-6">
                      <h4 className="text-white font-medium text-sm text-center line-clamp-2">
                        {caseItem.name}
                      </h4>
                    </div>

                    {/* Description (if available) */}
                    {caseItem.description && (
                      <p className="text-gray-400 text-xs mt-2 line-clamp-2 text-center">
                        {caseItem.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {/* Action Bar */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleNewFileClick}
          className="px-3 py-1.5 bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <FileText size={16} />
          <span>New Note</span>
        </button>
      </div>

      {/* Notes Grid */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <FileText size={48} className="text-gray-600 mb-4" />
          <p className="text-gray-400 mb-2">No notes yet</p>
          <button
            onClick={handleNewFileClick}
            className="px-4 py-2 bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white rounded-lg transition-colors"
          >
            Create your first note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {files.map((file) => (
            <motion.div
              key={file.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-cyber-purple-500 transition-colors cursor-pointer"
              onClick={() => onOpenFile(file.path)}
            >
              <h4 className="text-white font-medium mb-2">{file.name}</h4>
              {file.preview && (
                <p className="text-gray-400 text-sm line-clamp-3 mb-2">{file.preview}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(file.modified).toLocaleDateString()}</span>
                <span>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </motion.div>
          ))}
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
