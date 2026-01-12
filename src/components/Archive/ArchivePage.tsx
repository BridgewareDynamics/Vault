import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FolderPlus, Upload, ArrowLeft, FolderOpen, FileText } from 'lucide-react';
import { useArchive } from '../../hooks/useArchive';
import { useArchiveExtraction } from '../../hooks/useArchiveExtraction';
import { useToast } from '../Toast/ToastContext';
import { useCategoryTags } from '../../hooks/useCategoryTags';
import { CaseFolder } from './CaseFolder';
import { RegularFolder } from './RegularFolder';
import { ArchiveFileItem } from './ArchiveFileItem';
import { ArchiveFileViewer } from './ArchiveFileViewer';
import { ArchiveSearchBar } from './ArchiveSearchBar';
import { ArchiveDriveDialog } from './ArchiveDriveDialog';
import { CaseNameDialog } from './CaseNameDialog';
import { ExtractionFolderDialog } from './ExtractionFolderDialog';
import { SaveParentDialog } from './SaveParentDialog';
import { FolderSelectionDialog } from './FolderSelectionDialog';
import { DeleteFolderConfirmDialog } from './DeleteFolderConfirmDialog';
import { RenameFileDialog } from './RenameFileDialog';
import { CreateFolderDialog } from './CreateFolderDialog';
import { ExtractionFolder } from './ExtractionFolder';
import { CategoryTagSelector } from './CategoryTagSelector';
import { ArchiveFile } from '../../types';
import { ProgressBar } from '../ProgressBar';
import { SecurityCheckerModal } from '../SecurityCheckerModal';
import { PDFExtractionModal } from '../PDFExtractionModal';
import { ActionToolbar } from '../ActionToolbar';
import { logger } from '../../utils/logger';
// import { useWordEditor } from '../../contexts/WordEditorContext'; // Unused for now
import { useArchiveContext } from '../../contexts/ArchiveContext';

interface ArchivePageProps {
  onBack: () => void;
}

export function ArchivePage({ onBack }: ArchivePageProps) {
  const {
    archiveConfig,
    cases,
    currentCase,
    currentFolderPath,
    folderNavigationStack,
    files,
    searchQuery,
    loading,
    setCurrentCase,
    setSearchQuery,
    selectArchiveDrive,
    createCase,
    createFolder,
    addFilesToCase,
    deleteCase,
    deleteFile,
    renameFile,
    moveFileToFolder,
    openFolder,
    goBackToCase,
    goBackToParentFolder,
    navigateToFolder,
    updateCaseBackgroundImage,
    updateFolderBackgroundImage,
    refreshFiles,
    refreshCases,
    selectedTagId,
    setSelectedTagId,
    tags,
    getTagById,
    findFileInArchive,
  } = useArchive();

  const { createTag, deleteTag, assignTagToCase, assignTagToFile } = useCategoryTags();

  const { extractPDF, isExtracting, progress, statusMessage, extractingCasePath, extractingFolderPath } = useArchiveExtraction();
  const toast = useToast();
  // const { isOpen: isWordEditorOpen } = useWordEditor(); // Unused for now
  const { currentCase: archiveContextCase, setCurrentCase: setArchiveContextCase } = useArchiveContext();
  
  // Track if we've attempted to restore case from context (prevents multiple restorations)
  const hasRestoredCaseRef = useRef(false);
  // Track if we've processed the sessionStorage bookmark (prevents re-processing)
  const hasProcessedSessionBookmarkRef = useRef(false);
  // Track the last restored case path to detect remount scenarios
  const lastRestoredCasePathRef = useRef<string | null>(null);

  // Restore currentCase from ArchiveContext on mount if local state is null
  // This fixes the issue where ArchivePage remounts (due to layout changes) and loses case selection
  // OPTIMIZED: Use useLayoutEffect for immediate restoration to prevent visual refresh
  useLayoutEffect(() => {
    // Fast path: If we're remounting and context has the same case we just restored, restore immediately
    // This prevents the menu from showing null state before restoration
    if (currentCase === null && 
        archiveContextCase !== null && 
        lastRestoredCasePathRef.current === archiveContextCase.path &&
        cases.length > 0) {
      // Verify the case still exists
      const caseExists = cases.some(c => c.path === archiveContextCase.path);
      if (caseExists) {
        // Immediate restoration to prevent visual refresh
        setCurrentCase(archiveContextCase);
        return;
      }
    }
  }, [currentCase, archiveContextCase, cases, setCurrentCase]);

  // Full restoration logic for initial mount or case changes
  useEffect(() => {
    // #region agent log
    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:84', message: 'Restoration useEffect: Entry', data: { hasRestoredCase: hasRestoredCaseRef.current, casesLength: cases.length, currentCaseIsNull: currentCase === null, archiveContextCaseIsNull: archiveContextCase === null, archiveContextCasePath: archiveContextCase?.path, lastRestoredPath: lastRestoredCasePathRef.current }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }).catch(() => { });
    // #endregion
    
    // Update last restored path if we have a current case
    if (currentCase?.path) {
      lastRestoredCasePathRef.current = currentCase.path;
    }
    
    // Only restore if:
    // 1. We haven't already restored this case (or it's a different case)
    // 2. Cases are loaded (we need the list to validate)
    // 3. Local currentCase is null (we just mounted/remounted)
    // 4. ArchiveContext has a case (there was a previous selection)
    // 5. We haven't already restored this exact case (prevents refresh on remount)
    const isSameCase = lastRestoredCasePathRef.current === archiveContextCase?.path;
    const shouldRestore = cases.length > 0 && 
                          currentCase === null && 
                          archiveContextCase !== null &&
                          (!hasRestoredCaseRef.current || !isSameCase);
    
    if (shouldRestore) {
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:90', message: 'Restoration useEffect: Conditions met, checking case existence', data: { archiveContextCasePath: archiveContextCase.path }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }).catch(() => { });
      // #endregion
      // Verify the case still exists in our cases list
      const caseExists = cases.some(c => c.path === archiveContextCase.path);
      if (caseExists) {
        // #region agent log
        if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:94', message: 'Restoration useEffect: Restoring case from context', data: { casePath: archiveContextCase.path, caseName: archiveContextCase.name }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }).catch(() => { });
        // #endregion
        setCurrentCase(archiveContextCase);
        hasRestoredCaseRef.current = true;
        lastRestoredCasePathRef.current = archiveContextCase.path;
      } else {
        // #region agent log
        if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:97', message: 'Restoration useEffect: Case not found, marking as restored', data: { archiveContextCasePath: archiveContextCase.path }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }).catch(() => { });
        // #endregion
        // Case doesn't exist anymore, mark as restored to prevent retrying
        hasRestoredCaseRef.current = true;
        lastRestoredCasePathRef.current = null;
      }
    } else if (currentCase === null && archiveContextCase === null) {
      // Both are null - reset flags to allow future restoration
      // This happens when user navigates back to case gallery
      hasRestoredCaseRef.current = false;
      lastRestoredCasePathRef.current = null;
    }
  }, [cases, currentCase, archiveContextCase, setCurrentCase]);

  // Update global ArchiveContext when currentCase changes
  // Use useLayoutEffect to ensure synchronous update before browser paint
  // This prevents race conditions when word editor opens and needs to read currentCase
  // OPTIMIZED: Only sync if values actually changed to prevent unnecessary re-renders
  useLayoutEffect(() => {
    // #region agent log
    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:108', message: 'Sync useLayoutEffect: Entry', data: { currentCaseIsNull: currentCase === null, currentCasePath: currentCase?.path, archiveContextCaseIsNull: archiveContextCase === null, archiveContextCasePath: archiveContextCase?.path }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
    // #endregion
    
    // Only sync if values actually differ to prevent unnecessary updates
    if (currentCase !== null) {
      // Only sync if context doesn't already have the same case (by path comparison)
      if (archiveContextCase?.path !== currentCase.path) {
        // #region agent log
        if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:111', message: 'Sync useLayoutEffect: Syncing non-null case to context', data: { casePath: currentCase.path, caseName: currentCase.name }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
        // #endregion
        setArchiveContextCase(currentCase);
      }
    } else if (archiveContextCase === null) {
      // Both are null - no need to sync (already in sync)
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:113', message: 'Sync useLayoutEffect: Both null, already in sync', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
      // #endregion
    } else {
      // currentCase is null but archiveContextCase is not - skip syncing
      // This allows the useEffect to restore from context first
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:117', message: 'Sync useLayoutEffect: Skipping sync - currentCase null but context has case', data: { archiveContextCasePath: archiveContextCase.path }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
      // #endregion
    }
  }, [currentCase, setArchiveContextCase, archiveContextCase]);

  const [showDriveDialog, setShowDriveDialog] = useState(false);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showFolderSelectionDialog, setShowFolderSelectionDialog] = useState(false);
  const [showExtractionDialog, setShowExtractionDialog] = useState(false);
  const [showSaveParentDialog, setShowSaveParentDialog] = useState(false);
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<ArchiveFile | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [fileToRename, setFileToRename] = useState<ArchiveFile | null>(null);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [selectedFileForExtraction, setSelectedFileForExtraction] = useState<ArchiveFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<ArchiveFile | null>(null);
  const [fileViewerIndex, setFileViewerIndex] = useState(0);
  const [initialPage, setInitialPage] = useState<number | undefined>(undefined);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [tagSelectorCasePath, setTagSelectorCasePath] = useState<string | null>(null);
  const [tagSelectorFilePath, setTagSelectorFilePath] = useState<string | null>(null);
  const [pendingBookmarkOpen, setPendingBookmarkOpen] = useState<{ pdfPath: string; pageNumber: number; timestamp?: number } | null>(null);
  const [targetFolderPath, setTargetFolderPath] = useState<string | null>(null);
  const [showSecurityChecker, setShowSecurityChecker] = useState(false);
  const [pdfPathForAudit, setPdfPathForAudit] = useState<string | null>(null);
  const [showPDFExtraction, setShowPDFExtraction] = useState(false);
  const [pdfPathForExtraction, setPdfPathForExtraction] = useState<string | null>(null);

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<ArchiveFile | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  // Auto-show vault directory dialog on first open if no vault directory is set
  useEffect(() => {
    // Only show dialog if archiveConfig has been loaded and no vault directory is set
    if (archiveConfig !== null && archiveConfig !== undefined && !archiveConfig.archiveDrive) {
      setShowDriveDialog(true);
    }
  }, [archiveConfig]);

  // Check for pending bookmark open on mount (handles case where archive was just opened)
  // Only process once to prevent re-opening bookmarks when navigating
  useEffect(() => {
    // Only process if we haven't already processed it
    if (hasProcessedSessionBookmarkRef.current) {
      return;
    }

    // Check if there's a pending bookmark open stored in sessionStorage
    const pendingBookmark = sessionStorage.getItem('pending-bookmark-open');
    if (pendingBookmark && files.length > 0 && !loading) {
      try {
        const { pdfPath, pageNumber } = JSON.parse(pendingBookmark);
        // Mark as processed immediately to prevent re-processing
        hasProcessedSessionBookmarkRef.current = true;
        sessionStorage.removeItem('pending-bookmark-open');

        // Dispatch the event so the normal handler can process it
        // Use a small delay to ensure all state is ready
        setTimeout(() => {
          const event = new CustomEvent('open-bookmark', {
            detail: { pdfPath, pageNumber }
          });
          window.dispatchEvent(event);
        }, 100);
      } catch (error) {
        console.error('Failed to parse pending bookmark:', error);
        // Mark as processed even on error to prevent retries
        hasProcessedSessionBookmarkRef.current = true;
        sessionStorage.removeItem('pending-bookmark-open');
      }
    }
  }, [files.length, loading]); // Check when files are loaded and not loading

  // Navigate to target folder after case is loaded
  useEffect(() => {
    if (targetFolderPath && currentCase && !loading && files.length > 0) {
      // We've switched to a new case and files are loaded, now navigate to the folder
      const normalizePath = (path: string) => path.replace(/\\/g, '/');

      // Only navigate if we're not already in the target folder
      if (!currentFolderPath || normalizePath(currentFolderPath) !== normalizePath(targetFolderPath)) {
        if (currentCase) {
          openFolder(targetFolderPath);
          // Don't clear targetFolderPath here - let it be cleared after folder files are loaded
          // The pending bookmark will open once we're in the correct folder
          return;
        }
      }

      // Only clear target folder path if we're already in the target folder
      // This ensures we don't clear it before folder navigation completes
      if (currentFolderPath && normalizePath(currentFolderPath) === normalizePath(targetFolderPath)) {
        setTargetFolderPath(null);
      }
    }
  }, [targetFolderPath, currentCase, files, loading, currentFolderPath, openFolder]);

  // Handle opening pending bookmark after navigation completes
  useEffect(() => {
    if (!pendingBookmarkOpen || files.length === 0 || loading) {
      return;
    }

    // Only process if we're not currently viewing a file (to prevent re-opening after close)
    if (selectedFile) {
      // If a file is already open, don't process pending bookmark
      // This prevents re-opening bookmarks when user closes viewer and navigates
      return;
    }

    // Only process bookmarks that were set recently (within last 30 seconds)
    // This prevents old bookmarks from opening when navigating
    const bookmarkAge = pendingBookmarkOpen.timestamp ? Date.now() - pendingBookmarkOpen.timestamp : Infinity;
    if (bookmarkAge > 30000) {
      // Bookmark is too old, clear it
      setPendingBookmarkOpen(null);
      return;
    }

    const { pdfPath } = pendingBookmarkOpen;

    // Normalize paths for comparison
    const normalizePath = (path: string) => path.replace(/\\/g, '/');
    const normalizedPdfPath = normalizePath(pdfPath);

    // Find the file in the current files list
    const matchingFile = files.find(f => !f.isFolder && normalizePath(f.path) === normalizedPdfPath);

    if (matchingFile) {
      // Clear pending bookmark immediately to prevent re-triggering
      const bookmarkToOpen = pendingBookmarkOpen;
      setPendingBookmarkOpen(null);

      // Find the index of the file
      const index = files.filter(f => !f.isFolder).findIndex(f => normalizePath(f.path) === normalizedPdfPath);
      if (index !== -1) {
        setFileViewerIndex(index);
        setInitialPage(bookmarkToOpen.pageNumber);
        setSelectedFile(matchingFile);
        // Don't show toast - the PDF opening is visual feedback enough
      }
    }
  }, [pendingBookmarkOpen, files, loading, selectedFile]);

  // Listen for bookmark open events
  useEffect(() => {
    // Track if we're currently processing a bookmark to prevent duplicates
    let isProcessing = false;

    const handleOpenBookmark = async (event: CustomEvent<{ pdfPath: string; pageNumber: number; keepPanelOpen?: boolean }>) => {
      // Prevent duplicate handling
      if (isProcessing) {
        return;
      }

      const { pdfPath, pageNumber } = event.detail;
      
      // If we're in a case and files aren't loaded yet, store in sessionStorage and wait for files to load
      // But if we're in the case gallery (currentCase is null), we should still proceed to search and navigate
      if (currentCase && (files.length === 0 || loading)) {
        sessionStorage.setItem('pending-bookmark-open', JSON.stringify({ pdfPath, pageNumber }));
        return;
      }

      isProcessing = true;
      
      // Reset the session bookmark processing flag when a new bookmark is explicitly opened
      hasProcessedSessionBookmarkRef.current = false;

      try {
        // Normalize paths for comparison (handle different path separators)
        const normalizePath = (path: string) => path.replace(/\\/g, '/');
        const normalizedPdfPath = normalizePath(pdfPath);

        // First, check if the file is in the current view (only if we have files loaded)
        const matchingFile = files.length > 0 
          ? files.find(f => !f.isFolder && normalizePath(f.path) === normalizedPdfPath)
          : null;

        if (matchingFile) {
          // File is in current view - open it immediately
          const index = files.filter(f => !f.isFolder).findIndex(f => normalizePath(f.path) === normalizedPdfPath);
          if (index !== -1) {
            setFileViewerIndex(index);
            setInitialPage(pageNumber);
            // If the file is already selected, we still need to update the page
            // Force a re-render by setting selectedFile again
            if (selectedFile && normalizePath(selectedFile.path) === normalizedPdfPath) {
              // File is already open, just update the page
              // Set initialPage first, then update selectedFile to trigger re-render
              setInitialPage(pageNumber);
              setSelectedFile(null);
              setTimeout(() => {
                setSelectedFile(matchingFile);
              }, 10);
            } else {
              setSelectedFile(matchingFile);
            }
          } else {
            toast.error('File not found in current view');
          }
        } else {
          // File is not in current view - search across all cases
          // Don't show toast - navigation will happen silently
          let fileFound = false;
          try {
            const result = await findFileInArchive(pdfPath);

            if (!result) {
              toast.error('PDF not found in archive. The file may have been moved or deleted.');
              return;
            }

            fileFound = true; // Mark that we successfully found the file

            // Check if we need to navigate to a different case
            // If currentCase is null (in case gallery), we always need to navigate
            const needsCaseNavigation = !currentCase || normalizePath(currentCase.path) !== normalizePath(result.casePath);

            // Check if we need to navigate to a different folder
            // When in case gallery (currentCase is null), we always need folder navigation if file is in a folder
            const currentPath = currentFolderPath || currentCase?.path;
            const needsFolderNavigation = result.folderPath &&
              (!currentPath || normalizePath(currentPath) !== normalizePath(result.folderPath));
            
            // If we're in the gallery and the file is in a folder, we definitely need folder navigation
            const isInGallery = !currentCase;
            const fileIsInFolder = !!result.folderPath;

            // File was found successfully - proceed with navigation
            // Navigate if: switching cases or switching folders
            // Note: needsCaseNavigation will be true if currentCase is null (in case gallery)
            // Also navigate if we're in gallery and file is in a folder
            if (needsCaseNavigation || needsFolderNavigation || (isInGallery && fileIsInFolder)) {
              // Store bookmark info for opening after navigation (with timestamp)
              setPendingBookmarkOpen({ pdfPath, pageNumber, timestamp: Date.now() });

              // Navigate to the correct case if needed
              if (needsCaseNavigation) {
                const targetCase = cases.find(c => normalizePath(c.path) === normalizePath(result.casePath));
                if (!targetCase) {
                  toast.error('Case not found in archive');
                  setPendingBookmarkOpen(null);
                  return;
                }

                // Always store target folder path if the file is in a folder
                // This ensures we navigate to the folder even when coming from the case gallery
                if (result.folderPath) {
                  setTargetFolderPath(result.folderPath);
                } else {
                  setTargetFolderPath(null);
                }

                setCurrentCase(targetCase);
                // Reset folder navigation when switching cases
                goBackToCase();
              } else if (needsFolderNavigation && result.folderPath) {
                // We're in the right case, just need to navigate to folder
                // Use openFolder to properly build navigation stack
                if (currentCase) {
                  openFolder(result.folderPath);
                } else {
                  // Fallback: navigate to folder directly
                  navigateToFolder(result.folderPath);
                }
              }
              // Navigation started successfully - no need to show error
              return;
            } else {
              // We're already in the right location, but file might not be loaded yet
              // Set pending bookmark to trigger file open once files are loaded (with timestamp)
              setPendingBookmarkOpen({ pdfPath, pageNumber, timestamp: Date.now() });
              // File found and we're in the right location - no error
              return;
            }
          } catch (error) {
            logger.error('Error searching for bookmark file:', error);
            // Only show error if we didn't successfully find the file
            // (If file was found, navigation would have started and we'd have returned)
            if (!fileFound) {
              toast.error('Failed to search for PDF in archive');
            }
          }
        }
      } finally {
        // Reset processing flag after a short delay to allow navigation to complete
        setTimeout(() => {
          isProcessing = false;
        }, 1000);
      }
    };

    const handleNavigateToCaseFolder = (event: CustomEvent<{ casePath: string }>) => {
      const { casePath } = event.detail;
      
      // Find the case by path
      const targetCase = cases.find(c => c.path === casePath);
      if (targetCase) {
        // Only navigate if we're not already in this case
        // This prevents UI refresh and back button issues when reattaching
        if (currentCase?.path !== casePath) {
          // Set the case and navigate to case root
          setCurrentCase(targetCase);
          setArchiveContextCase(targetCase);
          goBackToCase();
        } else {
          // Already in the target case - just ensure context is synced
          // Don't call goBackToCase() as it resets navigation stack unnecessarily
          if (archiveContextCase?.path !== casePath) {
            setArchiveContextCase(targetCase);
          }
        }
      } else {
        toast.error('Case not found in archive');
      }
    };

    window.addEventListener('open-bookmark', handleOpenBookmark as unknown as EventListener);
    window.addEventListener('navigate-to-case-folder', handleNavigateToCaseFolder as unknown as EventListener);
    return () => {
      window.removeEventListener('open-bookmark', handleOpenBookmark as unknown as EventListener);
      window.removeEventListener('navigate-to-case-folder', handleNavigateToCaseFolder as unknown as EventListener);
    };
  }, [files, loading, toast, selectedFile, findFileInArchive, currentCase, currentFolderPath, cases, setCurrentCase, setArchiveContextCase, navigateToFolder, openFolder, goBackToCase]);

  // Listen for reattach data from detached PDF extraction window
  useEffect(() => {
    const handleReattach = (event: any) => {
      const data = event.detail;
      
      // Only handle reattach if caseFolderPath is present (archive usage)
      if (data && data.caseFolderPath) {
        console.log('ArchivePage: Received reattach-pdf-extraction-data event with caseFolderPath, opening modal');
        // Set the PDF path from reattach data
        if (data.pdfPath) {
          setPdfPathForExtraction(data.pdfPath);
        }
        // Open the ArchivePage's PDFExtractionModal
        // The modal will automatically restore state from window.__reattachPdfExtractionData
        setShowPDFExtraction(true);
      }
    };

    window.addEventListener('reattach-pdf-extraction-data' as any, handleReattach as EventListener);
    
    // Also check for stored data on mount
    const checkStoredData = () => {
      const storedData = (window as any).__reattachPdfExtractionData;
      if (storedData && storedData.caseFolderPath) {
        console.log('ArchivePage: Found stored reattach data with caseFolderPath, opening modal');
        if (storedData.pdfPath) {
          setPdfPathForExtraction(storedData.pdfPath);
        }
        setShowPDFExtraction(true);
      }
    };
    
    // Check after a short delay to ensure component is mounted
    const timeoutId = setTimeout(checkStoredData, 100);
    
    return () => {
      window.removeEventListener('reattach-pdf-extraction-data' as any, handleReattach as EventListener);
      clearTimeout(timeoutId);
    };
  }, []);

  // Handle drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:88', message: 'Global handleDragOver: Drag over', data: { hasFiles: e.dataTransfer?.files?.length || 0, dataTransferTypes: Array.from(e.dataTransfer?.types || []), hasTextPlain: e.dataTransfer?.types?.includes('text/plain') || false }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }).catch(() => { });
      // #endregion

      // Only prevent default for external file drags
      // Internal drags should be allowed to propagate to folder handlers
      const hasExternalFiles = (e.dataTransfer?.files?.length || 0) > 0;
      const hasInternalDrag = e.dataTransfer?.types?.includes('text/plain') && !hasExternalFiles;

      if (hasInternalDrag && !hasExternalFiles) {
        // Internal drag - let it propagate to folder handlers
        // Don't show global highlight for internal drags
        return; // Don't prevent default, don't set isDragging
      }

      // External file drag - prevent default to allow drop and show highlight
      e.preventDefault();
      e.stopPropagation();
      if (currentCase) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      // Only handle drag leave for external file drags
      // Internal drags are handled by folder components
      const hasExternalFiles = (e.dataTransfer?.files?.length || 0) > 0;
      const hasInternalDrag = e.dataTransfer?.types?.includes('text/plain') && !hasExternalFiles;

      if (hasInternalDrag && !hasExternalFiles) {
        // Internal drag - let folder handlers manage their own drag leave
        return;
      }

      // External file drag - clear highlight
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent) => {
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:102', message: 'Global handleDrop: Drop event', data: { hasFiles: e.dataTransfer?.files?.length || 0, dataTransferTypes: Array.from(e.dataTransfer?.types || []), hasTextPlain: e.dataTransfer?.types?.includes('text/plain') || false }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }).catch(() => { });
      // #endregion

      // Only handle external file drops (from file explorer)
      // Internal drags (within app) should be handled by folder drop handlers
      const droppedFiles = Array.from(e.dataTransfer?.files || []);
      const hasExternalFiles = droppedFiles.length > 0;
      const hasInternalDrag = e.dataTransfer?.types?.includes('text/plain') && !hasExternalFiles;

      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:109', message: 'Global handleDrop: Checking drop type', data: { hasExternalFiles, hasInternalDrag, willHandle: hasExternalFiles }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }).catch(() => { });
      // #endregion

      // If this is an internal drag (no external files), let it propagate to folder handlers
      if (hasInternalDrag && !hasExternalFiles) {
        // #region agent log
        if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:113', message: 'Global handleDrop: Internal drag - allowing propagation', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }).catch(() => { });
        // #endregion
        setIsDragging(false);
        return; // Don't prevent default, let folder handlers handle it
      }

      // This is an external file drop - handle it
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!currentCase) return;

      if (droppedFiles.length > 0) {
        const filePaths = droppedFiles
          .map(file => {
            // DataTransferItem can have a getAsFile() method or webkitGetAsEntry()
            // For Electron file drops, the path might be in the file object
            if ('path' in file && typeof (file as { path?: string }).path === 'string') {
              return (file as { path: string }).path;
            }
            return null;
          })
          .filter((path): path is string => path !== null);
        if (filePaths.length > 0) {
          await addFilesToCase(currentCase.path, filePaths);
        }
      }
    };

    const element = dropZoneRef.current;
    if (element) {
      element.addEventListener('dragover', handleDragOver);
      element.addEventListener('dragleave', handleDragLeave);
      element.addEventListener('drop', handleDrop);
    }

    return () => {
      if (element) {
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('drop', handleDrop);
      }
    };
  }, [currentCase, addFilesToCase]);

  const handleSelectDrive = async () => {
    const success = await selectArchiveDrive();
    if (success) {
      setShowDriveDialog(false);
    }
  };

  const handleCreateCase = async (caseName: string, description: string, categoryTagId?: string) => {
    const success = await createCase(caseName, description, categoryTagId);
    if (success) {
      setShowCaseDialog(false);
    }
  };

  const handleTagClick = (casePath: string) => {
    setTagSelectorCasePath(casePath);
    setTagSelectorFilePath(null);
    setShowTagSelector(true);
  };

  const handleFileTagClick = (filePath: string) => {
    console.log('[ArchivePage] handleFileTagClick:', { filePath, file: files.find(f => f.path === filePath) });
    setTagSelectorFilePath(filePath);
    setTagSelectorCasePath(null);
    setShowTagSelector(true);
  };

  const handleTagSelect = async (tagId: string | null) => {
    if (tagSelectorFilePath) {
      // Assign tag to specific file
      console.log('[ArchivePage] handleTagSelect - assigning tag to file:', { tagSelectorFilePath, tagId, file: files.find(f => f.path === tagSelectorFilePath) });
      const success = await assignTagToFile(tagSelectorFilePath, tagId);
      if (success) {
        // Reload files to update the UI with the new tag
        await refreshFiles();
      }
    } else if (tagSelectorCasePath) {
      // Assign tag to case
      const success = await assignTagToCase(tagSelectorCasePath, tagId);
      if (success) {
        // Reload cases to update the UI with the new tag
        await refreshCases();

        // Update currentCase if it's the one we just modified
        if (currentCase && currentCase.path === tagSelectorCasePath) {
          // Update currentCase with the new tagId
          setCurrentCase({ ...currentCase, categoryTagId: tagId || undefined });
        }
      }
    }
    setShowTagSelector(false);
    setTagSelectorCasePath(null);
    setTagSelectorFilePath(null);
  };

  const handleCreateFolder = async (folderName: string) => {
    const success = await createFolder(folderName);
    if (success) {
      setShowCreateFolderDialog(false);
    }
  };

  const handleMoveFileToFolder = async (filePath: string, folderPath: string) => {
    // #region agent log
    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:164', message: 'handleMoveFileToFolder: Entry', data: { filePath, folderPath, hasFilePath: !!filePath, hasFolderPath: !!folderPath }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
    // #endregion
    if (!filePath || !folderPath) {
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:166', message: 'handleMoveFileToFolder: Missing paths - returning early', data: { filePath, folderPath }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
      // #endregion
      logger.warn('handleMoveFileToFolder: Missing filePath or folderPath', { filePath, folderPath });
      return;
    }
    try {
      logger.log('handleMoveFileToFolder: Moving file', { filePath, folderPath });
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:171', message: 'handleMoveFileToFolder: Calling moveFileToFolder hook', data: { filePath, folderPath }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }).catch(() => { });
      // #endregion
      const result = await moveFileToFolder(filePath, folderPath);
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:173', message: 'handleMoveFileToFolder: moveFileToFolder completed', data: { filePath, folderPath, result }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }).catch(() => { });
      // #endregion
    } catch (error) {
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:175', message: 'handleMoveFileToFolder: Error caught', data: { filePath, folderPath, error: error instanceof Error ? error.message : String(error) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }).catch(() => { });
      // #endregion
      logger.error('Failed to move file to folder:', error);
    }
  };

  const handleAddFiles = async () => {
    if (!currentCase) return;
    await addFilesToCase(currentCase.path);
  };

  const handleFileClick = (file: ArchiveFile) => {
    // Don't open folders in the file viewer
    if (file.isFolder) {
      return;
    }
    const index = files.filter(f => !f.isFolder).findIndex(f => f.path === file.path);
    setFileViewerIndex(index);
    setSelectedFile(file);
  };

  const handleNextFile = () => {
    if (fileViewerIndex < files.length - 1) {
      const nextFile = files[fileViewerIndex + 1];
      setFileViewerIndex(fileViewerIndex + 1);
      setSelectedFile(nextFile);
    }
  };

  const handlePreviousFile = () => {
    if (fileViewerIndex > 0) {
      const prevFile = files[fileViewerIndex - 1];
      setFileViewerIndex(fileViewerIndex - 1);
      setSelectedFile(prevFile);
    }
  };

  const handleExtractPDF = (file: ArchiveFile) => {
    setPdfPathForExtraction(file.path);
    setShowPDFExtraction(true);
  };

  const handleRunPDFAudit = (file: ArchiveFile) => {
    setPdfPathForAudit(file.path);
    setShowSecurityChecker(true);
  };

  const handleReportSaved = () => {
    // Refresh files to show the newly saved report
    if (currentCase) {
      refreshFiles();
    }
  };

  const [pendingExtraction, setPendingExtraction] = useState<{
    folderName: string;
    folderPath?: string;
    file: ArchiveFile;
    casePath: string;
  } | null>(null);

  const handleFolderSelection = () => {
    if (!selectedFileForExtraction || !currentCase) {
      logger.error('handleFolderSelection: Missing required data', {
        selectedFileForExtraction,
        currentCase
      });
      return;
    }
    setShowFolderSelectionDialog(false);
    setShowExtractionDialog(true);
  };

  const handleMakeNewFolder = () => {
    if (!selectedFileForExtraction || !currentCase) {
      logger.error('handleMakeNewFolder: Missing required data', {
        selectedFileForExtraction,
        currentCase
      });
      return;
    }
    setShowFolderSelectionDialog(false);
    setShowExtractionDialog(true);
  };

  const handleExtractionConfirm = async (folderName: string) => {
    // Capture the values immediately to avoid stale closure issues
    const fileToExtract = selectedFileForExtraction;
    const caseToUse = currentCase;

    if (!fileToExtract || !caseToUse) {
      logger.error('Missing required data:', { selectedFileForExtraction: fileToExtract, currentCase: caseToUse });
      setShowExtractionDialog(false);
      setSelectedFileForExtraction(null);
      return;
    }

    try {
      // Create folder immediately so it appears in the vault
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        setShowExtractionDialog(false);
        return;
      }

      const folderPath = await window.electronAPI.createExtractionFolder(caseToUse.path, folderName, fileToExtract.path);

      // Clear search query to ensure folder is visible
      setSearchQuery('');

      // Refresh files to show the new folder - use a small delay to ensure folder is fully created
      await new Promise(resolve => setTimeout(resolve, 200));

      await refreshFiles();

      setPendingExtraction({
        folderName,
        folderPath,
        file: fileToExtract,
        casePath: caseToUse.path,
      });

      setShowExtractionDialog(false);
      setShowSaveParentDialog(true);
    } catch (error) {
      logger.error('Failed to create extraction folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create extraction folder';
      toast.error(errorMessage);
      setShowExtractionDialog(false);
      // Don't clear selectedFileForExtraction on error, allow user to retry
    }
  };

  const handleSaveParentConfirm = async (saveParent: boolean) => {
    if (!pendingExtraction) {
      setShowSaveParentDialog(false);
      return;
    }

    setShowSaveParentDialog(false);

    try {
      // Refresh files immediately to show the folder with loading state
      if (currentCase) {
        await refreshFiles();
      }

      await extractPDF(
        pendingExtraction.file.path,
        pendingExtraction.casePath,
        pendingExtraction.folderName,
        saveParent
      );

      // Refresh files after extraction completes
      if (currentCase) {
        await refreshFiles();
      }
    } catch (error) {
      logger.error('Extraction failed:', error);
    }

    setSelectedFileForExtraction(null);
    setPendingExtraction(null);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 transition-all duration-300"
    >
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Enhanced Header */}
        <motion.div 
          className="relative p-8 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.9,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.1,
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative p-5 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                  <FolderOpen className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <motion.h1
                  className="text-4xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ 
                    duration: 0.9,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: 0.2,
                  }}
                >
                  The Vault
                </motion.h1>
                <motion.p 
                  className="text-lg text-gray-400 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ 
                    duration: 0.8,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: 0.3,
                  }}
                >
                  {currentCase 
                    ? `Case: ${currentCase.name}${currentFolderPath ? ` / ${currentFolderPath.split(/[/\\]/).pop() || currentFolderPath}` : ''}`
                    : 'Your case file archive'}
                </motion.p>
                {currentCase && (
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <button
                      onClick={() => navigateToFolder(currentCase.path)}
                      className={`text-sm ${currentFolderPath ? 'text-cyber-purple-400 hover:text-cyber-purple-300 underline' : 'text-white font-medium'}`}
                      aria-label={`Navigate to case ${currentCase.name}`}
                    >
                      {currentCase.name}
                    </button>
                    {currentFolderPath && (
                      <>
                        <span className="text-gray-500">/</span>
                        <div className="flex items-center gap-2">
                          {folderNavigationStack.map((path) => {
                            const folderName = path.split(/[/\\]/).pop() || path;
                            return (
                              <span key={path} className="flex items-center gap-2">
                                <button
                                  onClick={() => navigateToFolder(path)}
                                  className="text-cyber-purple-400 hover:text-cyber-purple-300 text-sm underline"
                                  aria-label={`Navigate to folder ${folderName}`}
                                >
                                  {folderName}
                                </button>
                                <span className="text-gray-500">/</span>
                              </span>
                            );
                          })}
                          <span className="text-white text-sm font-medium">
                            {currentFolderPath.split(/[/\\]/).pop() || currentFolderPath}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full border border-cyber-purple-500/60 shadow-sm transition-colors"
                  aria-label="Return to home screen"
                >
                  <Home size={18} aria-hidden="true" />
                  <span className="text-sm font-medium">Home</span>
                </button>
                {currentCase && (
                  <button
                    onClick={() => {
                      // #region agent log
                      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:809', message: 'Back button clicked', data: { currentCasePath: currentCase.path, currentCaseName: currentCase.name, hasRestoredCase: hasRestoredCaseRef.current, archiveContextCasePath: archiveContextCase?.path }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }).catch(() => { });
                      // #endregion
                      // Clear both local state and context to prevent restoration
                      setCurrentCase(null);
                      setArchiveContextCase(null);
                      // Reset restoration flag so it can restore in the future if needed
                      hasRestoredCaseRef.current = false;
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full border border-cyber-purple-500/60 shadow-sm transition-colors"
                    aria-label="Go back to cases list"
                  >
                    <ArrowLeft size={18} aria-hidden="true" />
                    <span className="text-sm font-medium">Back</span>
                  </button>
                )}
                {currentCase && currentFolderPath && (
                  <button
                    onClick={goBackToParentFolder}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full border border-cyber-purple-500/60 shadow-sm transition-colors"
                    aria-label={`Go back to ${folderNavigationStack.length > 0 && folderNavigationStack[folderNavigationStack.length - 1] !== currentCase.path ? 'parent folder' : 'case'}`}
                  >
                    <ArrowLeft size={18} aria-hidden="true" />
                    <span className="text-sm font-medium">
                      Back to {folderNavigationStack.length > 0 && folderNavigationStack[folderNavigationStack.length - 1] !== currentCase.path ? 'Parent' : 'Case'}
                    </span>
                  </button>
                )}
              </div>
              <ActionToolbar />
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Progress Bar */}
          {isExtracting && progress && (
            <div className="px-8 pt-6 pb-4">
              <ProgressBar progress={progress} statusMessage={statusMessage} />
            </div>
          )}

          {/* Enhanced Toolbar */}
          <div className="relative z-50 px-6 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-cyber-purple-400/20 bg-gray-900/30 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Action Buttons Group */}
              <div className="flex items-center gap-3 sm:gap-4">
                {!currentCase && (
                  <motion.button
                    onClick={() => setShowCaseDialog(true)}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative overflow-hidden group flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-br from-purple-600/90 via-purple-500/90 to-cyan-600/90 hover:from-purple-600 hover:via-purple-500 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 border border-purple-400/30"
                    aria-label="Create new case file"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative flex items-center gap-2.5">
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm"></div>
                        <FolderPlus size={18} className="relative z-10" />
                      </div>
                      <span className="relative z-10 text-sm sm:text-base">Start Case File</span>
                    </div>
                  </motion.button>
                )}

                {currentCase && (
                  <>
                    <motion.button
                      onClick={handleAddFiles}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative overflow-hidden group flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-br from-purple-600/90 via-purple-500/90 to-cyan-600/90 hover:from-purple-600 hover:via-purple-500 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 border border-purple-400/30"
                      aria-label="Add files to case"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <div className="relative flex items-center gap-2.5">
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm"></div>
                          <Upload size={18} className="relative z-10" />
                        </div>
                        <span className="relative z-10 text-sm sm:text-base">Add Files</span>
                      </div>
                    </motion.button>
                    <motion.button
                      onClick={() => setShowCreateFolderDialog(true)}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative overflow-hidden group flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-br from-purple-600/90 via-purple-500/90 to-cyan-600/90 hover:from-purple-600 hover:via-purple-500 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 border border-purple-400/30"
                      aria-label="Create new folder"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <div className="relative flex items-center gap-2.5">
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm"></div>
                          <FolderPlus size={18} className="relative z-10" />
                        </div>
                        <span className="relative z-10 text-sm sm:text-base">+ Folder</span>
                      </div>
                    </motion.button>
                  </>
                )}
              </div>

              {/* Search Bar - Enhanced */}
              <div className="flex-1 min-w-[200px] max-w-md">
                <ArchiveSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={currentCase ? 'Search files...' : 'Search cases...'}
                  tags={tags}
                  selectedTagId={selectedTagId}
                  onTagSelect={setSelectedTagId}
                />
              </div>

              {/* Switch Vault Directory - Enhanced */}
              <motion.button
                onClick={() => setShowDriveDialog(true)}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden group flex items-center gap-2.5 px-4 sm:px-5 py-2.5 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-xl border-2 border-gray-700/50 hover:border-cyber-purple-400/60 transition-all duration-300 font-medium shadow-md hover:shadow-lg hover:shadow-cyber-purple-500/20 backdrop-blur-sm"
                aria-label="Switch vault directory"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/5 group-hover:via-purple-600/3 group-hover:to-cyan-600/5 transition-all duration-500"></div>
                <div className="relative flex items-center gap-2.5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <FolderOpen size={16} className="relative z-10 text-gray-300 group-hover:text-cyber-purple-400 transition-colors" />
                  </div>
                  <span className="relative z-10 text-sm sm:text-base text-gray-300 group-hover:text-white transition-colors">Switch Vault</span>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div
            ref={dropZoneRef}
            className={`relative z-0 flex-1 overflow-y-auto px-8 pb-8 ${isDragging ? 'bg-cyber-purple-500/20 border-2 border-cyber-purple-500 border-dashed rounded-lg m-4' : ''}`}
          >
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-6">
                <div className="inline-flex p-6 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 rounded-2xl border-2 border-cyber-cyan-400/30">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan-400"></div>
                </div>
                <p className="text-gray-300 text-lg">Loading...</p>
              </div>
            </div>
          ) : currentCase ? (
            <>
              {/* Case Description */}
              {currentCase.description && !currentFolderPath && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="mb-6 p-4 bg-gray-800/50 border border-cyber-purple-500/30 rounded-lg backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyber-purple-400"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {currentCase.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Unified Grid: Folders and Files in Backend Order */}
              {/* Group folders with their PDFs so folders appear above PDFs in the same column */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                <AnimatePresence>
                  {(() => {
                    // Check if we're inside a folder
                    // When inside an extraction folder, PDFs should not show extraction options and no spacers needed
                    const isInsideFolder = !!currentFolderPath;

                    // Group folders with their associated PDFs so they appear stacked vertically
                    // This ensures folders stay above their PDFs in the same column when new files are added
                    // Skip grouping when inside a folder (folders don't appear inside folders)
                    if (isInsideFolder) {
                      // Inside a folder: render files normally without grouping or spacers
                      return files.map((item) => {
                        if (item.isFolder) {
                          // Use RegularFolder for folders inside folders (full-size, supports drag-and-drop)
                          // Only use ExtractionFolder if it's actually an extraction folder
                          if (item.folderType === 'extraction') {
                            return (
                              <ExtractionFolder
                                key={item.path}
                                folder={item}
                                isExtracting={isExtracting && extractingFolderPath === item.path}
                                onClick={() => openFolder(item.path)}
                                onDelete={() => {
                                  setFolderToDelete(item);
                                  setShowDeleteFolderDialog(true);
                                }}
                                onRename={() => {
                                  setFileToRename(item);
                                  setShowRenameDialog(true);
                                }}
                                onEditBackground={() => updateFolderBackgroundImage(item.path)}
                              />
                            );
                          } else {
                            // Regular folder - use RegularFolder component with drag-and-drop support
                            return (
                              <RegularFolder
                                key={item.path}
                                folder={item}
                                onClick={() => openFolder(item.path)}
                                onDelete={() => {
                                  setFolderToDelete(item);
                                  setShowDeleteFolderDialog(true);
                                }}
                                onRename={() => {
                                  setFileToRename(item);
                                  setShowRenameDialog(true);
                                }}
                                onEditBackground={() => updateFolderBackgroundImage(item.path)}
                                onDragOver={(e) => {
                                  // #region agent log
                                  if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:578', message: 'onDragOver: Dragging over folder (inside folder)', data: { folderPath: item.path, folderName: item.name, dataTransferTypes: Array.from(e.dataTransfer.types), draggedFilePath: draggedFile?.path, draggedFileName: draggedFile?.name, hasDraggedFile: !!draggedFile }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }).catch(() => { });
                                  // #endregion
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.dataTransfer.dropEffect = 'move';
                                  const hasFileData = e.dataTransfer.types.includes('text/plain') || draggedFile;
                                  if (hasFileData) {
                                    const filePath = draggedFile?.path;
                                    if (filePath && filePath !== item.path) {
                                      setDragOverFolder(item.path);
                                      // #region agent log
                                      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:590', message: 'onDragOver: Setting dragOverFolder (inside folder)', data: { folderPath: item.path, filePath }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }).catch(() => { });
                                      // #endregion
                                    }
                                  }
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverFolder(null);
                                }}
                                onDrop={(e) => {
                                  // #region agent log
                                  if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:600', message: 'onDrop: Drop event fired (inside folder)', data: { folderPath: item.path, folderName: item.name, dataTransferTypes: Array.from(e.dataTransfer.types), draggedFilePath: draggedFile?.path, draggedFileName: draggedFile?.name, hasDraggedFile: !!draggedFile }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }).catch(() => { });
                                  // #endregion
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverFolder(null);

                                  const filePathFromData = e.dataTransfer.getData('text/plain');
                                  const filePath = filePathFromData || draggedFile?.path;

                                  // #region agent log
                                  if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:610', message: 'onDrop: File path extracted (inside folder)', data: { filePathFromData, filePathFromDataLength: filePathFromData?.length || 0, draggedFilePath: draggedFile?.path, finalFilePath: filePath, folderPath: item.path, isValid: !!(filePath && filePath !== item.path) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }).catch(() => { });
                                  // #endregion

                                  logger.log('onDrop: File dropped on folder (inside folder)', {
                                    filePath,
                                    folderPath: item.path,
                                    fromDataTransfer: !!filePathFromData,
                                    fromState: !!draggedFile
                                  });

                                  if (filePath && filePath !== item.path) {
                                    // #region agent log
                                    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:622', message: 'onDrop: Calling handleMoveFileToFolder (inside folder)', data: { filePath, folderPath: item.path }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
                                    // #endregion
                                    handleMoveFileToFolder(filePath, item.path);
                                    setDraggedFile(null);
                                  } else {
                                    // #region agent log
                                    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:627', message: 'onDrop: Invalid drop - skipping (inside folder)', data: { filePath, folderPath: item.path, reason: !filePath ? 'noFilePath' : filePath === item.path ? 'samePath' : 'unknown' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
                                    // #endregion
                                    logger.warn('onDrop: Invalid drop (inside folder)', { filePath, folderPath: item.path });
                                  }
                                }}
                                isDragOver={dragOverFolder === item.path}
                              />
                            );
                          }
                        } else {
                          // Inside folder: don't show extraction for PDFs (they're already extracted)
                          return (
                            <ArchiveFileItem
                              key={item.path}
                              file={item}
                              onClick={() => handleFileClick(item)}
                              onDelete={async () => {
                                // Close file viewer if this file is currently open
                                if (selectedFile?.path === item.path) {
                                  setSelectedFile(null);
                                  // Small delay to ensure viewer closes and releases file handle
                                  await new Promise(resolve => setTimeout(resolve, 100));
                                }
                                await deleteFile(item.path);
                              }}
                              onExtract={undefined} // No extraction inside folders
                              onRunAudit={item.type === 'pdf' ? () => handleRunPDFAudit(item) : undefined}
                              onRename={() => {
                                setFileToRename(item);
                                setShowRenameDialog(true);
                              }}
                              onDragStart={(file) => setDraggedFile(file)}
                              onDragEnd={() => setDraggedFile(null)}
                              caseTag={item.categoryTagId ? getTagById(item.categoryTagId) : null}
                              onTagClick={() => {
                                console.log('[ArchivePage] onTagClick for file:', { name: item.name, path: item.path, categoryTagId: item.categoryTagId });
                                handleFileTagClick(item.path);
                              }}
                            />
                          );
                        }
                      });
                    }

                    const groupedItems: Array<{ type: 'group' | 'single'; items: ArchiveFile[] }> = [];
                    const processedPaths = new Set<string>();

                    // Build complete map first (all folders for all PDFs)
                    const pdfToFoldersMap = new Map<string, ArchiveFile[]>();
                    const pdfFiles = files.filter(f => !f.isFolder && f.type === 'pdf');

                    // First pass: Collect ALL folders for each PDF
                    files.forEach((item) => {
                      if (item.isFolder && item.parentPdfName) {
                        const associatedPdf = pdfFiles.find(pdf =>
                          pdf.name.toLowerCase() === item.parentPdfName!.toLowerCase()
                        );
                        if (associatedPdf) {
                          const pdfKey = associatedPdf.path;
                          if (!pdfToFoldersMap.has(pdfKey)) {
                            pdfToFoldersMap.set(pdfKey, []);
                          }
                          pdfToFoldersMap.get(pdfKey)!.push(item);
                        }
                      }
                    });

                    // Second pass: Create groups in backend order
                    // Process PDFs first (which have folders before them in backend order)
                    // This ensures all folders for a PDF are collected before creating the group
                    files.forEach((item) => {
                      if (processedPaths.has(item.path)) return;

                      if (item.type === 'pdf' && !processedPaths.has(item.path)) {
                        // Check if this PDF has unprocessed folders
                        const foldersForPdf = (pdfToFoldersMap.get(item.path) || []).filter(
                          folder => !processedPaths.has(folder.path)
                        );

                        if (foldersForPdf.length > 0) {
                          // Sort folders by backend order (their position in the original array)
                          const sortedFolders = foldersForPdf.sort((a, b) => {
                            const indexA = files.findIndex(f => f.path === a.path);
                            const indexB = files.findIndex(f => f.path === b.path);
                            return indexA - indexB;
                          });

                          // Group: folders first, then PDF
                          groupedItems.push({
                            type: 'group',
                            items: [...sortedFolders, item]
                          });
                          sortedFolders.forEach(folder => processedPaths.add(folder.path));
                          processedPaths.add(item.path);
                        } else {
                          // Standalone PDF
                          groupedItems.push({ type: 'single', items: [item] });
                          processedPaths.add(item.path);
                        }
                      } else if (item.isFolder && item.parentPdfName) {
                        // Folder with parentPdfName but PDF not found or already processed
                        // This shouldn't happen if backend ordering is correct, but handle gracefully
                        const associatedPdf = pdfFiles.find(pdf =>
                          pdf.name.toLowerCase() === item.parentPdfName!.toLowerCase()
                        );
                        if (!associatedPdf || processedPaths.has(associatedPdf.path)) {
                          // Orphaned folder or PDF already grouped - render as single
                          groupedItems.push({ type: 'single', items: [item] });
                          processedPaths.add(item.path);
                        }
                        // If PDF exists and not processed, it will be handled when we reach the PDF
                      } else if (item.isFolder && !item.parentPdfName) {
                        // Regular folder without parent PDF
                        groupedItems.push({ type: 'single', items: [item] });
                        processedPaths.add(item.path);
                      } else if (!item.isFolder && item.type !== 'pdf') {
                        // Non-PDF file
                        groupedItems.push({ type: 'single', items: [item] });
                        processedPaths.add(item.path);
                      }
                    });

                    return groupedItems.map((group, groupIndex) => {
                      if (group.type === 'group') {
                        // Render folder and PDF stacked vertically
                        return (
                          <div key={`group-${groupIndex}`} className="flex flex-col gap-4">
                            {group.items.map((item) => {
                              if (item.isFolder) {
                                // Use RegularFolder for regular folders, ExtractionFolder for extraction folders
                                if (item.folderType === 'case' || (!item.folderType && !item.parentPdfName)) {
                                  return (
                                    <div key={item.path} className="flex flex-col gap-4">
                                      {/* Invisible spacer matching folder height to align with PDFs */}
                                      <div className="invisible rounded-lg border-2 border-transparent p-6">
                                        <div className="flex flex-col items-center gap-3">
                                          <div className="w-16 h-16" />
                                          <div className="h-5 w-full" />
                                        </div>
                                      </div>
                                      <RegularFolder
                                        folder={item}
                                        onClick={() => openFolder(item.path)}
                                        onDelete={() => {
                                          setFolderToDelete(item);
                                          setShowDeleteFolderDialog(true);
                                        }}
                                        onRename={() => {
                                          setFileToRename(item);
                                          setShowRenameDialog(true);
                                        }}
                                        onEditBackground={() => updateFolderBackgroundImage(item.path)}
                                        onDragOver={(e) => {
                                          // #region agent log
                                          if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:695', message: 'onDragOver: Dragging over folder', data: { folderPath: item.path, folderName: item.name, dataTransferTypes: Array.from(e.dataTransfer.types), draggedFilePath: draggedFile?.path, draggedFileName: draggedFile?.name, hasDraggedFile: !!draggedFile }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }).catch(() => { });
                                          // #endregion
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Set drop effect to allow drop
                                          e.dataTransfer.dropEffect = 'move';
                                          // Check if there's a file being dragged (can't read data during dragOver, only check types)
                                          const hasFileData = e.dataTransfer.types.includes('text/plain') || draggedFile;
                                          if (hasFileData) {
                                            const filePath = draggedFile?.path;
                                            if (filePath && filePath !== item.path) {
                                              setDragOverFolder(item.path);
                                              // #region agent log
                                              if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:706', message: 'onDragOver: Setting dragOverFolder', data: { folderPath: item.path, filePath }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }).catch(() => { });
                                              // #endregion
                                            }
                                          }
                                        }}
                                        onDragLeave={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDragOverFolder(null);
                                        }}
                                        onDrop={(e) => {
                                          // #region agent log
                                          if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:714', message: 'onDrop: Drop event fired', data: { folderPath: item.path, folderName: item.name, dataTransferTypes: Array.from(e.dataTransfer.types), draggedFilePath: draggedFile?.path, draggedFileName: draggedFile?.name, hasDraggedFile: !!draggedFile }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }).catch(() => { });
                                          // #endregion
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDragOverFolder(null);

                                          // Get file path from dataTransfer or state
                                          const filePathFromData = e.dataTransfer.getData('text/plain');
                                          const filePath = filePathFromData || draggedFile?.path;

                                          // #region agent log
                                          if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:723', message: 'onDrop: File path extracted', data: { filePathFromData, filePathFromDataLength: filePathFromData?.length || 0, draggedFilePath: draggedFile?.path, finalFilePath: filePath, folderPath: item.path, isValid: !!(filePath && filePath !== item.path) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }).catch(() => { });
                                          // #endregion

                                          logger.log('onDrop: File dropped on folder', {
                                            filePath,
                                            folderPath: item.path,
                                            fromDataTransfer: !!filePathFromData,
                                            fromState: !!draggedFile
                                          });

                                          if (filePath && filePath !== item.path) {
                                            // #region agent log
                                            if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:731', message: 'onDrop: Calling handleMoveFileToFolder', data: { filePath, folderPath: item.path }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
                                            // #endregion
                                            handleMoveFileToFolder(filePath, item.path);
                                            setDraggedFile(null);
                                          } else {
                                            // #region agent log
                                            if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:735', message: 'onDrop: Invalid drop - skipping', data: { filePath, folderPath: item.path, reason: !filePath ? 'noFilePath' : filePath === item.path ? 'samePath' : 'unknown' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
                                            // #endregion
                                            logger.warn('onDrop: Invalid drop', { filePath, folderPath: item.path });
                                          }
                                        }}
                                        isDragOver={dragOverFolder === item.path}
                                      />
                                    </div>
                                  );
                                } else {
                                  return (
                                    <ExtractionFolder
                                      key={item.path}
                                      folder={item}
                                      isExtracting={isExtracting && extractingFolderPath === item.path}
                                      onClick={() => openFolder(item.path)}
                                      onDelete={() => {
                                        setFolderToDelete(item);
                                        setShowDeleteFolderDialog(true);
                                      }}
                                      onRename={() => {
                                        setFileToRename(item);
                                        setShowRenameDialog(true);
                                      }}
                                    />
                                  );
                                }
                              } else {
                                return (
                                  <ArchiveFileItem
                                    key={item.path}
                                    file={item}
                                    onClick={() => handleFileClick(item)}
                                    onDelete={async () => {
                                      // Close file viewer if this file is currently open
                                      if (selectedFile?.path === item.path) {
                                        setSelectedFile(null);
                                        // Small delay to ensure viewer closes and releases file handle
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                      }
                                      await deleteFile(item.path);
                                    }}
                                    onExtract={item.type === 'pdf' ? () => handleExtractPDF(item) : undefined}
                                    onRunAudit={item.type === 'pdf' ? () => handleRunPDFAudit(item) : undefined}
                                    onRename={() => {
                                      setFileToRename(item);
                                      setShowRenameDialog(true);
                                    }}
                                    onDragStart={(file) => setDraggedFile(file)}
                                    onDragEnd={() => setDraggedFile(null)}
                                    caseTag={item.categoryTagId ? getTagById(item.categoryTagId) : null}
                                    onTagClick={() => handleFileTagClick(item.path)}
                                  />
                                );
                              }
                            })}
                          </div>
                        );
                      } else {
                        // Single item
                        const item = group.items[0];
                        if (item.isFolder) {
                          // Use RegularFolder for regular folders, ExtractionFolder for extraction folders
                          if (item.folderType === 'case' || (!item.folderType && !item.parentPdfName)) {
                            return (
                              <div key={item.path} className="flex flex-col gap-4">
                                {/* Invisible spacer matching folder height to align with PDFs */}
                                <div className="invisible rounded-lg border-2 border-transparent p-6">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16" />
                                    <div className="h-5 w-full" />
                                  </div>
                                </div>
                                <RegularFolder
                                  folder={item}
                                  onClick={() => openFolder(item.path)}
                                  onDelete={() => {
                                    setFolderToDelete(item);
                                    setShowDeleteFolderDialog(true);
                                  }}
                                  onRename={() => {
                                    setFileToRename(item);
                                    setShowRenameDialog(true);
                                  }}
                                  onEditBackground={() => updateFolderBackgroundImage(item.path)}
                                  onDragOver={(e) => {
                                    // #region agent log
                                    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:813', message: 'onDragOver: Dragging over folder (single)', data: { folderPath: item.path, folderName: item.name, dataTransferTypes: Array.from(e.dataTransfer.types), draggedFilePath: draggedFile?.path, draggedFileName: draggedFile?.name, hasDraggedFile: !!draggedFile }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }).catch(() => { });
                                    // #endregion
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Set drop effect to allow drop
                                    e.dataTransfer.dropEffect = 'move';
                                    // Check if there's a file being dragged (can't read data during dragOver, only check types)
                                    const hasFileData = e.dataTransfer.types.includes('text/plain') || draggedFile;
                                    if (hasFileData) {
                                      const filePath = draggedFile?.path;
                                      if (filePath && filePath !== item.path) {
                                        setDragOverFolder(item.path);
                                        // #region agent log
                                        if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:825', message: 'onDragOver: Setting dragOverFolder (single)', data: { folderPath: item.path, filePath }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }).catch(() => { });
                                        // #endregion
                                      }
                                    }
                                  }}
                                  onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverFolder(null);
                                  }}
                                  onDrop={(e) => {
                                    // #region agent log
                                    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:832', message: 'onDrop: Drop event fired (single)', data: { folderPath: item.path, folderName: item.name, dataTransferTypes: Array.from(e.dataTransfer.types), draggedFilePath: draggedFile?.path, draggedFileName: draggedFile?.name, hasDraggedFile: !!draggedFile }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }).catch(() => { });
                                    // #endregion
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverFolder(null);

                                    // Get file path from dataTransfer or state
                                    const filePathFromData = e.dataTransfer.getData('text/plain');
                                    const filePath = filePathFromData || draggedFile?.path;

                                    // #region agent log
                                    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:841', message: 'onDrop: File path extracted (single)', data: { filePathFromData, filePathFromDataLength: filePathFromData?.length || 0, draggedFilePath: draggedFile?.path, finalFilePath: filePath, folderPath: item.path, isValid: !!(filePath && filePath !== item.path) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }).catch(() => { });
                                    // #endregion

                                    logger.log('onDrop: File dropped on folder', {
                                      filePath,
                                      folderPath: item.path,
                                      fromDataTransfer: !!filePathFromData,
                                      fromState: !!draggedFile
                                    });

                                    if (filePath && filePath !== item.path) {
                                      // #region agent log
                                      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:849', message: 'onDrop: Calling handleMoveFileToFolder (single)', data: { filePath, folderPath: item.path }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
                                      // #endregion
                                      handleMoveFileToFolder(filePath, item.path);
                                      setDraggedFile(null);
                                    } else {
                                      // #region agent log
                                      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchivePage.tsx:853', message: 'onDrop: Invalid drop - skipping (single)', data: { filePath, folderPath: item.path, reason: !filePath ? 'noFilePath' : filePath === item.path ? 'samePath' : 'unknown' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }).catch(() => { });
                                      // #endregion
                                      logger.warn('onDrop: Invalid drop', { filePath, folderPath: item.path });
                                    }
                                  }}
                                  isDragOver={dragOverFolder === item.path}
                                />
                              </div>
                            );
                          } else {
                            return (
                              <ExtractionFolder
                                key={item.path}
                                folder={item}
                                isExtracting={isExtracting && extractingFolderPath === item.path}
                                onClick={() => openFolder(item.path)}
                                onDelete={() => {
                                  setFolderToDelete(item);
                                  setShowDeleteFolderDialog(true);
                                }}
                                onRename={() => {
                                  setFileToRename(item);
                                  setShowRenameDialog(true);
                                }}
                                onEditBackground={() => updateFolderBackgroundImage(item.path)}
                              />
                            );
                          }
                        } else if (item.type === 'pdf') {
                          // Standalone PDF: Add spacer above to align with PDFs in groups
                          // The spacer matches the height of a folder (p-6 + icon + text) + gap-4
                          return (
                            <div key={item.path} className="flex flex-col gap-4">
                              {/* Invisible spacer matching folder height to align PDFs */}
                              <div className="invisible rounded-lg border-2 border-transparent p-6">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-16 h-16" />
                                  <div className="h-5 w-full" />
                                </div>
                              </div>
                              <ArchiveFileItem
                                file={item}
                                onClick={() => handleFileClick(item)}
                                onDelete={async () => {
                                  // Close file viewer if this file is currently open
                                  if (selectedFile?.path === item.path) {
                                    setSelectedFile(null);
                                    // Small delay to ensure viewer closes and releases file handle
                                    await new Promise(resolve => setTimeout(resolve, 100));
                                  }
                                  await deleteFile(item.path);
                                }}
                                onExtract={() => handleExtractPDF(item)}
                                onRunAudit={item.type === 'pdf' ? () => handleRunPDFAudit(item) : undefined}
                                onRename={() => {
                                  setFileToRename(item);
                                  setShowRenameDialog(true);
                                }}
                                onDragStart={(file) => setDraggedFile(file)}
                                onDragEnd={() => setDraggedFile(null)}
                                caseTag={item.categoryTagId ? getTagById(item.categoryTagId) : null}
                                onTagClick={() => handleFileTagClick(item.path)}
                              />
                            </div>
                          );
                        } else {
                          // Non-PDF file: Add spacer above to align with PDFs
                          // The spacer matches the height of a folder (p-6 + icon + text) + gap-4
                          return (
                            <div key={item.path} className="flex flex-col gap-4">
                              {/* Invisible spacer matching folder height to align with PDFs */}
                              <div className="invisible rounded-lg border-2 border-transparent p-6">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-16 h-16" />
                                  <div className="h-5 w-full" />
                                </div>
                              </div>
                              <ArchiveFileItem
                                file={item}
                                onClick={() => handleFileClick(item)}
                                onDelete={async () => {
                                  // Close file viewer if this file is currently open
                                  if (selectedFile?.path === item.path) {
                                    setSelectedFile(null);
                                    // Small delay to ensure viewer closes and releases file handle
                                    await new Promise(resolve => setTimeout(resolve, 100));
                                  }
                                  await deleteFile(item.path);
                                }}
                                onExtract={undefined}
                                onRunAudit={undefined}
                                onRename={() => {
                                  setFileToRename(item);
                                  setShowRenameDialog(true);
                                }}
                                onDragStart={(file) => setDraggedFile(file)}
                                onDragEnd={() => setDraggedFile(null)}
                                caseTag={item.categoryTagId ? getTagById(item.categoryTagId) : null}
                                onTagClick={() => handleFileTagClick(item.path)}
                              />
                            </div>
                          );
                        }
                      }
                    });
                  })()}
                </AnimatePresence>
              </div>
            </>
          ) : (
            // Cases Grid
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              <AnimatePresence>
                {cases.map((caseItem) => {
                  const casePath = caseItem.path;
                  const caseName = caseItem.name;
                  // Capture values for debug log to avoid type inference issues
                  const currentCasePathValue = currentCase ? (currentCase as { path: string }).path : null;
                  const archiveContextCasePathValue = archiveContextCase ? (archiveContextCase as { path: string }).path : null;
                  return (
                    <CaseFolder
                      key={casePath}
                      caseItem={caseItem}
                      isExtracting={isExtracting && extractingCasePath === casePath}
                      onClick={() => {
                        // #region agent log
                        if (window.electronAPI?.debugLog) {
                          window.electronAPI.debugLog({ location: 'ArchivePage.tsx:1574', message: 'Case clicked', data: { casePath, caseName, currentCasePath: currentCasePathValue, hasRestoredCase: hasRestoredCaseRef.current, archiveContextCasePath: archiveContextCasePathValue }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }).catch(() => { });
                        }
                        // #endregion
                        setCurrentCase(caseItem);
                      }}
                      onDelete={() => deleteCase(casePath)}
                      onRename={() => {
                        setFileToRename({
                          name: caseName,
                          path: casePath,
                          size: 0,
                          modified: 0,
                          type: 'other',
                          isFolder: true
                        });
                        setShowRenameDialog(true);
                      }}
                      onEditBackground={() => updateCaseBackgroundImage(casePath)}
                      onTagClick={() => handleTagClick(casePath)}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Empty state */}
          {!loading && (
            <>
              {!currentCase && cases.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="inline-flex p-8 bg-gray-800/50 rounded-2xl border border-cyber-purple-400/20 mb-6">
                    <FolderOpen className="w-20 h-20 text-cyber-purple-400/50" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-300 mb-2">No cases yet</h3>
                  <p className="text-gray-400 text-lg mb-6">Create your first case file to get started</p>
                  <button
                    onClick={() => setShowCaseDialog(true)}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 hover:from-cyan-700 hover:via-purple-700 hover:to-cyan-700 rounded-lg font-semibold text-white text-base transition-all shadow-lg hover:shadow-cyan-500/50 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                    aria-label="Create your first case"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <span className="relative z-10">Create Your First Case</span>
                  </button>
                </div>
              )}
              {currentCase && files.filter(f => !f.isFolder).length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="inline-flex p-8 bg-gray-800/50 rounded-2xl border border-cyber-purple-400/20 mb-6">
                    <FileText className="w-20 h-20 text-cyber-purple-400/50" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-300 mb-2">No files in this case</h3>
                  <p className="text-gray-400 text-lg mb-6">Add files to get started organizing your case</p>
                  <button
                    onClick={handleAddFiles}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 hover:from-cyan-700 hover:via-purple-700 hover:to-cyan-700 rounded-lg font-semibold text-white text-base transition-all shadow-lg hover:shadow-cyan-500/50 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                    aria-label="Add files to this case"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <span className="relative z-10">Add Files</span>
                  </button>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ArchiveDriveDialog
        isOpen={showDriveDialog}
        onClose={() => setShowDriveDialog(false)}
        onConfirm={handleSelectDrive}
      />

      <CaseNameDialog
        isOpen={showCaseDialog}
        onClose={() => setShowCaseDialog(false)}
        onConfirm={handleCreateCase}
      />

      <CreateFolderDialog
        isOpen={showCreateFolderDialog}
        onClose={() => setShowCreateFolderDialog(false)}
        onConfirm={handleCreateFolder}
      />

      <FolderSelectionDialog
        isOpen={showFolderSelectionDialog}
        onClose={() => {
          setShowFolderSelectionDialog(false);
          // Only clear selectedFileForExtraction if user is canceling, not when proceeding
          // The handleFolderSelection and handleMakeNewFolder functions handle dialog transitions
          setSelectedFileForExtraction(null);
        }}
        onSelectDirectory={handleFolderSelection}
        onMakeNewFolder={handleMakeNewFolder}
      />

      <ExtractionFolderDialog
        isOpen={showExtractionDialog}
        onClose={() => {
          setShowExtractionDialog(false);
          // Only clear selectedFileForExtraction if user explicitly cancels
          // Don't clear it during normal flow transitions
          setSelectedFileForExtraction(null);
        }}
        onConfirm={handleExtractionConfirm}
      />

      <SaveParentDialog
        isOpen={showSaveParentDialog}
        onClose={() => {
          setShowSaveParentDialog(false);
          setPendingExtraction(null);
          setSelectedFileForExtraction(null);
        }}
        onConfirm={handleSaveParentConfirm}
      />

      <DeleteFolderConfirmDialog
        isOpen={showDeleteFolderDialog}
        folderName={folderToDelete?.name || ''}
        onClose={() => {
          setShowDeleteFolderDialog(false);
          setFolderToDelete(null);
        }}
        onConfirm={async () => {
          if (folderToDelete) {
            // Close file viewer if we're deleting the folder we're currently viewing
            if (selectedFile && selectedFile.path.startsWith(folderToDelete.path)) {
              setSelectedFile(null);
              // Small delay to ensure viewer closes and releases file handles
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            await deleteFile(folderToDelete.path, true);
            setFolderToDelete(null);
          }
        }}
      />

      <RenameFileDialog
        isOpen={showRenameDialog}
        currentName={fileToRename?.name || ''}
        onClose={() => {
          setShowRenameDialog(false);
          setFileToRename(null);
        }}
        onConfirm={async (newName) => {
          if (fileToRename) {
            // Close dialog immediately for better UX
            setShowRenameDialog(false);
            const filePath = fileToRename.path;
            setFileToRename(null);
            // Perform rename asynchronously
            renameFile(filePath, newName).catch((error) => {
              logger.error('Rename failed:', error);
            });
          }
        }}
      />

      {/* File Viewer */}
      {selectedFile && !selectedFile.isFolder && (
        <ArchiveFileViewer
          file={selectedFile}
          files={files.filter(f => !f.isFolder)}
          onClose={() => {
            setSelectedFile(null);
            setInitialPage(undefined);
            // Clear pending bookmark when viewer is closed to prevent re-opening
            setPendingBookmarkOpen(null);
            // Clear sessionStorage bookmark if it exists
            sessionStorage.removeItem('pending-bookmark-open');
          }}
          onNext={fileViewerIndex < files.filter(f => !f.isFolder).length - 1 ? handleNextFile : undefined}
          onPrevious={fileViewerIndex > 0 ? handlePreviousFile : undefined}
          initialPage={initialPage}
          onInitialPageApplied={() => {
            // Clear initialPage after it's been applied so it doesn't interfere with navigation
            setInitialPage(undefined);
          }}
        />
      )}

      <CategoryTagSelector
        isOpen={showTagSelector}
        onClose={() => {
          setShowTagSelector(false);
          setTagSelectorCasePath(null);
          setTagSelectorFilePath(null);
        }}
        onSelect={handleTagSelect}
        tags={tags}
        onCreateTag={createTag}
        onDeleteTag={deleteTag}
        selectedTagId={
          tagSelectorFilePath
            ? (files.find(f => f.path === tagSelectorFilePath)?.categoryTagId || null)
            : tagSelectorCasePath
              ? (cases.find(c => c.path === tagSelectorCasePath)?.categoryTagId || currentCase?.categoryTagId || null)
              : (currentCase?.categoryTagId || null)
        }
      />

      <SecurityCheckerModal
        isOpen={showSecurityChecker}
        onClose={() => {
          setShowSecurityChecker(false);
          setPdfPathForAudit(null);
        }}
        initialPdfPath={pdfPathForAudit}
        caseFolderPath={currentCase?.path || null}
        onReportSaved={handleReportSaved}
      />

      <PDFExtractionModal
        isOpen={showPDFExtraction}
        onClose={() => {
          setShowPDFExtraction(false);
          setPdfPathForExtraction(null);
        }}
        initialPdfPath={pdfPathForExtraction}
        caseFolderPath={currentCase?.path || null}
        onExtractionComplete={() => {
          if (currentCase) {
            refreshFiles();
          }
        }}
      />
    </div>
  );
}

