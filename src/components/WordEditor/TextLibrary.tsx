import { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, Plus, ArrowLeft, FolderOpen } from 'lucide-react';
import { TextLibraryItem } from './TextLibraryItem';
import { useToast } from '../Toast/ToastContext';
import { NewFileNameDialog } from './NewFileNameDialog';
import { DeleteTextFileConfirmDialog } from './DeleteTextFileConfirmDialog';
import { useArchiveContext } from '../../contexts/ArchiveContext';
import { CaseNotesGallery } from './CaseNotesGallery';

// Hook to detect container width for responsive design
function useContainerWidth(ref: React.RefObject<HTMLDivElement>) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0); // Track current width to avoid stale closure
  const updateWidthRef = useRef<(() => void) | null>(null); // Expose updateWidth function

  useEffect(() => {
    // #region agent log
    if (window.electronAPI?.debugLog) {
      window.electronAPI.debugLog({location:'TextLibrary.tsx:useContainerWidth:effect',message:'useContainerWidth effect running',data:{hasRef:!!ref.current,currentWidth:width},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}).catch(()=>{});
    }
    // #endregion
    if (!ref.current) {
      // #region agent log
      if (window.electronAPI?.debugLog) {
        window.electronAPI.debugLog({location:'TextLibrary.tsx:useContainerWidth:noRef',message:'Container ref not available',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'}).catch(()=>{});
      }
      // #endregion
      setWidth(0);
      widthRef.current = 0;
      updateWidthRef.current = null;
      return;
    }

    // Get initial width immediately using getBoundingClientRect
    const updateWidth = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const newWidth = rect.width;
        // #region agent log
        if (window.electronAPI?.debugLog) {
          window.electronAPI.debugLog({location:'TextLibrary.tsx:useContainerWidth:updateWidth',message:'updateWidth called',data:{newWidth,oldWidth:widthRef.current,rectWidth:rect.width,rectLeft:rect.left},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}).catch(()=>{});
        }
        // #endregion
        if (newWidth > 0) {
          setWidth(newWidth);
          widthRef.current = newWidth;
        }
      }
    };

    // Store updateWidth function so it can be called from outside
    updateWidthRef.current = updateWidth;

    // Initial measurement
    updateWidth();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        // #region agent log
        if (window.electronAPI?.debugLog) {
          window.electronAPI.debugLog({location:'TextLibrary.tsx:useContainerWidth:resizeObserver',message:'ResizeObserver fired',data:{newWidth,oldWidth:widthRef.current,contentRectWidth:entry.contentRect.width},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'}).catch(()=>{});
        }
        // #endregion
        if (newWidth > 0) {
          setWidth(newWidth);
          widthRef.current = newWidth;
        }
      }
    });

    resizeObserver.observe(ref.current);
    
    // Also check width after delays to catch any layout changes
    // This is important when panel opens and DOM might not be fully laid out
    const timeoutId1 = setTimeout(updateWidth, 0); // Next tick
    const timeoutId2 = setTimeout(updateWidth, 50); // After brief delay
    const timeoutId3 = setTimeout(updateWidth, 200); // After potential animations

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      updateWidthRef.current = null;
    };
  }, [ref]); // Only depend on ref, not width - prevents effect from re-running when width changes

  return { width, updateWidth: updateWidthRef.current };
}

interface TextFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  preview?: string;
}

interface TextLibraryProps {
  onOpenFile: (filePath: string) => void;
  onNewFile: (fileName: string) => void;
  onClose: () => void;
  isDetached?: boolean;
  onFileDeleted?: (filePath: string) => void;
  detachedCasePath?: string | null; // Case path passed from detached window
}

export function TextLibrary({ onOpenFile, onNewFile, onClose, isDetached = false, onFileDeleted, detachedCasePath }: TextLibraryProps) {
  // #region agent log
  useEffect(() => {
    if (window.electronAPI?.debugLog) {
      window.electronAPI.debugLog({location:'TextLibrary.tsx:mount',message:'TextLibrary component mounted',data:{isDetached},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}).catch(()=>{});
    }
    return () => {
      if (window.electronAPI?.debugLog) {
        window.electronAPI.debugLog({location:'TextLibrary.tsx:unmount',message:'TextLibrary component unmounted',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}).catch(()=>{});
      }
    };
  }, [isDetached]);
  // #endregion
  
  const [files, setFiles] = useState<TextFile[]>([]);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ path: string; name: string } | null>(null);
  const [selectedCaseForNotes, setSelectedCaseForNotes] = useState<{ path: string; name: string } | null>(null);
  const toast = useToast();
  
  // Get current case context - returns null if not available
  const { currentCase } = useArchiveContext();
  
  // Initialize loading state - will be updated based on whether we should show gallery
  // Start with true, will be set to false if we should show gallery
  const [loading, setLoading] = useState(true);
  // Initialize showGallery based on context - if we're in case gallery, show gallery by default
  const [showGallery, setShowGallery] = useState(() => {
    // If we're not in a case and no detached case path, we should show the gallery
    // This will be refined once context stabilizes
    return false; // Start false, will be set by shouldShowGallery logic
  });
  
  // Track if we've given ArchiveContext time to stabilize after mount
  // This prevents showing gallery when currentCase is temporarily null during initial render
  const [contextStabilized, setContextStabilized] = useState(false);
  const hasCheckedContextRef = useRef(false);
  
  // Container ref for responsive design
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth, updateWidth: updateContainerWidth } = useContainerWidth(containerRef);
  
  // Determine layout mode based on container width
  // Use list view when container is narrow (< 600px), card view otherwise
  // Wait for a valid width measurement before deciding layout
  const useListView = useMemo(() => {
    // #region agent log
    if (window.electronAPI?.debugLog) {
      window.electronAPI.debugLog({location:'TextLibrary.tsx:useListView:calculation',message:'Calculating useListView',data:{containerWidth,isDetached,shouldBeList:containerWidth > 0 && containerWidth < 600 && !isDetached},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}).catch(()=>{});
    }
    // #endregion
    // If width is 0, we haven't measured yet - default to list view for compact mode
    // This ensures we show compact view immediately when panel opens with library
    if (containerWidth === 0) return true;
    const result = containerWidth < 600 && !isDetached;
    // #region agent log
    if (window.electronAPI?.debugLog) {
      window.electronAPI.debugLog({location:'TextLibrary.tsx:useListView:result',message:'useListView result',data:{result,containerWidth,threshold:600},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}).catch(()=>{});
    }
    // #endregion
    return result;
  }, [containerWidth, isDetached]);
  
  const layoutMode = useListView ? 'list' : 'card';
  
  // #region agent log
  useEffect(() => {
    if (window.electronAPI?.debugLog) {
      window.electronAPI.debugLog({location:'TextLibrary.tsx:layoutMode:change',message:'Layout mode changed',data:{layoutMode,useListView,containerWidth,hasRef:!!containerRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}).catch(()=>{});
    }
  }, [layoutMode, useListView, containerWidth]);
  
  // Log render state for debugging
  useEffect(() => {
    if (window.electronAPI?.debugLog) {
      window.electronAPI.debugLog({location:'TextLibrary.tsx:render',message:'TextLibrary rendered',data:{containerWidth,useListView,layoutMode,hasRef:!!containerRef.current,isDetached},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}).catch(()=>{});
    }
  }, [containerWidth, useListView, layoutMode, isDetached]);
  // #endregion
  
  // Force a re-check of width when component becomes visible (panel opens)
  // This ensures proper layout detection when panel reopens
  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current) {
        const currentWidth = containerRef.current.getBoundingClientRect().width;
        const widthDiff = Math.abs(currentWidth - containerWidth);
        // #region agent log
        if (window.electronAPI?.debugLog) {
          window.electronAPI.debugLog({location:'TextLibrary.tsx:checkWidth',message:'checkWidth called',data:{currentWidth,containerWidth,widthDiff,needsUpdate:currentWidth > 0 && widthDiff > 1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}).catch(()=>{});
        }
        // #endregion
        // If we have a valid width but our state doesn't match, force update
        if (currentWidth > 0 && widthDiff > 1) {
          // Directly update the width if updateWidth function is available
          if (updateContainerWidth) {
            updateContainerWidth();
          } else {
            // Fallback: force a reflow to trigger ResizeObserver
            containerRef.current.offsetHeight; // Force reflow
          }
        }
      } else {
        // #region agent log
        if (window.electronAPI?.debugLog) {
          window.electronAPI.debugLog({location:'TextLibrary.tsx:checkWidth:noRef',message:'checkWidth: containerRef.current is null',data:{containerWidth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'}).catch(()=>{});
        }
        // #endregion
      }
    };

    // Check immediately
    checkWidth();
    
    // Check after a brief delay to catch any delayed layout
    const timeoutId = setTimeout(checkWidth, 50);
    
    // Also check after animation completes (if panel is animating in)
    const animationTimeoutId = setTimeout(checkWidth, 300);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(animationTimeoutId);
    };
  }, [containerWidth]); // Re-run when width changes or component mounts

  // Give ArchiveContext a brief moment to stabilize before deciding to show gallery
  // This fixes the race condition where currentCase might be temporarily null
  useEffect(() => {
    if (!hasCheckedContextRef.current) {
      hasCheckedContextRef.current = true;
      // Small delay to allow ArchiveContext to sync from ArchivePage
      const timeoutId = setTimeout(() => {
        setContextStabilized(true);
      }, 50); // 50ms should be enough for context to sync
      
      return () => clearTimeout(timeoutId);
    } else {
      // On subsequent renders, context should already be stable
      setContextStabilized(true);
    }
  }, []);

  // Update loading state based on whether we should show gallery
  // If we're in case gallery, don't show loading - show gallery instead
  useEffect(() => {
    const effectiveCasePath = detachedCasePath || currentCase?.path;
    // Check for both null and undefined since currentCase?.path can be undefined
    const shouldShowGalleryCalc = (effectiveCasePath === null || effectiveCasePath === undefined) && selectedCaseForNotes === null;
    // If we should show gallery, don't show loading state
    if (shouldShowGalleryCalc) {
      setLoading(false);
    }
  }, [currentCase, detachedCasePath, selectedCaseForNotes]);

  // Determine if we should show the gallery:
  // - If user explicitly clicked "View Case Notes" (showGallery === true), show gallery
  // - If not in a case (currentCase === null) and no case selected and no detachedCasePath, show gallery
  // - CRITICAL: If currentCase exists OR detachedCasePath is provided, NEVER show gallery by default - always show that case's notes
  // - CRITICAL: Wait for context to stabilize before showing gallery to avoid race condition
  // This ensures that when user opens Text Library while in a case, they see that case's notes, not the gallery
  // We check currentCase directly - if it exists, we're in a case and should show notes, not gallery
  // In detached mode, use detachedCasePath if provided
  const effectiveCasePath = detachedCasePath || currentCase?.path;
  // Show gallery if: user explicitly requested it, OR we're in case gallery (no currentCase) 
  // For case gallery, show immediately - don't wait for contextStabilized to avoid showing files first
  // Check for both null and undefined since currentCase?.path can be undefined
  const shouldShowGallery = showGallery || ((effectiveCasePath === null || effectiveCasePath === undefined) && selectedCaseForNotes === null);

  useEffect(() => {
    // Wait for context to stabilize before loading files
    if (!contextStabilized) {
      return;
    }
    
    // Calculate shouldShowGallery here to use in the condition
    const effectiveCasePath = detachedCasePath || currentCase?.path;
    // Check for both null and undefined since currentCase?.path can be undefined
    const shouldShowGalleryCalc = showGallery || ((effectiveCasePath === null || effectiveCasePath === undefined) && selectedCaseForNotes === null);
    
    // Load files when:
    // 1. A case is selected from gallery
    // 2. We're in a case context (show that case's notes by default)
    // 3. Not in a case and not showing gallery (show global notes)
    // IMPORTANT: Don't load files if we should show the gallery - let the gallery render instead
    // IMPORTANT: Always prioritize showing case notes if currentCase exists
    if (selectedCaseForNotes?.path) {
      loadFiles();
    } else if (currentCase?.path && !showGallery) {
      // When in a case, show that case's notes by default - this is the most important case
      loadFiles();
    } else if (!currentCase && !shouldShowGalleryCalc) {
      // Load global files if not in a case and NOT showing gallery
      // If shouldShowGalleryCalc is true, we should show the gallery instead, so don't load files
      loadFiles();
    }
    // If shouldShowGalleryCalc is true, we don't load files - the gallery will be shown instead
  }, [selectedCaseForNotes?.path, currentCase?.path, showGallery, contextStabilized, detachedCasePath]);

  const loadFiles = async () => {
    // #region agent log
    if (window.electronAPI?.debugLog) {
      window.electronAPI.debugLog({location:'TextLibrary.tsx:loadFiles:entry',message:'loadFiles called',data:{selectedCasePath:selectedCaseForNotes?.path,currentCasePath:currentCase?.path,isDetached},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}).catch(()=>{});
    }
    // #endregion
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Priority: selectedCaseForNotes > detachedCasePath > currentCase > global
      const casePath = selectedCaseForNotes?.path || detachedCasePath || currentCase?.path;
      // #region agent log
      if (window.electronAPI?.debugLog) {
        window.electronAPI.debugLog({location:'TextLibrary.tsx:loadFiles:casePath',message:'Determined casePath',data:{casePath,selectedCasePath:selectedCaseForNotes?.path,currentCasePath:currentCase?.path,willLoadCaseNotes:!!casePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}).catch(()=>{});
      }
      // #endregion
      
      if (casePath) {
        // Load case notes
        const fileList = await window.electronAPI.listCaseNotes(casePath);
        setFiles(fileList);
        // #region agent log
        if (window.electronAPI?.debugLog) {
          window.electronAPI.debugLog({location:'TextLibrary.tsx:loadFiles:loadedCaseNotes',message:'Loaded case notes',data:{casePath,fileCount:fileList.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}).catch(()=>{});
        }
        // #endregion
      } else {
        // Load global notes
        const fileList = await window.electronAPI.listTextFiles();
        setFiles(fileList);
        // #region agent log
        if (window.electronAPI?.debugLog) {
          window.electronAPI.debugLog({location:'TextLibrary.tsx:loadFiles:loadedGlobalNotes',message:'Loaded global notes',data:{fileCount:fileList.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}).catch(()=>{});
        }
        // #endregion
      }
    } catch (error) {
      toast.error('Failed to load notes');
      console.error('Load files error:', error);
      // #region agent log
      if (window.electronAPI?.debugLog) {
        window.electronAPI.debugLog({location:'TextLibrary.tsx:loadFiles:error',message:'Load files failed',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}).catch(()=>{});
      }
      // #endregion
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (filePath: string, fileName: string) => {
    setFileToDelete({ path: filePath, name: fileName });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!window.electronAPI || !fileToDelete) return;

    try {
      await window.electronAPI.deleteTextFile(fileToDelete.path);
      await loadFiles();
      toast.success('File deleted');
      // Notify parent that a file was deleted (in case it's the currently open file)
      if (onFileDeleted) {
        onFileDeleted(fileToDelete.path);
      }
      setFileToDelete(null);
    } catch (error) {
      toast.error('Failed to delete file');
      console.error('Delete error:', error);
    }
  };

  const handleSaveAs = async (filePath: string) => {
    // This will be handled by opening the file and showing save dialog
    onOpenFile(filePath);
  };

  const handleNewFileClick = () => {
    setShowNewFileDialog(true);
  };

  const handleNewFileConfirm = async (fileName: string) => {
    // Use selectedCaseForNotes if available, otherwise use currentCase, otherwise global
    const casePath = selectedCaseForNotes?.path || currentCase?.path;
    
    if (casePath) {
      // Create case note
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
    } else {
      // Create global text file
      onNewFile(fileName);
      setShowNewFileDialog(false);
    }
  };

  // Show gallery ONLY when:
  // 1. User explicitly clicked "View Case Notes" button (showGallery === true), OR
  // 2. Not in a case (viewing case list) - show gallery of all cases
  // CRITICAL: If currentCase exists, NEVER show gallery by default - always show that case's notes
  // CRITICAL: Wait for context to stabilize before showing gallery to avoid race condition
  // This prevents the gallery from showing when user opens Text Library while in a case
  // Double-check: even if shouldShowGallery is true, if currentCase exists and user didn't explicitly request it, don't show gallery
  // When in case gallery (currentCase === null), show gallery immediately
  // When in a case, wait for context to stabilize to avoid race conditions
  const willShowGallery = shouldShowGallery && (!currentCase || contextStabilized);
  if (willShowGallery) {
    // Enhanced gallery for detached mode
    if (isDetached) {
      return (
        <div className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
          <div className="relative p-8 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl">
            <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                  <div className="relative p-5 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                    <FolderOpen className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                    Case Notes Gallery
                  </h1>
                  <p className="text-lg text-gray-400 mt-2">
                    Browse and manage notes across all cases
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <CaseNotesGallery
              onSelectCase={(casePath, caseName) => {
                setSelectedCaseForNotes({ path: casePath, name: caseName || casePath.split(/[/\\]/).pop() || 'Case' });
                setShowGallery(false);
              }}
              onClose={() => {
                if (currentCase) {
                  setShowGallery(false);
                } else {
                  onClose();
                }
              }}
              onOpenFile={onOpenFile}
              onNewFile={handleNewFileConfirm}
              onFileDeleted={onFileDeleted}
            />
          </div>
        </div>
      );
    }
    return (
      <CaseNotesGallery
        onSelectCase={(casePath, caseName) => {
          // Set the selected case to show its notes
          setSelectedCaseForNotes({ path: casePath, name: caseName || casePath.split(/[/\\]/).pop() || 'Case' });
          setShowGallery(false); // Close gallery when case is selected
        }}
        onClose={() => {
          if (currentCase) {
            // If we're in a case, close gallery and show case notes
            setShowGallery(false);
          } else {
            // If not in a case, close gallery and go back to editor
            onClose();
          }
        }}
        onOpenFile={onOpenFile}
        onNewFile={handleNewFileConfirm}
        onFileDeleted={onFileDeleted}
      />
    );
  }

  // Enhanced header for detached mode
  if (isDetached) {
    // Handle loading state for detached mode
    if (loading) {
      return (
        <div className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
          <div className="relative p-8 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl">
            <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                  <div className="relative p-5 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                    {selectedCaseForNotes 
                      ? `Case Notes: ${selectedCaseForNotes.name}` 
                      : currentCase
                        ? `Case Notes: ${currentCase.name}`
                        : 'Text Library'}
                  </h1>
                  <p className="text-lg text-gray-400 mt-2">
                    {selectedCaseForNotes || currentCase 
                      ? 'Manage and organize your case notes' 
                      : 'Your personal document collection'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-6">
                <div className="inline-flex p-6 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 rounded-2xl border-2 border-cyber-cyan-400/30">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan-400"></div>
                </div>
                <p className="text-gray-300 text-lg">Loading files...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div ref={containerRef} className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
        {/* Enhanced Header - Detached Mode */}
        <div className="relative p-8 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative p-5 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                  <FileText className="w-10 h-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                  {selectedCaseForNotes 
                    ? `Case Notes: ${selectedCaseForNotes.name}` 
                    : currentCase
                      ? `Case Notes: ${currentCase.name}`
                      : 'Text Library'}
                </h1>
                <p className="text-lg text-gray-400 mt-2">
                  {selectedCaseForNotes || currentCase 
                    ? 'Manage and organize your case notes' 
                    : 'Your personal document collection'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(currentCase || selectedCaseForNotes) && (
                <button
                  onClick={() => setShowGallery(true)}
                  className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-all border border-gray-700/50 hover:border-cyber-purple-400/50 flex items-center gap-2 text-gray-300 hover:text-white text-sm font-medium"
                  title="View all cases"
                >
                  <FolderOpen size={16} />
                  <span>View All Cases</span>
                </button>
              )}
              <button
                onClick={handleNewFileClick}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 rounded-lg font-medium text-white text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group flex items-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <Plus size={16} className="relative z-10" />
                <span className="relative z-10">New Note</span>
              </button>
            </div>
          </div>
        </div>

        {/* Files Grid - Detached Mode */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-6">
                <div className="inline-flex p-6 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 rounded-2xl border-2 border-cyber-cyan-400/30">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan-400"></div>
                </div>
                <p className="text-gray-300 text-lg">Loading files...</p>
              </div>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="inline-flex p-8 bg-gray-800/50 rounded-2xl border border-cyber-purple-400/20 mb-6">
                <FileText className="w-20 h-20 text-cyber-purple-400/50" />
              </div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">No notes yet</h3>
              <p className="text-gray-400 text-lg mb-6">
                {(selectedCaseForNotes || currentCase) ? 'Create your first case note to get started' : 'Create your first document to get started'}
              </p>
              <button
                onClick={handleNewFileClick}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 hover:from-cyan-700 hover:via-purple-700 hover:to-cyan-700 rounded-lg font-semibold text-white text-base transition-all shadow-lg hover:shadow-cyan-500/50 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <Plus size={18} className="relative z-10 mr-2" />
                <span className="relative z-10">{(selectedCaseForNotes || currentCase) ? 'Create your first note' : 'Create your first document'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {files.map((file) => (
                <TextLibraryItem
                  key={file.path}
                  file={file}
                  onOpen={() => onOpenFile(file.path)}
                  onEdit={() => onOpenFile(file.path)}
                  onSaveAs={() => handleSaveAs(file.path)}
                  onDelete={() => handleDeleteClick(file.path, file.name)}
                  isDetached={true}
                  layout="card"
                />
              ))}
            </div>
          )}
        </div>

        {/* New File Name Dialog */}
        <NewFileNameDialog
          isOpen={showNewFileDialog}
          onClose={() => setShowNewFileDialog(false)}
          onConfirm={handleNewFileConfirm}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteTextFileConfirmDialog
          isOpen={showDeleteDialog}
          fileName={fileToDelete?.name || ''}
          onClose={() => {
            setShowDeleteDialog(false);
            setFileToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    );
  }

  // Standard loading state for non-detached mode
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading files...</p>
        </div>
      </div>
    );
  }

  // Standard header for non-detached mode
  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden">
      {/* Header - Adaptive based on width */}
      <div className={`${useListView ? 'px-2.5 py-2' : 'px-6 py-5'} border-b border-gray-700/50 flex items-center justify-between flex-shrink-0 bg-gray-900/30 transition-all duration-200 ease-out`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedCaseForNotes ? (
            <button
              onClick={() => {
                setSelectedCaseForNotes(null);
                setShowGallery(true);
              }}
              className={`${useListView ? 'p-1' : 'p-1.5'} hover:bg-gray-800/50 rounded-lg transition-all duration-200 flex-shrink-0`}
              aria-label="Back to cases gallery"
              title="Back to cases"
            >
              <ArrowLeft size={useListView ? 14 : 18} className="text-gray-400" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className={`${useListView ? 'p-1' : 'p-1.5'} hover:bg-gray-800/50 rounded-lg transition-all duration-200 flex-shrink-0`}
              aria-label="Back to editor"
            >
              <ArrowLeft size={useListView ? 14 : 18} className="text-gray-400" />
            </button>
          )}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h3 className={`${useListView ? 'text-xs' : 'text-xl'} font-bold text-white truncate transition-all duration-200 ease-out`}>
              {selectedCaseForNotes 
                ? `Case Notes: ${selectedCaseForNotes.name}` 
                : currentCase
                  ? `Case Notes: ${currentCase.name}`
                  : 'Text Library'}
            </h3>
            {(currentCase || selectedCaseForNotes) && (
              <button
                onClick={() => setShowGallery(true)}
                className={`${useListView ? 'px-2 py-1' : 'px-3 py-1.5'} ${useListView ? 'text-xs' : 'text-xs'} bg-gray-700/40 hover:bg-gray-700/60 text-gray-300 hover:text-white rounded-md transition-all duration-200 ease-out flex items-center gap-1.5 border border-gray-600/30 flex-shrink-0`}
                title="View all cases"
              >
                <FolderOpen size={useListView ? 12 : 14} />
                {!useListView && <span>View All Cases</span>}
              </button>
            )}
          </div>
        </div>
        <button
          onClick={handleNewFileClick}
          className={`${useListView ? 'px-2 py-1' : 'px-3 py-2'} bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white rounded-md transition-all duration-200 ease-out flex items-center gap-1 ${useListView ? 'text-xs' : 'text-sm'} font-medium ${useListView ? 'shadow-sm' : 'shadow-md'} shadow-cyber-purple-500/20 hover:shadow-lg hover:shadow-cyber-purple-500/30 flex-shrink-0`}
        >
          <Plus size={useListView ? 12 : 16} />
          {!useListView && <span>New Note</span>}
        </button>
      </div>

      {/* Files Grid/List - Adaptive design based on container width */}
      <div className={`flex-1 overflow-y-auto ${useListView ? 'px-2.5 py-2' : 'px-6 py-6'} transition-all duration-200 ease-out`}>
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText size={useListView ? 40 : 64} className="text-gray-600 mb-6 transition-all duration-200 ease-out" />
            <p className={`text-gray-300 ${useListView ? 'text-sm' : 'text-lg'} mb-3 font-medium transition-all duration-200 ease-out`}>
              {(selectedCaseForNotes || currentCase) ? 'No notes yet for this case' : 'No text files yet'}
            </p>
            <button
              onClick={handleNewFileClick}
              className={`${useListView ? 'px-3 py-1.5 text-xs' : 'px-6 py-3 text-sm'} bg-cyber-purple-500 hover:bg-cyber-purple-600 text-white rounded-lg transition-all duration-200 font-medium shadow-md shadow-cyber-purple-500/20 hover:shadow-lg`}
            >
              {(selectedCaseForNotes || currentCase) ? 'Create your first note' : 'Create your first document'}
            </button>
          </div>
        ) : layoutMode === 'list' ? (
          // List view for narrow panels
          <div className="space-y-1.5">
            {files.map((file) => (
              <TextLibraryItem
                key={file.path}
                file={file}
                onOpen={() => onOpenFile(file.path)}
                onEdit={() => onOpenFile(file.path)}
                onSaveAs={() => handleSaveAs(file.path)}
                onDelete={() => handleDeleteClick(file.path, file.name)}
                isDetached={isDetached}
                layout="list"
              />
            ))}
          </div>
        ) : (
          // Card grid view for wider panels
          <div className={isDetached 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
            : "grid gap-5"
            }
            style={!isDetached ? {
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
            } : undefined}
          >
            {files.map((file) => (
              <TextLibraryItem
                key={file.path}
                file={file}
                onOpen={() => onOpenFile(file.path)}
                onEdit={() => onOpenFile(file.path)}
                onSaveAs={() => handleSaveAs(file.path)}
                onDelete={() => handleDeleteClick(file.path, file.name)}
                isDetached={isDetached}
                layout="card"
              />
            ))}
          </div>
        )}
      </div>

      {/* New File Name Dialog */}
      <NewFileNameDialog
        isOpen={showNewFileDialog}
        onClose={() => setShowNewFileDialog(false)}
        onConfirm={handleNewFileConfirm}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTextFileConfirmDialog
        isOpen={showDeleteDialog}
        fileName={fileToDelete?.name || ''}
        onClose={() => {
          setShowDeleteDialog(false);
          setFileToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

