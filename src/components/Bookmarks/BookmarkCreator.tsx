import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface BookmarkCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bookmark: {
    pdfPath: string;
    pageNumber: number;
    name: string;
    description?: string;
    note?: string;
    createFolder: boolean;
    thumbnail?: string;
  }) => void;
  pdfPath: string;
  pageNumber: number;
  pdfName: string;
  existingBookmarkNames?: string[];
}

export function BookmarkCreator({ 
  isOpen, 
  onClose, 
  onConfirm, 
  pdfPath, 
  pageNumber, 
  pdfName 
}: BookmarkCreatorProps) {
  const [bookmarkName, setBookmarkName] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [createFolder, setCreateFolder] = useState(false);
  const [existingFolder, setExistingFolder] = useState<{ id: string; name: string } | null>(null);
  const [checkingFolder, setCheckingFolder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Auto-generate bookmark name from PDF name and page number
      const defaultName = `${pdfName} - Page ${pageNumber}`;
      setBookmarkName(defaultName);
      setDescription('');
      setNote('');
      setCreateFolder(false);
      setExistingFolder(null);
      checkForExistingFolder();
    }
  }, [isOpen, pdfPath, pdfName, pageNumber]);

  const checkForExistingFolder = async () => {
    if (!window.electronAPI) return;

    try {
      setCheckingFolder(true);
      const folders = await window.electronAPI.getBookmarkFolders();
      // Normalize paths for comparison
      const normalizePath = (path: string) => path.replace(/\\/g, '/');
      const normalizedPdfPath = normalizePath(pdfPath);
      
      const folder = folders.find(f => normalizePath(f.pdfPath) === normalizedPdfPath);
      if (folder) {
        setExistingFolder({ id: folder.id, name: folder.name });
        setCreateFolder(false); // Don't allow creating a new folder if one exists
      } else {
        setExistingFolder(null);
      }
    } catch (error) {
      console.error('Failed to check for existing folder:', error);
    } finally {
      setCheckingFolder(false);
    }
  };

  const handleConfirm = () => {
    if (!bookmarkName.trim()) {
      return;
    }

    onConfirm({
      pdfPath,
      pageNumber,
      name: bookmarkName.trim(),
      description: description.trim() || undefined,
      note: note.trim() || undefined,
      createFolder,
    });
    
    setBookmarkName('');
    setDescription('');
    setNote('');
    setCreateFolder(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmark-creator-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyPress}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-cyber-purple-500/60 shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center gap-3 mb-4">
            <h2 id="bookmark-creator-title" className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              Create Bookmark
            </h2>
          </div>

          {/* PDF Info */}
          <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">PDF:</p>
            <p className="text-white font-medium truncate" title={pdfName}>{pdfName}</p>
            <p className="text-sm text-gray-400 mt-1">Page: {pageNumber}</p>
          </div>

          {/* Bookmark Name Input */}
          <label htmlFor="bookmark-name-input" className="block text-sm font-medium text-gray-300 mb-2">
            Bookmark Name <span className="text-red-400">*</span>
          </label>
          <input
            id="bookmark-name-input"
            type="text"
            value={bookmarkName}
            onChange={(e) => setBookmarkName(e.target.value)}
            onKeyDown={handleKeyPress}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter bookmark name..."
            autoFocus
            aria-label="Bookmark name"
            aria-required="true"
            className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 mb-4 transition-colors"
          />

          {/* Description Input */}
          <label htmlFor="bookmark-description-input" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="bookmark-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyPress}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            placeholder="Brief description of this bookmark..."
            rows={2}
            aria-label="Bookmark description"
            className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 mb-4 transition-colors resize-none"
          />

          {/* Note Input */}
          <label htmlFor="bookmark-note-input" className="block text-sm font-medium text-gray-300 mb-2">
            Note (Optional)
          </label>
          <textarea
            id="bookmark-note-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyPress}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            placeholder="Add your research notes here..."
            rows={3}
            aria-label="Bookmark note"
            className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 mb-4 transition-colors resize-none"
          />

          {/* Folder Info / Create Folder Checkbox */}
          {existingFolder ? (
            <div className="mb-6 p-3 bg-cyber-purple-500/10 border border-cyber-purple-500/30 rounded-lg">
              <p className="text-sm text-cyber-purple-300 font-medium mb-1">
                Existing Folder Found
              </p>
              <p className="text-xs text-gray-400">
                This bookmark will be automatically added to "{existingFolder.name}"
              </p>
            </div>
          ) : (
            <div className="mb-6 flex items-start gap-3">
              <input
                id="create-folder-checkbox"
                type="checkbox"
                checked={createFolder}
                onChange={(e) => setCreateFolder(e.target.checked)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                disabled={checkingFolder}
                className="mt-1 w-5 h-5 rounded border-2 border-gray-600 bg-gray-700/50 text-cyber-purple-500 focus:ring-2 focus:ring-cyber-purple-500 focus:ring-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Create bookmark folder for PDF"
              />
              <label 
                htmlFor="create-folder-checkbox" 
                className={`text-sm text-gray-300 flex-1 ${checkingFolder ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  if (!checkingFolder) {
                    e.stopPropagation();
                    setCreateFolder(!createFolder);
                  }
                }}
              >
                Create bookmark folder for PDF
                <span className="block text-xs text-gray-400 mt-1">
                  Organize all bookmarks from this PDF in a dedicated folder
                </span>
              </label>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Cancel creating bookmark"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!bookmarkName.trim()}
              className="flex-1 px-4 py-2 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Create bookmark"
              aria-disabled={!bookmarkName.trim()}
            >
              Create
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

