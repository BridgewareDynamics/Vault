import { useCallback, useEffect, useRef, useState } from 'react';
import { ArchiveFile, ArchiveCase } from '../../types';
import { logger } from '../../utils/logger';
import { useToast } from '../Toast/ToastContext';

interface FindFileResult {
  casePath: string;
  folderPath: string | null;
  file: ArchiveFile;
}

interface PendingBookmarkOpen {
  pdfPath: string;
  pageNumber: number;
  timestamp?: number;
}

interface UseArchiveViewerParams {
  files: ArchiveFile[];
  loading: boolean;
  currentCase: ArchiveCase | null;
  currentFolderPath: string | null;
  cases: ArchiveCase[];
  archiveContextCase: ArchiveCase | null;
  setCurrentCase: (caseItem: ArchiveCase | null) => void;
  setArchiveContextCase: (caseItem: ArchiveCase | null) => void;
  openFolder: (folderPath: string) => void;
  navigateToFolder: (targetPath: string) => void;
  goBackToCase: () => void;
  findFileInArchive: (pdfPath: string) => Promise<FindFileResult | null>;
}

/**
 * Owns the Archive file-viewer "coordination" state and the bookmark/navigation
 * side effects that decide which file/page the viewer shows. Extracted from
 * ArchivePage so the page component can stay focused on layout/composition.
 *
 * Behavior is preserved verbatim from the previous inline implementation; only
 * the location of the code changed.
 */
export function useArchiveViewer({
  files,
  loading,
  currentCase,
  currentFolderPath,
  cases,
  archiveContextCase,
  setCurrentCase,
  setArchiveContextCase,
  openFolder,
  navigateToFolder,
  goBackToCase,
  findFileInArchive,
}: UseArchiveViewerParams) {
  const toast = useToast();

  const [selectedFile, setSelectedFile] = useState<ArchiveFile | null>(null);
  const [fileViewerIndex, setFileViewerIndex] = useState(0);
  const [initialPage, setInitialPage] = useState<number | undefined>(undefined);
  const [pendingBookmarkOpen, setPendingBookmarkOpen] = useState<PendingBookmarkOpen | null>(null);
  const [targetFolderPath, setTargetFolderPath] = useState<string | null>(null);

  // Track if we've processed the sessionStorage bookmark (prevents re-processing)
  const hasProcessedSessionBookmarkRef = useRef(false);

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
        logger.error('Failed to parse pending bookmark:', error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- archiveContextCase?.path is intentionally excluded so the bookmark/navigation listeners are not re-bound on context case sync
  }, [files, loading, toast, selectedFile, findFileInArchive, currentCase, currentFolderPath, cases, setCurrentCase, setArchiveContextCase, navigateToFolder, openFolder, goBackToCase]);

  const handleFileClick = useCallback((file: ArchiveFile) => {
    // Don't open folders in the file viewer
    if (file.isFolder) {
      return;
    }
    const index = files.filter(f => !f.isFolder).findIndex(f => f.path === file.path);
    setFileViewerIndex(index);
    setSelectedFile(file);
  }, [files]);

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

  // Compose the viewer close behavior (clears selection + pending bookmark state).
  const closeViewer = useCallback(() => {
    setSelectedFile(null);
    setInitialPage(undefined);
    // Clear pending bookmark when viewer is closed to prevent re-opening
    setPendingBookmarkOpen(null);
    // Clear sessionStorage bookmark if it exists
    sessionStorage.removeItem('pending-bookmark-open');
  }, []);

  return {
    selectedFile,
    setSelectedFile,
    fileViewerIndex,
    initialPage,
    setInitialPage,
    setPendingBookmarkOpen,
    handleFileClick,
    handleNextFile,
    handlePreviousFile,
    closeViewer,
  };
}
