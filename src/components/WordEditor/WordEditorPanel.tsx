import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Library, Maximize2, Bookmark, FileText } from 'lucide-react';
import { WordEditor, WordEditorHandle } from './WordEditor';
import { TextLibrary } from './TextLibrary';
import { BookmarkLibrary } from '../Bookmarks/BookmarkLibrary';
import { useToast } from '../Toast/ToastContext';
import { useWordEditor } from '../../contexts/WordEditorContext';
import { useArchiveContext } from '../../contexts/ArchiveContext';
import { debugLog } from '../../utils/debugLogger';
import { WordEditorErrorBoundary } from './WordEditorErrorBoundary';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

const MIN_WIDTH = 400;
const MAX_WIDTH_PERCENT = 80;

interface WordEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilePath?: string | null;
  openLibrary?: boolean;
  layoutMode?: 'overlay' | 'inline';
}

export function WordEditorPanel({ isOpen, onClose, initialFilePath, openLibrary, layoutMode = 'overlay' }: WordEditorPanelProps) {
  const [showLibrary, setShowLibrary] = useState(openLibrary || false);
  const [showBookmarkLibrary, setShowBookmarkLibrary] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(initialFilePath || null);
  const [editorKey, setEditorKey] = useState(0); // Force re-render when file changes
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const editorRef = useRef<WordEditorHandle>(null);
  const toast = useToast();
  const { setIsOpen: setContextOpen, panelWidth, setPanelWidth } = useWordEditor();
  const { currentCase } = useArchiveContext();
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(500);
  const hasAutoOpenedLibraryRef = useRef(false); // Track if we've auto-opened library for this panel session
  const hasSetWidthFromOpenLibraryRef = useRef(false); // Track if we've set width from openLibrary prop

  // Update file path when initialFilePath changes
  useEffect(() => {
    if (initialFilePath !== undefined) {
      setCurrentFilePath(initialFilePath);
    }
  }, [initialFilePath]);

  // Open library if requested and set panel to minimum width (only on initial open)
  useEffect(() => {
    if (openLibrary && isOpen && !hasSetWidthFromOpenLibraryRef.current) {
      setShowLibrary(true);
      // Set panel width to minimum when opening with library (only once)
      setPanelWidth(MIN_WIDTH);
      hasSetWidthFromOpenLibraryRef.current = true;
    }
    // Reset flag when panel closes
    if (!isOpen) {
      hasSetWidthFromOpenLibraryRef.current = false;
    }
  }, [openLibrary, isOpen, setPanelWidth]);

  // Auto-show case notes library when opening panel from case gallery
  useEffect(() => {
    // Reset flag when panel closes
    if (!isOpen) {
      hasAutoOpenedLibraryRef.current = false;
      return;
    }

    // Auto-open library only once when panel opens from case gallery
    if (isOpen && !currentCase && !showLibrary && !showBookmarkLibrary && !currentFilePath && !hasAutoOpenedLibraryRef.current) {
      // If we're in the case gallery (no currentCase) and panel just opened,
      // automatically show the library (which will show the case notes gallery)
      setShowLibrary(true);
      setPanelWidth(MIN_WIDTH);
      hasAutoOpenedLibraryRef.current = true;
    }
  }, [isOpen, currentCase, showLibrary, showBookmarkLibrary, currentFilePath, setPanelWidth]);

  useEffect(() => {
    setContextOpen(isOpen);
  }, [isOpen, setContextOpen]);

  // Listen for reattach data from detached window
  useEffect(() => {
    const handleReattach = (event: CustomEvent<{ content: string; filePath?: string | null; viewState?: 'editor' | 'library' | 'bookmarkLibrary'; casePath?: string | null }>) => {
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

      // If casePath is provided, dispatch event to navigate to case folder
      if (data.casePath) {
        // Dispatch event to open archive and navigate to case
        const navigateEvent = new CustomEvent('navigate-to-case-folder', {
          detail: { casePath: data.casePath }
        });
        window.dispatchEvent(navigateEvent);
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

      // Create detached window - pass case path if available
      await window.electronAPI.createWordEditorWindow({
        content,
        filePath: currentFilePath,
        viewState,
        casePath: currentCase?.path || null,
      } as Parameters<typeof window.electronAPI.createWordEditorWindow>[0]);

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
      let newFilePath: string;
      // If we have a current case, create case note; otherwise create global file
      if (currentCase?.path) {
        newFilePath = await window.electronAPI.createCaseNote(currentCase.path, fileName, '');
        toast.success('Note created');
      } else {
        newFilePath = await window.electronAPI.createTextFile(fileName, '');
        toast.success('New file created');
      }
      setCurrentFilePath(newFilePath);
      setShowLibrary(false);
      // Force a re-render by incrementing editorKey
      setEditorKey(prev => prev + 1);
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

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = panelWidth;

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: MouseEvent) => {
      const deltaX = resizeStartXRef.current - e.clientX; // Negative because panel is on right
      const newWidth = resizeStartWidthRef.current + deltaX;

      // Enforce min/max constraints
      const maxWidthPx = (window.innerWidth * MAX_WIDTH_PERCENT) / 100;
      const constrainedWidth = Math.max(MIN_WIDTH, Math.min(newWidth, maxWidthPx));

      setPanelWidth(constrainedWidth);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, setPanelWidth]);


  if (!isOpen) return null;

  const isInline = layoutMode === 'inline';

  // In inline mode, use regular div to avoid animation conflicts with divider resizing
  const PanelContainer = isInline ? 'div' : motion.div;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <PanelContainer
            {...(isInline ? {} : {
              initial: { x: '100%' },
              animate: { x: 0 },
              exit: { x: '100%' },
              transition: { type: 'spring', damping: 25, stiffness: 200 }
            })}
            className={`${
              isInline 
                ? 'h-full bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 backdrop-blur-xl border-l border-cyber-purple-400/30 flex flex-col'
                : 'fixed right-0 top-0 bottom-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 backdrop-blur-xl border-l border-cyber-purple-400/30 shadow-2xl z-50 flex flex-col'
            }`}
            style={isInline ? undefined : {
              width: panelWidth,
              transition: isResizing ? 'none' : 'width 0.2s ease-out'
            }}
          >
            {/* Enhanced Resize Handle - only show in overlay mode */}
            {!isInline && (
              <div
                onMouseDown={handleResizeStart}
                className="absolute left-0 top-0 bottom-0 cursor-col-resize z-10 group"
                style={{
                  cursor: isResizing ? 'col-resize' : 'col-resize',
                  marginLeft: '-2px',
                  paddingLeft: '2px',
                  paddingRight: '2px',
                  width: '5px'
                }}
              >
                {/* Enhanced Visual indicator */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-300 ${
                    isResizing
                      ? 'bg-gradient-to-b from-purple-600 via-purple-500 to-cyan-600 shadow-lg shadow-purple-500/50'
                      : 'bg-cyber-purple-500/0 group-hover:bg-gradient-to-b group-hover:from-purple-600/60 group-hover:via-purple-500/60 group-hover:to-cyan-600/60'
                  }`}
                />
              </div>
            )}
            {/* Enhanced Header */}
            <div className="relative p-4 sm:p-5 border-b border-cyber-purple-400/20 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl sm:rounded-2xl blur-xl opacity-50"></div>
                    <div className="relative p-2.5 sm:p-3 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl sm:rounded-2xl shadow-2xl">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                      Word Editor
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5 hidden sm:block">Create and edit documents</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Enhanced Detach button */}
                  <motion.button
                    onClick={handleDetach}
                    whileHover={{ scale: 1.1, y: -1 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative overflow-hidden group p-2 hover:bg-gray-800/80 rounded-xl transition-all"
                    aria-label="Detach editor to separate window"
                    title="Open in separate window"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10 transition-all duration-500"></div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Maximize2 size={18} className="relative z-10 text-gray-400 group-hover:text-cyber-purple-400 transition-colors" />
                    </div>
                  </motion.button>
                  {/* Enhanced Bookmark Library button */}
                  <motion.button
                    onClick={() => {
                      setShowBookmarkLibrary(!showBookmarkLibrary);
                      setShowLibrary(false);
                    }}
                    whileHover={{ scale: 1.1, y: -1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`relative overflow-hidden group p-2 rounded-xl transition-all ${
                      showBookmarkLibrary 
                        ? 'bg-cyber-purple-500/20 border border-cyber-purple-400/40' 
                        : 'hover:bg-gray-800/80'
                    }`}
                    aria-label="Open bookmark library"
                    title="Bookmark Library"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                      showBookmarkLibrary
                        ? 'from-purple-600/10 via-purple-600/5 to-cyan-600/10'
                        : 'from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/5 group-hover:via-purple-600/3 group-hover:to-cyan-600/5'
                    }`}></div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Bookmark size={18} className={`relative z-10 transition-colors ${showBookmarkLibrary ? 'text-cyber-purple-400' : 'text-gray-400 group-hover:text-cyber-purple-400'}`} />
                    </div>
                  </motion.button>
                  {/* Enhanced Library button */}
                  <motion.button
                    onClick={() => {
                      setShowLibrary(!showLibrary);
                      setShowBookmarkLibrary(false);
                      // Don't reset panel width - preserve user's manual resize
                    }}
                    whileHover={{ scale: 1.1, y: -1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`relative overflow-hidden group p-2 rounded-xl transition-all ${
                      showLibrary 
                        ? 'bg-cyber-purple-500/20 border border-cyber-purple-400/40' 
                        : 'hover:bg-gray-800/80'
                    }`}
                    aria-label="Open text library"
                    title="Text Library"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                      showLibrary
                        ? 'from-purple-600/10 via-purple-600/5 to-cyan-600/10'
                        : 'from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/5 group-hover:via-purple-600/3 group-hover:to-cyan-600/5'
                    }`}></div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Library size={18} className={`relative z-10 transition-colors ${showLibrary ? 'text-cyber-purple-400' : 'text-gray-400 group-hover:text-cyber-purple-400'}`} />
                    </div>
                  </motion.button>
                  {/* Enhanced Close button */}
                  <motion.button
                    onClick={() => {
                      if (editorRef.current?.hasUnsavedChanges()) {
                        setShowUnsavedDialog(true);
                        setPendingClose(true);
                      } else {
                        onClose();
                      }
                    }}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-gray-800/80 rounded-xl transition-colors text-gray-400 hover:text-white"
                    aria-label="Close editor"
                  >
                    <X size={20} />
                  </motion.button>
                </div>
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
          </PanelContainer>
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

