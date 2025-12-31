import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { WordEditorToolbar } from './WordEditorToolbar';
import { NewFileConfirmationDialog } from './NewFileConfirmationDialog';
import { NewFileNameDialog } from './NewFileNameDialog';
import { useToast } from '../Toast/ToastContext';
import { debugLog } from '../../utils/debugLogger';
import { useWordEditorState } from '../../hooks/useWordEditorState';
import { debounceWithFlush } from '../../utils/debounce';
import { LexicalEditor, LexicalEditorHandle } from './LexicalEditor';
import { useEditorShortcuts } from '../../hooks/useEditorShortcuts';
import { calculateTextStats } from '../../utils/textStats';
import { Save, FilePlus, ChevronDown } from 'lucide-react';

export interface WordEditorHandle {
  getContent: () => string;
  setContent: (html: string) => void;
  getTextContent: () => string;
  focus: () => void;
  hasUnsavedChanges: () => boolean;
  markAsSaved: () => void;
}

interface WordEditorProps {
  filePath: string | null;
  onFilePathChange: (path: string | null) => void;
}

export const WordEditor = forwardRef<WordEditorHandle, WordEditorProps>(
  ({ filePath, onFilePathChange }, ref) => {
  const {
    content,
    setContent,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    fontSize,
    setFontSize,
    textAlign,
    setTextAlign,
    showNewFileDialog,
    setShowNewFileDialog,
    showFileNameDialog,
    setShowFileNameDialog,
    isLoading,
    setIsLoading,
    isSaving,
    setIsSaving,
  } = useWordEditorState();
  const lexicalEditorRef = useRef<LexicalEditorHandle>(null);
  const currentFilePathRef = useRef<string | null>(null); // Start as null to ensure first load happens
  const toast = useToast();
  const [wordCount, setWordCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showSaveAsMenu, setShowSaveAsMenu] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);
  const saveAsMenuRef = useRef<HTMLDivElement>(null);
  
  // Debounced localStorage save function
  const debouncedSaveDraft = useRef(
    debounceWithFlush((...args: unknown[]) => {
      const [draftKey, draftContent] = args as [string, string];
      try {
        localStorage.setItem(draftKey, draftContent);
      } catch (error) {
        // Silently fail if localStorage is full or unavailable
        console.warn('Failed to save draft to localStorage:', error);
      }
    }, 500)
  ).current;
  
  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    getContent: () => {
      return lexicalEditorRef.current?.getContent() || '';
    },
    setContent: (html: string) => {
      lexicalEditorRef.current?.setContent(html);
    },
    getTextContent: () => {
      return lexicalEditorRef.current?.getTextContent() || '';
    },
    focus: () => {
      lexicalEditorRef.current?.focus();
    },
    hasUnsavedChanges: () => {
      debugLog({
        location: 'WordEditor.tsx:hasUnsavedChanges',
        message: 'hasUnsavedChanges called',
        data: { hasUnsavedChanges, filePath },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      });
      return hasUnsavedChanges;
    },
    markAsSaved: () => {
      debugLog({
        location: 'WordEditor.tsx:markAsSaved',
        message: 'markAsSaved called',
        data: { previousState: hasUnsavedChanges, filePath },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      });
      // Use setTimeout to ensure this happens after any pending content change callbacks
      setTimeout(() => {
        setHasUnsavedChanges(false);
      }, 0);
    },
  }), [hasUnsavedChanges]);

  // Ensure editor is editable and focusable
  const ensureEditorEditable = () => {
    if (lexicalEditorRef.current) {
      lexicalEditorRef.current.focus();
      debugLog({
        location: 'WordEditor.tsx:ensureEditorEditable',
        message: 'ensureEditorEditable called',
        data: { filePath, isEditable: lexicalEditorRef.current.isEditable() },
      });
    }
  };

  useEffect(() => {
    debugLog({
      location: 'WordEditor.tsx:useEffect',
      message: 'WordEditor mounted',
      data: { filePath, editorRefExists: !!lexicalEditorRef.current },
    });
    // Ensure editor is editable on mount, especially when filePath is null
    ensureEditorEditable();
    
    // Add window focus handler to ensure editor is editable when window regains focus
    const handleWindowFocus = () => {
      debugLog({
        location: 'WordEditor.tsx:handleWindowFocus',
        message: 'Window focus event',
        data: { filePath, editorRefExists: !!lexicalEditorRef.current },
      });
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        ensureEditorEditable();
        if (lexicalEditorRef.current && !filePath) {
          // If no file is open, focus the editor
          lexicalEditorRef.current.focus();
          debugLog({
            location: 'WordEditor.tsx:handleWindowFocus',
            message: 'Editor focused on window focus',
            data: { filePath },
          });
        }
      });
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      debugLog({
        location: 'WordEditor.tsx:useEffect:cleanup',
        message: 'WordEditor unmounted',
        data: { filePath },
      });
    };
  }, [filePath]);

  // Listen for detached window data
  useEffect(() => {
    const handleData = (event: CustomEvent<{ content: string; filePath?: string | null }>) => {
      const data = event.detail;
      if (data.content && lexicalEditorRef.current) {
        lexicalEditorRef.current.setContent(data.content);
        setContent(data.content);
        setHasUnsavedChanges(false);
      }
      if (data.filePath) {
        onFilePathChange(data.filePath);
      }
    };

    window.addEventListener('word-editor-data' as any, handleData as EventListener);
    return () => {
      window.removeEventListener('word-editor-data' as any, handleData as EventListener);
    };
  }, [onFilePathChange, setContent, setHasUnsavedChanges]);

  // Load file content when filePath changes
  useEffect(() => {
    const loadFile = async () => {
      debugLog({
        location: 'WordEditor.tsx:loadFile',
        message: 'loadFile useEffect triggered',
        data: { filePath, hasElectronAPI: !!window.electronAPI, previousFilePath: currentFilePathRef.current },
      });
      if (!filePath || !window.electronAPI) {
        debugLog({
          location: 'WordEditor.tsx:loadFile',
          message: 'loadFile early return',
          data: { filePath, hasElectronAPI: !!window.electronAPI },
        });
        setIsLoading(false);
        return;
      }

      // Skip if this is the same file path AND we've already loaded it (avoid unnecessary reloads)
      // But allow loading if currentFilePathRef is null (first load) or different
      if (filePath === currentFilePathRef.current && currentFilePathRef.current !== null) {
        debugLog({
          location: 'WordEditor.tsx:loadFile',
          message: 'Skipping load - same file path already loaded',
          data: { filePath },
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      // Set isSaving to true temporarily to prevent content change callbacks from setting unsaved changes
      setIsSaving(true);
      try {
        debugLog({
          location: 'WordEditor.tsx:loadFile',
          message: 'About to read file',
          data: { filePath },
        });
        const fileContent = await window.electronAPI.readTextFile(filePath);
        debugLog({
          location: 'WordEditor.tsx:loadFile',
          message: 'File content read',
          data: { filePath, fileContentLength: fileContent.length, contentPreview: fileContent.substring(0, 50) },
        });
        
        // For plain text files, wrap in paragraph tags; for HTML, use as-is
        let htmlContent: string;
        if (filePath.endsWith('.txt')) {
          htmlContent = `<p>${fileContent.replace(/\n/g, '</p><p>')}</p>`;
        } else {
          htmlContent = fileContent;
        }
        
        // Update the ref BEFORE loading to prevent duplicate loads
        currentFilePathRef.current = filePath;
        
        // Update state first so InitialContentPlugin can see the new content
        setContent(htmlContent);
        
        // Set content in editor directly via ref (this is the primary method)
        if (lexicalEditorRef.current) {
          debugLog({
            location: 'WordEditor.tsx:loadFile',
            message: 'Setting editor content via ref',
            data: { filePath, isTxt: filePath.endsWith('.txt'), fileContentLength: fileContent.length },
          });
          lexicalEditorRef.current.setContent(htmlContent);
        }
        
        // Update state and flags after a small delay to ensure editor has processed the content
        setTimeout(() => {
          setHasUnsavedChanges(false);
          setIsSaving(false);
          debugLog({
            location: 'WordEditor.tsx:loadFile',
            message: 'Editor content set and state updated',
            data: { filePath, contentLength: htmlContent.length },
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'A',
          });
        }, 50);
      } catch (error) {
        setIsSaving(false);
        // Check if file doesn't exist (was deleted)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
          // File was deleted, clear the file path and start new file
          toast.info('File was deleted, starting new document');
          onFilePathChange(null);
          if (lexicalEditorRef.current) {
            lexicalEditorRef.current.setContent('');
          }
          setContent('');
          setHasUnsavedChanges(false);
        } else {
          toast.error('Failed to load file');
          console.error('Load file error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [filePath, toast, onFilePathChange, setIsLoading]);

  // Auto-save draft to localStorage (debounced)
  useEffect(() => {
    if (content && hasUnsavedChanges) {
      const draftKey = `word-editor-draft-${filePath || 'new'}`;
      debouncedSaveDraft(draftKey, content);
    }
  }, [content, hasUnsavedChanges, filePath, debouncedSaveDraft]);

  // Calculate word and sentence counts when content changes
  useEffect(() => {
    const updateCounts = () => {
      const textContent = lexicalEditorRef.current?.getTextContent() || '';
      const stats = calculateTextStats(textContent);
      setWordCount(stats.wordCount);
      setSentenceCount(stats.sentenceCount);
    };

    // Debounce the count calculation to avoid recalculating on every keystroke
    const debouncedUpdate = debounceWithFlush(updateCounts, 300);
    debouncedUpdate();

    return () => {
      debouncedUpdate.flush();
    };
  }, [content]);

  // Close save menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(event.target as Node)) {
        setShowSaveMenu(false);
      }
      if (saveAsMenuRef.current && !saveAsMenuRef.current.contains(event.target as Node)) {
        setShowSaveAsMenu(false);
      }
    };

    if (showSaveMenu || showSaveAsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSaveMenu, showSaveAsMenu]);

  // Flush debounced save on unmount to ensure draft is saved
  useEffect(() => {
    return () => {
      debouncedSaveDraft.flush();
    };
  }, [debouncedSaveDraft]);

  // Clear editor when filePath becomes null (file deleted or new file)
  // BUT: Only clear if filePath actually CHANGED to null (not if it was already null)
  useEffect(() => {
    debugLog({
      location: 'WordEditor.tsx:filePath:useEffect',
      message: 'filePath useEffect triggered',
      data: { filePath, previousFilePath: currentFilePathRef.current, editorRefExists: !!lexicalEditorRef.current },
    });
    
    // Only clear if filePath changed FROM something TO null (deliberate clear action)
    // Don't clear if filePath was already null (user might be typing in a new document)
    const previousPath = currentFilePathRef.current;
    const pathChangedToNull = previousPath !== null && filePath === null;
    
    // Also ensure editor is editable when filePath is null (even if it was already null)
    // This handles the case where the component mounts with filePath=null after deletion
    if (filePath === null && lexicalEditorRef.current) {
      // Ensure editor is always editable when filePath is null
      ensureEditorEditable();
      
      // Focus the editor after a short delay to ensure React has finished rendering
      requestAnimationFrame(() => {
        if (lexicalEditorRef.current) {
          lexicalEditorRef.current.focus();
          debugLog({
            location: 'WordEditor.tsx:filePath:useEffect',
            message: 'Editor focused after filePath became null',
            data: { isEditable: lexicalEditorRef.current.isEditable() },
          });
        }
      });
      
      debugLog({
        location: 'WordEditor.tsx:filePath:useEffect',
        message: 'Ensuring editor is editable (filePath is null)',
        data: { isEditable: lexicalEditorRef.current.isEditable() },
      });
    }
    
    if (pathChangedToNull && lexicalEditorRef.current) {
      debugLog({
        location: 'WordEditor.tsx:filePath:useEffect',
        message: 'About to clear editor - path changed to null',
        data: { previousFilePath: previousPath, newFilePath: filePath },
      });
      // Clear editor content
      lexicalEditorRef.current.setContent('');
      setContent('');
      setHasUnsavedChanges(false);
      
      // Clear any drafts from localStorage
      localStorage.removeItem('word-editor-draft-new');
      if (previousPath) {
        const oldDraftKey = `word-editor-draft-${previousPath}`;
        localStorage.removeItem(oldDraftKey);
      }
      
      debugLog({
        location: 'WordEditor.tsx:filePath:useEffect',
        message: 'Editor cleared',
      });
      
      // Use requestAnimationFrame for immediate focus (faster than setTimeout)
      requestAnimationFrame(() => {
        if (lexicalEditorRef.current) {
          debugLog({
            location: 'WordEditor.tsx:filePath:useEffect',
            message: 'Focusing editor in requestAnimationFrame',
            data: { editorRefExists: !!lexicalEditorRef.current },
          });
          lexicalEditorRef.current.focus();
        }
      });
    }
    
    // Update current file path ref AFTER checking for changes
    // Only update if it's actually changing (not on every render)
    if (currentFilePathRef.current !== filePath) {
      currentFilePathRef.current = filePath;
    }
  }, [filePath]);

  const handleContentChange = (newContent: string) => {
    debugLog({
      location: 'WordEditor.tsx:handleContentChange',
      message: 'handleContentChange called',
      data: { 
        contentLength: newContent.length, 
        filePath,
        previousHasUnsavedChanges: hasUnsavedChanges,
        isSaving,
        currentContentLength: content.length,
      },
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'E',
    });
    
    // Only update if content actually changed (avoid unnecessary updates)
    if (newContent !== content) {
      setContent(newContent);
      // Only set unsaved changes if we're not currently saving
      // This prevents the flag from being set back to true after a save operation
      if (!isSaving) {
        setHasUnsavedChanges(true);
      }
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    // Font size is applied via LexicalEditor props, so content change will be triggered automatically
    setHasUnsavedChanges(true);
  };

  const handleAlignmentChange = (align: 'left' | 'center' | 'right' | 'justify') => {
    setTextAlign(align);
    // Alignment is applied via LexicalEditor props, so content change will be triggered automatically
    setHasUnsavedChanges(true);
  };

  const handleToggleBold = () => {
    if (lexicalEditorRef.current) {
      lexicalEditorRef.current.toggleBold();
      setHasUnsavedChanges(true);
    }
  };

  const handleToggleItalic = () => {
    if (lexicalEditorRef.current) {
      lexicalEditorRef.current.toggleItalic();
      setHasUnsavedChanges(true);
    }
  };

  const handleToggleUnderline = () => {
    if (lexicalEditorRef.current) {
      lexicalEditorRef.current.toggleUnderline();
      setHasUnsavedChanges(true);
    }
  };

  const handleUndo = () => {
    if (lexicalEditorRef.current) {
      lexicalEditorRef.current.undo();
      // Note: hasUnsavedChanges will be updated via onFormatChange callback
      // from the Lexical editor when content actually changes
    }
  };

  const handleRedo = () => {
    if (lexicalEditorRef.current) {
      lexicalEditorRef.current.redo();
      // Note: hasUnsavedChanges will be updated via onFormatChange callback
      // from the Lexical editor when content actually changes
    }
  };

  const handleSave = async (format: 'txt' | 'pdf' | 'docx' | 'rtf') => {
    if (!window.electronAPI) {
      toast.error('Electron API not available');
      return;
    }

    setIsSaving(true);
    try {
      // Get current content from editor
      const htmlContent = lexicalEditorRef.current?.getContent() || content;
      const textContent = lexicalEditorRef.current?.getTextContent() || '';
      
      if (format === 'txt') {
        // Save as plain text
        if (filePath) {
          await window.electronAPI.saveTextFile(filePath, textContent);
        } else {
          // Prompt for filename or use default
          const fileName = `Untitled_${Date.now()}.txt`;
          const newPath = await window.electronAPI.createTextFile(fileName, textContent);
          onFilePathChange(newPath);
        }
        
        debugLog({
          location: 'WordEditor.tsx:handleSave',
          message: 'Setting hasUnsavedChanges to false after save',
          data: { format, filePath, previousState: hasUnsavedChanges },
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B',
        });
        
        // Use setTimeout to ensure this happens after any pending content change callbacks
        setTimeout(() => {
          setHasUnsavedChanges(false);
        }, 0);
        
        toast.success('File saved as TXT');
        
        // Restore focus to editor after save to prevent cursor from moving
        // Use requestAnimationFrame to ensure this happens after React updates
        requestAnimationFrame(() => {
          if (lexicalEditorRef.current) {
            lexicalEditorRef.current.focus();
          }
        });
      } else {
        // Export to other formats (PDF, DOCX, RTF)
        const result = await window.electronAPI.exportTextFile({
          content: htmlContent,
          format,
          filePath: filePath || undefined,
        });
        
        if (result.success) {
          // Use setTimeout to ensure this happens after any pending content change callbacks
          setTimeout(() => {
            setHasUnsavedChanges(false);
          }, 0);
          if (result.filePath && format !== 'pdf' && format !== 'docx') {
            // For RTF, update the file path
            onFilePathChange(result.filePath);
          }
          toast.success(`File exported as ${format.toUpperCase()}`);
        } else {
          toast.error(`Failed to export as ${format.toUpperCase()}`);
        }
      }
    } catch (error) {
      toast.error('Failed to save file');
      console.error('Save error:', error);
    } finally {
      // Delay clearing isSaving to ensure hasUnsavedChanges is set first
      setTimeout(() => {
        setIsSaving(false);
      }, 50);
      
      // Restore focus to editor after save completes to prevent cursor from moving to start
      // This ensures the cursor stays in place even if the save button click caused focus loss
      requestAnimationFrame(() => {
        if (lexicalEditorRef.current) {
          lexicalEditorRef.current.focus();
        }
      });
    }
  };

  const handleNewFile = () => {
    // Check if there are unsaved changes
    if (hasUnsavedChanges) {
      setShowNewFileDialog(true);
    } else {
      // No unsaved changes, show file name dialog
      setShowFileNameDialog(true);
    }
  };


  const handleSaveAndNewFile = async () => {
    // Save current file first, then show file name dialog
    await handleSave('txt');
    // Show file name dialog after save completes
    setShowFileNameDialog(true);
  };

  const handleDiscardAndNewFile = () => {
    // Just show file name dialog without saving
    setShowFileNameDialog(true);
  };

  const handleCreateNewFile = async (fileName: string) => {
    if (!window.electronAPI) {
      toast.error('Electron API not available');
      return;
    }

    try {
      // Create empty file with the provided name
      const newFilePath = await window.electronAPI.createTextFile(fileName, '');
      // Clear editor content but set new file path
      if (lexicalEditorRef.current) {
        lexicalEditorRef.current.setContent('');
      }
      setContent('');
      setHasUnsavedChanges(false);
      
      // Clear any drafts from localStorage for old file
      if (filePath) {
        const draftKey = `word-editor-draft-${filePath}`;
        localStorage.removeItem(draftKey);
      }
      localStorage.removeItem('word-editor-draft-new');
      
      // Set new file path (this will trigger file load, but since it's empty, editor stays clear)
      onFilePathChange(newFilePath);
      toast.success('New file created');
    } catch (error) {
      toast.error('Failed to create new file');
      console.error('Create new file error:', error);
    }
  };

  // Keyboard shortcuts - must be after all handler functions are defined
  useEditorShortcuts({
    onSave: () => handleSave('txt'),
    onNewFile: handleNewFile,
    onToggleBold: handleToggleBold,
    onToggleItalic: handleToggleItalic,
    onToggleUnderline: handleToggleUnderline,
    onUndo: handleUndo,
    onRedo: handleRedo,
    enabled: true,
    editorRef: lexicalEditorRef,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <WordEditorToolbar
        fontSize={fontSize}
        textAlign={textAlign}
        onFontSizeChange={handleFontSizeChange}
        onAlignmentChange={handleAlignmentChange}
        onToggleBold={handleToggleBold}
        onToggleItalic={handleToggleItalic}
        onToggleUnderline={handleToggleUnderline}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Editor */}
      <div className="flex-1 overflow-auto p-4 relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading file...</p>
            </div>
          </div>
        )}
        <LexicalEditor
          ref={lexicalEditorRef}
          initialContent={content}
          fontSize={fontSize}
          textAlign={textAlign}
          onContentChange={handleContentChange}
          onFormatChange={() => setHasUnsavedChanges(true)}
          className="relative"
          placeholder="Start typing..."
        />
      </div>

      {/* Status bar */}
      <div className="px-3 py-2 border-t border-gray-700/50 flex items-center justify-between gap-3 overflow-hidden">
        {/* Left side: Status text and statistics */}
        <div className="flex items-center gap-1.5 text-xs flex-nowrap min-w-0 flex-shrink">
          {hasUnsavedChanges && (
            <>
              <span className="text-yellow-400 whitespace-nowrap">Unsaved changes</span>
              <span className="text-gray-600 text-[10px]">•</span>
            </>
          )}
          <span className="text-gray-400 whitespace-nowrap">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          <span className="text-gray-600 text-[10px]">•</span>
          <span className="text-gray-400 whitespace-nowrap">
            {sentenceCount} {sentenceCount === 1 ? 'sentence' : 'sentences'}
          </span>
        </div>

        {/* Right side: Action buttons and saving indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* New File Button */}
          <button
            onClick={handleNewFile}
            className="px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs"
            title="New File"
          >
            <FilePlus size={14} />
            <span>New</span>
          </button>

          {/* Save Button */}
          <button
            onClick={() => {
              debugLog({
                location: 'WordEditor.tsx:SaveButton',
                message: 'Save button clicked in status bar',
                data: { hasUnsavedChanges, filePath },
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B',
              });
              handleSave('txt');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs ${
              hasUnsavedChanges
                ? 'bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title="Save current file"
          >
            <Save size={14} />
            <span>Save</span>
          </button>

          {/* Save As Button with Dropdown */}
          <div className="relative" ref={saveAsMenuRef}>
            <button
              onClick={() => {
                setShowSaveAsMenu(!showSaveAsMenu);
              }}
              className="px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs whitespace-nowrap"
              title="Save as different format"
            >
              <span>Save As</span>
              <ChevronDown size={14} />
            </button>

            {/* Save As Menu Dropdown - expands upward */}
            {showSaveAsMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <button
                  onClick={async () => {
                    setShowSaveAsMenu(false);
                    // Save As TXT - create new file
                    if (window.electronAPI && lexicalEditorRef.current) {
                      setIsSaving(true);
                      try {
                        const textContent = lexicalEditorRef.current.getTextContent();
                        const baseName = filePath 
                          ? filePath.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'Untitled'
                          : 'Untitled';
                        const fileName = `${baseName}_${Date.now()}.txt`;
                        await window.electronAPI.createTextFile(fileName, textContent);
                        toast.success('File saved as TXT');
                      } catch (error) {
                        toast.error('Failed to save file');
                        console.error('Save error:', error);
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Save as TXT
                </button>
                <button
                  onClick={async () => {
                    setShowSaveAsMenu(false);
                    // Save As PDF - create new file
                    if (window.electronAPI && lexicalEditorRef.current) {
                      setIsSaving(true);
                      try {
                        const htmlContent = lexicalEditorRef.current.getContent();
                        const result = await window.electronAPI.exportTextFile({
                          content: htmlContent,
                          format: 'pdf',
                          filePath: filePath || undefined,
                        });
                        if (result.success) {
                          toast.success('File exported as PDF');
                        } else {
                          toast.error('Failed to export as PDF');
                        }
                      } catch (error) {
                        toast.error('Failed to export as PDF');
                        console.error('Export error:', error);
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Export as PDF
                </button>
                <button
                  onClick={async () => {
                    setShowSaveAsMenu(false);
                    // Save As DOCX - create new file
                    if (window.electronAPI && lexicalEditorRef.current) {
                      setIsSaving(true);
                      try {
                        const htmlContent = lexicalEditorRef.current.getContent();
                        const result = await window.electronAPI.exportTextFile({
                          content: htmlContent,
                          format: 'docx',
                          filePath: filePath || undefined,
                        });
                        if (result.success) {
                          toast.success('File exported as DOCX');
                        } else {
                          toast.error('Failed to export as DOCX');
                        }
                      } catch (error) {
                        toast.error('Failed to export as DOCX');
                        console.error('Export error:', error);
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Export as DOCX
                </button>
                <button
                  onClick={async () => {
                    setShowSaveAsMenu(false);
                    // Save As RTF - create new file
                    if (window.electronAPI && lexicalEditorRef.current) {
                      setIsSaving(true);
                      try {
                        const htmlContent = lexicalEditorRef.current.getContent();
                        const result = await window.electronAPI.exportTextFile({
                          content: htmlContent,
                          format: 'rtf',
                          filePath: filePath || undefined,
                        });
                        if (result.success) {
                          toast.success('File exported as RTF');
                        } else {
                          toast.error('Failed to export as RTF');
                        }
                      } catch (error) {
                        toast.error('Failed to export as RTF');
                        console.error('Export error:', error);
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Export as RTF
                </button>
              </div>
            )}
          </div>

          {/* Saving indicator */}
          {isSaving && (
            <div className="flex items-center gap-2 text-cyber-purple-400 text-xs">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyber-purple-400"></div>
              <span>Saving...</span>
            </div>
          )}
        </div>
      </div>

      {/* New File Confirmation Dialog */}
      <NewFileConfirmationDialog
        isOpen={showNewFileDialog}
        onClose={() => setShowNewFileDialog(false)}
        onSave={handleSaveAndNewFile}
        onDiscard={handleDiscardAndNewFile}
      />

      {/* New File Name Dialog */}
      <NewFileNameDialog
        isOpen={showFileNameDialog}
        onClose={() => setShowFileNameDialog(false)}
        onConfirm={(fileName) => {
          setShowFileNameDialog(false);
          handleCreateNewFile(fileName);
        }}
      />
    </div>
  );
});

WordEditor.displayName = 'WordEditor';

