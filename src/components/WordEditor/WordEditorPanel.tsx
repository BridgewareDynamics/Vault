import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Library, Maximize2, Bookmark } from 'lucide-react';
import { WordEditor, WordEditorHandle } from './WordEditor';
import { TextLibrary } from './TextLibrary';
import { BookmarkLibrary } from '../Bookmarks/BookmarkLibrary';
import { useToast } from '../Toast/ToastContext';
import { useWordEditor } from '../../contexts/WordEditorContext';
import { debugLog } from '../../utils/debugLogger';
import { WordEditorErrorBoundary } from './WordEditorErrorBoundary';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

interface WordEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilePath?: string | null;
  openLibrary?: boolean;
}

export function WordEditorPanel({ isOpen, onClose, initialFilePath, openLibrary }: WordEditorPanelProps) {
  const [showLibrary, setShowLibrary] = useState(openLibrary || false);
  const [showBookmarkLibrary, setShowBookmarkLibrary] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(initialFilePath || null);
  const [editorKey, setEditorKey] = useState(0); // Force re-render when file changes
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const editorRef = useRef<WordEditorHandle>(null);
  const toast = useToast();
  const { setIsOpen: setContextOpen } = useWordEditor();

  // Update file path when initialFilePath changes
  useEffect(() => {
    if (initialFilePath !== undefined) {
      setCurrentFilePath(initialFilePath);
    }
  }, [initialFilePath]);

  // Open library if requested
  useEffect(() => {
    if (openLibrary && isOpen) {
      setShowLibrary(true);
    }
  }, [openLibrary, isOpen]);

  useEffect(() => {
    setContextOpen(isOpen);
  }, [isOpen, setContextOpen]);

  // Listen for reattach data from detached window
  useEffect(() => {
    const handleReattach = (event: CustomEvent<{ content: string; filePath?: string | null; viewState?: 'editor' | 'library' | 'bookmarkLibrary' }>) => {
      const data = event.detail;
      // Set the file path if provided
      if (data.filePath) {
        setCurrentFilePath(data.filePath);
      } else {
        setCurrentFilePath(null);
      }
      
      // Restore view state
      if (data.viewState) {
        if (data.viewState === 'bookmarkLibrary') {
          setShowBookmarkLibrary(true);
          setShowLibrary(false);
        } else if (data.viewState === 'library') {
          setShowBookmarkLibrary(false);
          setShowLibrary(true);
        } else {
          // 'editor' or default
          setShowBookmarkLibrary(false);
          setShowLibrary(false);
        }
      }
      
      // Force re-render to ensure editor is ready
      setEditorKey(prev => prev + 1);
      
      // Set content after a short delay to ensure editor is ready
      // Use setTimeout to allow the editor to initialize first
      setTimeout(() => {
        if (editorRef.current && data.content) {
          editorRef.current.setContent(data.content);
          // Mark as saved since it was just saved before reattaching
          editorRef.current.markAsSaved();
        }
      }, 100);
    };

    window.addEventListener('reattach-word-editor-data' as any, handleReattach as EventListener);
    return () => {
      window.removeEventListener('reattach-word-editor-data' as any, handleReattach as EventListener);
    };
  }, []);

  const handleDetach = async () => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return;
      }

      // Get current editor content from the WordEditor component via ref
      const content = editorRef.current?.getContent() || '';
      
      // Determine current view state
      let viewState: 'editor' | 'library' | 'bookmarkLibrary' = 'editor';
      if (showBookmarkLibrary) {
        viewState = 'bookmarkLibrary';
      } else if (showLibrary) {
        viewState = 'library';
      }
      
      console.log('WordEditorPanel: Detaching with viewState', viewState, { showBookmarkLibrary, showLibrary });
      
      // Create detached window
      await window.electronAPI.createWordEditorWindow({
        content,
        filePath: currentFilePath,
        viewState,
      });

      // Close panel after detaching
      onClose();
      toast.info('Editor opened in separate window');
    } catch (error) {
      toast.error('Failed to open editor in separate window');
      console.error('Detach error:', error);
    }
  };

  const handleOpenFile = (filePath: string) => {
    debugLog({
      location: 'WordEditorPanel.tsx:handleOpenFile',
      message: 'handleOpenFile called',
      data: { newFilePath: filePath, currentFilePath, showLibrary },
    });
    // Force a re-render by incrementing editorKey, even if it's the same file
    // This ensures the file loads even if the user clicks the same file again
    setEditorKey(prev => prev + 1);
    setCurrentFilePath(filePath);
    setShowLibrary(false);
  };

  const handleNewFile = async (fileName: string) => {
    if (!window.electronAPI) {
      toast.error('Electron API not available');
      return;
    }

    try {
      // Create empty file with the provided name
      const newFilePath = await window.electronAPI.createTextFile(fileName, '');
      setCurrentFilePath(newFilePath);
      setShowLibrary(false);
      // Force a re-render by incrementing editorKey
      setEditorKey(prev => prev + 1);
      toast.success('New file created');
    } catch (error) {
      toast.error('Failed to create file');
      console.error('Create file error:', error);
    }
  };

  const handleFileDeleted = (deletedFilePath: string) => {
    debugLog({
      location: 'WordEditorPanel.tsx:handleFileDeleted',
      message: 'handleFileDeleted called',
      data: { deletedFilePath, currentFilePath },
    });
    // If the deleted file is the currently open file, clear it
    if (currentFilePath === deletedFilePath) {
      setCurrentFilePath(null);
      // Force a re-render by incrementing editorKey
      setEditorKey(prev => prev + 1);
      // Clear editor content - force a re-render by setting filePath to null
      // The WordEditor component will handle clearing the content
      // Also clear any localStorage drafts for this file
      const draftKey = `word-editor-draft-${deletedFilePath}`;
      localStorage.removeItem(draftKey);
      localStorage.removeItem('word-editor-draft-new');
      debugLog({
        location: 'WordEditorPanel.tsx:handleFileDeleted',
        message: 'File deleted, cleared filePath and incremented editorKey',
        data: { newFilePath: null, editorKey: editorKey + 1 },
      });
    }
  };


  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-[500px] bg-gray-900/95 backdrop-blur-lg border-l border-cyber-purple-500/30 shadow-2xl z-50 flex flex-col"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold bg-gradient-purple bg-clip-text text-transparent">
                  Word Editor
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Detach button - left corner */}
                <button
                  onClick={handleDetach}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Detach editor to separate window"
                  title="Open in separate window"
                >
                  <Maximize2 size={18} className="text-cyber-purple-400" />
                </button>
                {/* Bookmark Library button */}
                <button
                  onClick={() => {
                    setShowBookmarkLibrary(!showBookmarkLibrary);
                    setShowLibrary(false);
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Open bookmark library"
                  title="Bookmark Library"
                >
                  <Bookmark size={18} className={showBookmarkLibrary ? 'text-cyber-purple-400' : 'text-gray-400'} />
                </button>
                {/* Library button */}
                <button
                  onClick={() => {
                    setShowLibrary(!showLibrary);
                    setShowBookmarkLibrary(false);
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Open text library"
                  title="Text Library"
                >
                  <Library size={18} className={showLibrary ? 'text-cyber-purple-400' : 'text-gray-400'} />
                </button>
                {/* Close button */}
                <button
                  onClick={() => {
                    if (editorRef.current?.hasUnsavedChanges()) {
                      setShowUnsavedDialog(true);
                      setPendingClose(true);
                    } else {
                      onClose();
                    }
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close editor"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {showBookmarkLibrary ? (
                <BookmarkLibrary
                  onClose={() => setShowBookmarkLibrary(false)}
                  isDetached={false}
                />
              ) : showLibrary ? (
                <TextLibrary
                  onOpenFile={handleOpenFile}
                  onNewFile={handleNewFile}
                  onClose={() => setShowLibrary(false)}
                  onFileDeleted={handleFileDeleted}
                />
              ) : (
                <WordEditorErrorBoundary
                  onReset={() => {
                    setEditorKey(prev => prev + 1);
                    setCurrentFilePath(null);
                  }}
                >
                  <WordEditor
                    ref={editorRef}
                    key={`${currentFilePath || 'new'}-${editorKey}`} // Force re-render when file path or key changes
                    filePath={currentFilePath}
                    onFilePathChange={setCurrentFilePath}
                  />
                </WordEditorErrorBoundary>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onSave={async () => {
          // Save current file
          if (editorRef.current && currentFilePath && window.electronAPI) {
            const textContent = editorRef.current.getTextContent();
            try {
              await window.electronAPI.saveTextFile(currentFilePath, textContent);
              // Mark as saved to clear the unsaved changes indicator
              editorRef.current.markAsSaved();
              toast.success('File saved');
            } catch (error) {
              toast.error('Failed to save file');
              console.error('Save error:', error);
              return; // Don't close if save failed
            }
          }
          setShowUnsavedDialog(false);
          if (pendingClose) {
            setPendingClose(false);
            onClose();
          }
        }}
        onDiscard={() => {
          setShowUnsavedDialog(false);
          if (pendingClose) {
            setPendingClose(false);
            onClose();
          }
        }}
        onCancel={() => {
          setShowUnsavedDialog(false);
          setPendingClose(false);
        }}
      />
    </>
  );
}

