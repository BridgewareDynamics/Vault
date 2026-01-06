import { useState, useEffect, useRef } from 'react';
import { Library, Minimize2, Bookmark } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-900/95 backdrop-blur-lg">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700/50 bg-gray-900/95 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              Word Editor
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Reattach button */}
            <button
              onClick={handleReattach}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Reattach editor to main window"
              title="Return to main window"
            >
              <Minimize2 size={18} className="text-cyber-purple-400" />
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
                debugLog({
                  location: 'DetachedWordEditor.tsx:LibraryToggle',
                  message: 'Library toggle clicked',
                  data: { currentShowLibrary: showLibrary, filePath, editorKey },
                });
                setShowLibrary(!showLibrary);
                setShowBookmarkLibrary(false);
              }}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Open text library"
              title="Text Library"
            >
              <Library size={18} className={showLibrary ? 'text-cyber-purple-400' : 'text-gray-400'} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {/* Loading overlay */}
          {isInitializing && (
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading editor...</p>
              </div>
            </div>
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

