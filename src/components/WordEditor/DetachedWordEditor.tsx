import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Library, Minimize2, Bookmark, FileText } from 'lucide-react';
import { WordEditor, WordEditorHandle } from './WordEditor';
import { TextLibrary } from './TextLibrary';
import { BookmarkLibrary } from '../Bookmarks/BookmarkLibrary';
import { useToast } from '../Toast/ToastContext';
import { debugLog } from '../../utils/debugLogger';
import { WordEditorErrorBoundary } from './WordEditorErrorBoundary';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

export function DetachedWordEditor() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showBookmarkLibrary, setShowBookmarkLibrary] = useState(false);
  const [editorKey, setEditorKey] = useState(0); // Force re-render counter
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [isReattaching, setIsReattaching] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [casePath, setCasePath] = useState<string | null>(null); // Store case path from detach
  const editorRef = useRef<WordEditorHandle>(null);
  const toast = useToast();

  useEffect(() => {
    // The main process will send data via webContents.send
    // We'll use a custom event listener
    const handleData = (_event: CustomEvent<{ content: string; filePath?: string | null; viewState?: 'editor' | 'library' | 'bookmarkLibrary'; casePath?: string | null }>) => {
      const data = _event.detail;
      console.log('DetachedWordEditor: Received word-editor-data event', { viewState: data.viewState, filePath: data.filePath, casePath: data.casePath });

      // Set the content in the editor by updating the DOM directly
      // The WordEditor component will handle loading the file if filePath is set
      if (data.filePath) {
        setFilePath(data.filePath);
      }

      // Store case path if provided
      if (data.casePath) {
        setCasePath(data.casePath);
      } else {
        setCasePath(null);
      }

      // Restore view state - always set it explicitly to ensure correct state
      const viewState = data.viewState || 'editor';
      console.log('DetachedWordEditor: Setting view state to', viewState);

      if (viewState === 'bookmarkLibrary') {
        setShowBookmarkLibrary(true);
        setShowLibrary(false);
        console.log('DetachedWordEditor: Set showBookmarkLibrary=true, showLibrary=false');
        // Clear loading immediately for library views
        setIsInitializing(false);
      } else if (viewState === 'library') {
        setShowBookmarkLibrary(false);
        setShowLibrary(true);
        console.log('DetachedWordEditor: Set showBookmarkLibrary=false, showLibrary=true');
        // Clear loading immediately for library views
        setIsInitializing(false);
      } else {
        // 'editor' or default
        setShowBookmarkLibrary(false);
        setShowLibrary(false);
        console.log('DetachedWordEditor: Set showBookmarkLibrary=false, showLibrary=false (editor view)');
        // Mark initialization as complete after a short delay to allow the editor to render
        setTimeout(() => {
          setIsInitializing(false);
        }, 300);
      }
    };

    // Listen for custom event - also check if event was already dispatched
    window.addEventListener('word-editor-data' as any, handleData as EventListener);

    // Check if event data is already available (in case event fired before listener was attached)
    // This shouldn't happen due to the 500ms delay, but just in case
    const checkExistingData = () => {
      const existingData = (window as any).__wordEditorInitialData;
      if (existingData) {
        console.log('DetachedWordEditor: Found existing initial data', existingData);
        handleData({ detail: existingData } as CustomEvent);
        delete (window as any).__wordEditorInitialData;
      }
    };
    checkExistingData();

    return () => {
      window.removeEventListener('word-editor-data' as any, handleData as EventListener);
    };
  }, []);

  // Fallback: Clear initialization state after a timeout if no data is received
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing) {
        setIsInitializing(false);
      }
    }, 2000); // 2 second timeout

    return () => clearTimeout(timeout);
  }, [isInitializing]);

  // Debug: Log view state changes
  useEffect(() => {
    console.log('DetachedWordEditor: View state changed', { showBookmarkLibrary, showLibrary });
  }, [showBookmarkLibrary, showLibrary]);

  // Track showLibrary changes - ensure editor is ready immediately when library closes
  useEffect(() => {
    debugLog({
      location: 'DetachedWordEditor.tsx:showLibrary:useEffect',
      message: 'showLibrary state changed',
      data: { showLibrary, filePath, editorKey },
    });
    if (!showLibrary && editorRef.current) {
      // Library was closed, ensure editor is ready immediately
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          debugLog({
            location: 'DetachedWordEditor.tsx:showLibrary:useEffect',
            message: 'Editor focused after library close',
            data: { filePath },
          });
        }
      });
    }
  }, [showLibrary, filePath, editorKey]);

  const handleReattach = async () => {
    debugLog({
      location: 'DetachedWordEditor.tsx:handleReattach',
      message: 'Reattach button clicked',
      data: { isReattaching, filePath },
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
    });
    // Prevent multiple reattach attempts
    if (isReattaching) {
      return;
    }

    const hasChanges = editorRef.current?.hasUnsavedChanges();
    debugLog({
      location: 'DetachedWordEditor.tsx:handleReattach',
      message: 'hasUnsavedChanges check result',
      data: { hasChanges, filePath },
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
    });
    if (hasChanges) {
      debugLog({
        location: 'DetachedWordEditor.tsx:handleReattach',
        message: 'Showing unsaved dialog',
        data: { filePath },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      });
      setShowUnsavedDialog(true);
      setPendingClose(true);
      return;
    }

    setIsReattaching(true);
    await performReattach();
  };

  const performReattach = async () => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        setIsReattaching(false);
        return;
      }

      // Get current editor content via ref
      const content = editorRef.current?.getContent() || '';

      // Determine current view state
      let viewState: 'editor' | 'library' | 'bookmarkLibrary' = 'editor';
      if (showBookmarkLibrary) {
        viewState = 'bookmarkLibrary';
      } else if (showLibrary) {
        viewState = 'library';
      }

      // Send data back to main window and close this window
      if (window.electronAPI.reattachWordEditor) {
        await window.electronAPI.reattachWordEditor({
          content,
          filePath: filePath,
          viewState,
          casePath: casePath,
        });
        // The window will be closed by the main process
        // Reset the flag in case the window doesn't close immediately
        setTimeout(() => {
          setIsReattaching(false);
        }, 1000);
      } else {
        // Fallback: just close the window
        // The main window will need to handle reopening the panel
        if (window.electronAPI.closeWindow) {
          await window.electronAPI.closeWindow();
        }
        setIsReattaching(false);
      }
    } catch (error) {
      toast.error('Failed to reattach editor');
      console.error('Reattach error:', error);
      setIsReattaching(false);
    }
  };

  // Handle window close with unsaved changes check
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't show dialog if we're already reattaching
      if (isReattaching) {
        return;
      }
      if (editorRef.current?.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
        setShowUnsavedDialog(true);
        setPendingClose(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isReattaching]);

  const handleOpenFile = (filePath: string) => {
    debugLog({
      location: 'DetachedWordEditor.tsx:handleOpenFile',
      message: 'handleOpenFile called',
      data: { newFilePath: filePath, currentFilePath: filePath, showLibrary, currentEditorKey: editorKey },
    });
    // Force a re-render by incrementing editorKey, even if it's the same file
    // This ensures the file loads even if the user clicks the same file again
    setEditorKey(prev => prev + 1);
    setFilePath(filePath);
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
      setFilePath(newFilePath);
      setShowLibrary(false);
      // Force a re-render by incrementing editorKey
      setEditorKey(prev => prev + 1);
      // Ensure editor is cleared and ready immediately
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.setContent('');
          editorRef.current.focus();
        }
      });
      toast.success('New file created');
    } catch (error) {
      toast.error('Failed to create file');
      console.error('Create file error:', error);
    }
  };

  const handleFileDeleted = (deletedFilePath: string) => {
    // If the deleted file is the currently open file, clear it
    if (filePath === deletedFilePath) {
      setFilePath(null);
      // Force a complete re-render of the editor
      setEditorKey(prev => prev + 1);
      // Clear editor content immediately using requestAnimationFrame for faster response
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.setContent('');
          editorRef.current.focus();
        }
      });
      // Clear any localStorage drafts for this file
      const draftKey = `word-editor-draft-${deletedFilePath}`;
      localStorage.removeItem(draftKey);
      localStorage.removeItem('word-editor-draft-new');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 backdrop-blur-xl">
      <div className="h-screen flex flex-col">
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
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 hidden sm:block">Detached window</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Enhanced Reattach button */}
              <motion.button
                onClick={handleReattach}
                whileHover={{ scale: 1.1, y: -1 }}
                whileTap={{ scale: 0.9 }}
                className="relative overflow-hidden group p-2 hover:bg-gray-800/80 rounded-xl transition-all"
                aria-label="Reattach editor to main window"
                title="Return to main window"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10 transition-all duration-500"></div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Minimize2 size={18} className="relative z-10 text-gray-400 group-hover:text-cyber-purple-400 transition-colors" />
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
                  debugLog({
                    location: 'DetachedWordEditor.tsx:LibraryToggle',
                    message: 'Library toggle clicked',
                    data: { currentShowLibrary: showLibrary, filePath, editorKey },
                  });
                  setShowLibrary(!showLibrary);
                  setShowBookmarkLibrary(false);
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
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {/* Enhanced Loading overlay */}
          {isInitializing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center z-20"
            >
              <div className="text-center space-y-6">
                <div className="inline-flex p-6 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 rounded-2xl border-2 border-cyber-cyan-400/30">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan-400"></div>
                </div>
                <div>
                  <p className="text-gray-300 text-lg font-medium">Loading editor...</p>
                  <p className="text-gray-500 text-sm mt-1">Preparing your workspace</p>
                </div>
              </div>
            </motion.div>
          )}
          {showBookmarkLibrary ? (
            <BookmarkLibrary
              onClose={() => {
                setShowBookmarkLibrary(false);
                // Ensure editor is ready immediately when switching back from bookmark library
                requestAnimationFrame(() => {
                  if (editorRef.current) {
                    editorRef.current.focus();
                  }
                });
              }}
              isDetached={true}
            />
          ) : showLibrary ? (
            <TextLibrary
              onOpenFile={handleOpenFile}
              onNewFile={handleNewFile}
              onClose={() => {
                debugLog({
                  location: 'DetachedWordEditor.tsx:TextLibrary:onClose',
                  message: 'Library onClose called',
                  data: { filePath, editorKey },
                });
                setShowLibrary(false);
                // Ensure editor is ready immediately when switching back from library
                requestAnimationFrame(() => {
                  if (editorRef.current) {
                    editorRef.current.focus();
                    debugLog({
                      location: 'DetachedWordEditor.tsx:TextLibrary:onClose',
                      message: 'Editor focused after library close',
                      data: { filePath },
                    });
                  }
                });
              }}
              isDetached={true}
              onFileDeleted={handleFileDeleted}
              detachedCasePath={casePath}
            />
          ) : (
            <WordEditorErrorBoundary
              onReset={() => {
                setEditorKey(prev => prev + 1);
                setFilePath(null);
              }}
            >
              {(() => {
                debugLog({
                  location: 'DetachedWordEditor.tsx:render',
                  message: 'Rendering WordEditor',
                  data: { showLibrary, filePath, editorKey, key: `${filePath || 'new-file'}-${editorKey}` },
                });
                return null;
              })()}
              <WordEditor
                ref={editorRef}
                key={`${filePath || 'new-file'}-${editorKey}`} // Force re-render when file path changes or editor key changes
                filePath={filePath}
                onFilePathChange={setFilePath}
              />
            </WordEditorErrorBoundary>
          )}
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onSave={async () => {
          debugLog({
            location: 'DetachedWordEditor.tsx:onSave',
            message: 'Save clicked in unsaved dialog',
            data: { filePath, hasUnsavedChanges: editorRef.current?.hasUnsavedChanges() },
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'D',
          });
          // Save current file if it exists
          if (editorRef.current && window.electronAPI) {
            const textContent = editorRef.current.getTextContent();
            try {
              if (filePath) {
                // Save existing file
                await window.electronAPI.saveTextFile(filePath, textContent);
                toast.success('File saved');
                debugLog({
                  location: 'DetachedWordEditor.tsx:onSave',
                  message: 'File saved, calling markAsSaved',
                  data: { filePath },
                  sessionId: 'debug-session',
                  runId: 'run1',
                  hypothesisId: 'D',
                });
              } else {
                // For new files without a path, we can't save, so just discard changes
                // The content will be sent during reattach
                toast.info('New file will be reattached without saving');
              }
              // Mark editor as saved to prevent repeated prompts
              editorRef.current.markAsSaved();
              debugLog({
                location: 'DetachedWordEditor.tsx:onSave',
                message: 'After markAsSaved, checking state',
                data: { hasUnsavedChanges: editorRef.current?.hasUnsavedChanges(), filePath },
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'C',
              });
            } catch (error) {
              toast.error('Failed to save file');
              console.error('Save error:', error);
              return; // Don't proceed with reattach if save failed
            }
          }
          setShowUnsavedDialog(false);
          if (pendingClose) {
            setPendingClose(false);
            setIsReattaching(true);
            await performReattach();
          }
        }}
        onDiscard={() => {
          setShowUnsavedDialog(false);
          if (pendingClose) {
            setPendingClose(false);
            setIsReattaching(true);
            performReattach();
          }
        }}
        onCancel={() => {
          setShowUnsavedDialog(false);
          setPendingClose(false);
        }}
      />
    </div>
  );
}

