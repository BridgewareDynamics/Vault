import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Home, FolderPlus, Upload, ArrowLeft, FolderOpen } from 'lucide-react';
import { useArchive } from '../../hooks/useArchive';
import { useArchiveExtraction } from '../../hooks/useArchiveExtraction';
import { useToast } from '../Toast/ToastContext';
import { useCategoryTags } from '../../hooks/useCategoryTags';
import { ArchiveSearchBar } from './ArchiveSearchBar';
import { ArchiveGrid } from './ArchiveGrid';
import { ArchiveDialogs } from './ArchiveDialogs';
import { ArchiveViewerHost } from './ArchiveViewerHost';
import { useArchiveViewer } from './useArchiveViewer';
import { ArchiveFile, ArchiveCase } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';
import { ProgressBar } from '../ProgressBar';
import { ActionToolbar } from '../ActionToolbar';
import { logger } from '../../utils/logger';
import { useArchiveContext } from '../../contexts/ArchiveContext';
import { useSettingsContext } from '../../utils/settingsContext';
import { Theme } from '../../types';
import { prefetchArchiveHeavyDeps } from '../../utils/archivePrefetch';

interface ArchivePageProps {
  onBack: () => void;
  onOpenTranscription: (sourcePath: string, casePath: string | null) => void;
}

export function ArchivePage({ onBack, onOpenTranscription }: ArchivePageProps) {
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
    updateCaseDescription,
    refreshFiles,
    refreshCases,
    selectedTagId,
    setSelectedTagId,
    tags,
    getTagById,
    findFileInArchive,
    ensureThumbnailForFile,
  } = useArchive();

  const requestFileThumbnail = useCallback((file: ArchiveFile) => {
    ensureThumbnailForFile(file.path, file.type ?? 'other');
  }, [ensureThumbnailForFile]);

  const { createTag, deleteTag, assignTagToCase, assignTagToFile } = useCategoryTags();

  const { extractPDF, isExtracting, progress, statusMessage, extractingCasePath, extractingFolderPath, cancel: cancelArchiveExtraction } = useArchiveExtraction();
  const toast = useToast();

  useEffect(() => {
    void prefetchArchiveHeavyDeps();
  }, []);
  const { currentCase: archiveContextCase, setCurrentCase: setArchiveContextCase } = useArchiveContext();
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);

  // Track if we've attempted to restore case from context (prevents multiple restorations)
  const hasRestoredCaseRef = useRef(false);
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
      // Verify the case still exists in our cases list
      const caseExists = cases.some(c => c.path === archiveContextCase.path);
      if (caseExists) {
        setCurrentCase(archiveContextCase);
        hasRestoredCaseRef.current = true;
        lastRestoredCasePathRef.current = archiveContextCase.path;
      } else {
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
    // Only sync if values actually differ to prevent unnecessary updates
    if (currentCase !== null) {
      // Only sync if context doesn't already have the same case (by path comparison)
      if (archiveContextCase?.path !== currentCase.path) {
        setArchiveContextCase(currentCase);
      }
    }
    // currentCase null cases require no syncing (context restore handles it)
  }, [currentCase, setArchiveContextCase, archiveContextCase]);

  const [showDriveDialog, setShowDriveDialog] = useState(false);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showFolderSelectionDialog, setShowFolderSelectionDialog] = useState(false);
  const [showExtractionDialog, setShowExtractionDialog] = useState(false);
  const [showSaveParentDialog, setShowSaveParentDialog] = useState(false);
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<ArchiveFile | null>(null);
  const [showDeletePDFDialog, setShowDeletePDFDialog] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState<ArchiveFile | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [fileToRename, setFileToRename] = useState<ArchiveFile | null>(null);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [caseForDescription, setCaseForDescription] = useState<ArchiveCase | null>(null);
  const [selectedFileForExtraction, setSelectedFileForExtraction] = useState<ArchiveFile | null>(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [tagSelectorCasePath, setTagSelectorCasePath] = useState<string | null>(null);
  const [tagSelectorFilePath, setTagSelectorFilePath] = useState<string | null>(null);
  const [showSecurityChecker, setShowSecurityChecker] = useState(false);
  const [pdfPathForAudit, setPdfPathForAudit] = useState<string | null>(null);
  const [showPDFExtraction, setShowPDFExtraction] = useState(false);
  const [pdfPathForExtraction, setPdfPathForExtraction] = useState<string | null>(null);

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<ArchiveFile | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  // Viewer coordination state + bookmark/navigation effects.
  const {
    selectedFile,
    setSelectedFile,
    fileViewerIndex,
    initialPage,
    setInitialPage,
    handleFileClick,
    handleNextFile,
    handlePreviousFile,
    closeViewer,
  } = useArchiveViewer({
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
  });

  // Auto-show vault directory dialog on first open if no vault directory is set
  useEffect(() => {
    // Only show dialog if archiveConfig has been loaded and no vault directory is set
    if (archiveConfig !== null && archiveConfig !== undefined && !archiveConfig.archiveDrive) {
      setShowDriveDialog(true);
    }
  }, [archiveConfig]);

  useEffect(() => {
    const handleRecordingSaved = (event: Event) => {
      const detail = (event as CustomEvent<{ casePath?: string }>).detail;
      if (!currentCase?.path || !detail?.casePath) {
        return;
      }
      const normalizePath = (pathValue: string) => pathValue.replace(/\\/g, '/');
      if (normalizePath(currentCase.path) === normalizePath(detail.casePath)) {
        void refreshFiles();
      }
    };

    window.addEventListener('vault-audio-recording-saved', handleRecordingSaved as EventListener);
    return () => {
      window.removeEventListener('vault-audio-recording-saved', handleRecordingSaved as EventListener);
    };
  }, [currentCase?.path, refreshFiles]);

  // Listen for reattach data from detached PDF extraction window
  useEffect(() => {
    const handleReattach = (event: WindowEventMap['reattach-pdf-extraction-data']) => {
      const data = event.detail;

      // Only handle reattach if caseFolderPath is present (archive usage)
      if (data && data.caseFolderPath) {
        logger.debug('ArchivePage: Received reattach-pdf-extraction-data event with caseFolderPath, opening modal');
        // Set the PDF path from reattach data
        if (data.pdfPath) {
          setPdfPathForExtraction(data.pdfPath);
        }
        // Open the ArchivePage's PDFExtractionModal
        // The modal will automatically restore state from window.__reattachPdfExtractionData
        setShowPDFExtraction(true);
      }
    };

    window.addEventListener('reattach-pdf-extraction-data', handleReattach);

    // Also check for stored data on mount
    const checkStoredData = () => {
      const storedData = window.__reattachPdfExtractionData;
      if (storedData && storedData.caseFolderPath) {
        logger.debug('ArchivePage: Found stored reattach data with caseFolderPath, opening modal');
        if (storedData.pdfPath) {
          setPdfPathForExtraction(storedData.pdfPath);
        }
        setShowPDFExtraction(true);
      }
    };

    // Check after a short delay to ensure component is mounted
    const timeoutId = setTimeout(checkStoredData, 100);

    return () => {
      window.removeEventListener('reattach-pdf-extraction-data', handleReattach);
      clearTimeout(timeoutId);
    };
  }, []);

  // Handle drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
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
      // Only handle external file drops (from file explorer)
      // Internal drags (within app) should be handled by folder drop handlers
      const droppedFiles = Array.from(e.dataTransfer?.files || []);
      const hasExternalFiles = droppedFiles.length > 0;
      const hasInternalDrag = e.dataTransfer?.types?.includes('text/plain') && !hasExternalFiles;

      // If this is an internal drag (no external files), let it propagate to folder handlers
      if (hasInternalDrag && !hasExternalFiles) {
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

  const handleTagClick = useCallback((casePath: string) => {
    setTagSelectorCasePath(casePath);
    setTagSelectorFilePath(null);
    setShowTagSelector(true);
  }, []);

  const handleFileTagClick = useCallback((filePath: string) => {
    setTagSelectorFilePath(filePath);
    setTagSelectorCasePath(null);
    setShowTagSelector(true);
  }, []);

  const handleTagSelect = async (tagId: string | null) => {
    if (tagSelectorFilePath) {
      // Assign tag to specific file
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

  const handleMoveFileToFolder = useCallback(async (filePath: string, folderPath: string) => {
    if (!filePath || !folderPath) {
      logger.warn('handleMoveFileToFolder: Missing filePath or folderPath', { filePath, folderPath });
      return;
    }
    try {
      logger.log('handleMoveFileToFolder: Moving file', { filePath, folderPath });
      await moveFileToFolder(filePath, folderPath);
    } catch (error) {
      logger.error('Failed to move file to folder:', error);
    }
  }, [moveFileToFolder]);

  const handleAddFiles = async () => {
    if (!currentCase) return;
    await addFilesToCase(currentCase.path);
  };

  const handleExtractPDF = useCallback((file: ArchiveFile) => {
    setPdfPathForExtraction(file.path);
    setShowPDFExtraction(true);
  }, []);

  const handleRunPDFAudit = useCallback((file: ArchiveFile) => {
    setPdfPathForAudit(file.path);
    setShowSecurityChecker(true);
  }, []);

  const handleTranscribeMedia = useCallback((file: ArchiveFile) => {
    onOpenTranscription(file.path, currentCase?.path || null);
  }, [onOpenTranscription, currentCase]);

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

  // ---------------------------------------------------------------------------
  // Per-item handlers shared by the grid (hoisted so they stay stable across
  // renders and don't re-inline inside the virtualized grid's render callbacks).
  // ---------------------------------------------------------------------------
  const requestDeleteFolder = useCallback((folder: ArchiveFile) => {
    setFolderToDelete(folder);
    setShowDeleteFolderDialog(true);
  }, []);

  const requestRename = useCallback((file: ArchiveFile) => {
    setFileToRename(file);
    setShowRenameDialog(true);
  }, []);

  const handleRenameCase = useCallback((caseItem: ArchiveCase) => {
    requestRename({
      name: caseItem.name,
      path: caseItem.path,
      size: 0,
      modified: 0,
      type: 'other',
      isFolder: true,
    });
  }, [requestRename]);

  const handleEditCaseDescription = useCallback((caseItem: ArchiveCase) => {
    setCaseForDescription(caseItem);
    setShowDescriptionDialog(true);
  }, []);

  const handleFolderDragOver = useCallback((itemPath: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const hasFileData = e.dataTransfer.types.includes('text/plain') || draggedFile;
    if (hasFileData) {
      const filePath = draggedFile?.path;
      if (filePath && filePath !== itemPath) {
        setDragOverFolder(itemPath);
      }
    }
  }, [draggedFile]);

  const handleFolderDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
  }, []);

  const handleFolderDrop = useCallback((itemPath: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);

    const filePathFromData = e.dataTransfer.getData('text/plain');
    const filePath = filePathFromData || draggedFile?.path;

    logger.log('onDrop: File dropped on folder', {
      filePath,
      folderPath: itemPath,
      fromDataTransfer: !!filePathFromData,
      fromState: !!draggedFile,
    });

    if (filePath && filePath !== itemPath) {
      handleMoveFileToFolder(filePath, itemPath);
      setDraggedFile(null);
    } else {
      logger.warn('onDrop: Invalid drop', { filePath, folderPath: itemPath });
    }
  }, [draggedFile, handleMoveFileToFolder]);

  const handleDragStartFile = useCallback((file: ArchiveFile) => setDraggedFile(file), []);
  const handleDragEndFile = useCallback(() => setDraggedFile(null), []);

  // Direct deletion (non-PDF / inside-folder): close the viewer if the file is open, then delete.
  const handleDeleteFileDirect = useCallback(async (item: ArchiveFile) => {
    if (selectedFile?.path === item.path) {
      setSelectedFile(null);
      // Small delay to ensure viewer closes and releases file handle
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await deleteFile(item.path);
  }, [selectedFile, deleteFile, setSelectedFile]);

  // PDFs go through a confirmation dialog; other files delete directly.
  const handleDeleteFileWithConfirm = useCallback(async (item: ArchiveFile) => {
    if (item.type === 'pdf') {
      setPdfToDelete(item);
      setShowDeletePDFDialog(true);
    } else {
      if (selectedFile?.path === item.path) {
        setSelectedFile(null);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await deleteFile(item.path);
    }
  }, [selectedFile, deleteFile, setSelectedFile]);

  const handleConfirmDeleteFolder = async () => {
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
  };

  const handleConfirmDeletePDF = async (deleteImageFolder: boolean) => {
    if (pdfToDelete) {
      // Close file viewer if this PDF is currently open
      if (selectedFile?.path === pdfToDelete.path) {
        setSelectedFile(null);
        // Small delay to ensure viewer closes and releases file handle
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Find and delete associated extraction folders if checkbox is checked
      if (deleteImageFolder) {
        const pdfName = pdfToDelete.name;
        const associatedFolders = files.filter(
          (file) =>
            file.isFolder &&
            file.parentPdfName &&
            file.parentPdfName.toLowerCase() === pdfName.toLowerCase()
        );

        // Delete all associated extraction folders
        for (const folder of associatedFolders) {
          try {
            // Close file viewer if we're deleting a folder we're currently viewing
            if (selectedFile && selectedFile.path.startsWith(folder.path)) {
              setSelectedFile(null);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            await deleteFile(folder.path, true);
          } catch (error) {
            logger.error(`Failed to delete extraction folder ${folder.path}:`, error);
            // Continue with PDF deletion even if folder deletion fails
          }
        }
      }

      // Delete the PDF file
      await deleteFile(pdfToDelete.path);
      setPdfToDelete(null);
    }
  };

  const handleConfirmRename = async (newName: string) => {
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
  };

  const handleConfirmCaseDescription = async (description: string) => {
    if (caseForDescription) {
      await updateCaseDescription(caseForDescription.path, description);
      setShowDescriptionDialog(false);
      setCaseForDescription(null);
    }
  };

  // Whether the PDF queued for deletion has an associated extraction folder.
  const deletePDFHasExistingFolder = pdfToDelete ? files.some(
    (file) =>
      file.isFolder &&
      file.parentPdfName &&
      pdfToDelete.name &&
      file.parentPdfName.toLowerCase() === pdfToDelete.name.toLowerCase()
  ) : false;

  // Pre-select the active tag for whatever (file/case) the tag selector targets.
  const tagSelectorSelectedTagId =
    tagSelectorFilePath
      ? (files.find(f => f.path === tagSelectorFilePath)?.categoryTagId || null)
      : tagSelectorCasePath
        ? (cases.find(c => c.path === tagSelectorCasePath)?.categoryTagId || currentCase?.categoryTagId || null)
        : (currentCase?.categoryTagId || null);

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        isPastel
          ? 'bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50'
          : 'bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900'
      }`}
    >
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Enhanced Header */}
        <motion.div
          className={`relative p-8 border-b backdrop-blur-xl ${
            isPastel
              ? 'border-pink-200/40 bg-gradient-to-r from-slate-100/80 via-pink-50/30 to-slate-100/80'
              : 'border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95'
          }`}
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
                <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 ${
                  isPastel
                    ? 'bg-gradient-to-br from-pink-300 to-purple-300'
                    : 'bg-gradient-to-br from-purple-600 to-cyan-600'
                }`}></div>
                <div className={`relative p-5 rounded-2xl shadow-2xl ${
                  isPastel
                    ? 'bg-gradient-to-br from-pink-300 to-purple-300'
                    : 'bg-gradient-to-br from-purple-600 to-cyan-600'
                }`}>
                  <FolderOpen className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <motion.h1
                  className={`text-4xl font-bold bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] ${
                    isPastel
                      ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400'
                      : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400'
                  }`}
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
                  className={`text-lg mt-2 ${
                    isPastel ? 'text-gray-600' : 'text-gray-400'
                  }`}
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
                      className={`text-sm ${
                        currentFolderPath
                          ? isPastel
                            ? 'text-pink-500 hover:text-pink-600 underline'
                            : 'text-cyber-purple-400 hover:text-cyber-purple-300 underline'
                          : isPastel
                            ? 'text-gray-800 font-medium'
                            : 'text-white font-medium'
                      }`}
                      aria-label={`Navigate to case ${currentCase.name}`}
                    >
                      {currentCase.name}
                    </button>
                    {currentFolderPath && (
                      <>
                        <span className={isPastel ? 'text-gray-400' : 'text-gray-500'}>/</span>
                        <div className="flex items-center gap-2">
                          {folderNavigationStack.map((path) => {
                            const folderName = path.split(/[/\\]/).pop() || path;
                            return (
                              <span key={path} className="flex items-center gap-2">
                                <button
                                  onClick={() => navigateToFolder(path)}
                                  className={`text-sm underline ${
                                    isPastel
                                      ? 'text-pink-500 hover:text-pink-600'
                                      : 'text-cyber-purple-400 hover:text-cyber-purple-300'
                                  }`}
                                  aria-label={`Navigate to folder ${folderName}`}
                                >
                                  {folderName}
                                </button>
                                <span className={isPastel ? 'text-gray-400' : 'text-gray-500'}>/</span>
                              </span>
                            );
                          })}
                          <span className={`text-sm font-medium ${
                            isPastel ? 'text-gray-800' : 'text-white'
                          }`}>
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border shadow-sm transition-colors ${
                    isPastel
                      ? 'bg-white/80 hover:bg-white text-gray-800 border-pink-300/60'
                      : 'bg-gray-800/80 hover:bg-gray-700 text-white border-cyber-purple-500/60'
                  }`}
                  aria-label="Return to home screen"
                >
                  <Home size={18} aria-hidden="true" />
                  <span className="text-sm font-medium">Home</span>
                </button>
                {currentCase && (
                  <button
                    onClick={() => {
                      // Clear both local state and context to prevent restoration
                      setCurrentCase(null);
                      setArchiveContextCase(null);
                      // Reset restoration flag so it can restore in the future if needed
                      hasRestoredCaseRef.current = false;
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border shadow-sm transition-colors ${
                    isPastel
                      ? 'bg-white/80 hover:bg-white text-gray-800 border-pink-300/60'
                      : 'bg-gray-800/80 hover:bg-gray-700 text-white border-cyber-purple-500/60'
                  }`}
                    aria-label="Go back to cases list"
                  >
                    <ArrowLeft size={18} aria-hidden="true" />
                    <span className="text-sm font-medium">Back</span>
                  </button>
                )}
                {currentCase && currentFolderPath && (
                  <button
                    onClick={goBackToParentFolder}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border shadow-sm transition-colors ${
                    isPastel
                      ? 'bg-white/80 hover:bg-white text-gray-800 border-pink-300/60'
                      : 'bg-gray-800/80 hover:bg-gray-700 text-white border-cyber-purple-500/60'
                  }`}
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
              <ProgressBar
                progress={progress}
                statusMessage={statusMessage}
                onCancel={cancelArchiveExtraction}
              />
            </div>
          )}

          {/* Enhanced Toolbar */}
          <div className={`relative z-50 px-6 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b backdrop-blur-sm ${
            isPastel
              ? 'border-pink-200/20 bg-white/30'
              : 'border-cyber-purple-400/20 bg-gray-900/30'
          }`}>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Action Buttons Group */}
              <div className="flex items-center gap-3 sm:gap-4">
                {!currentCase && (
                  <motion.button
                    onClick={() => setShowCaseDialog(true)}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden group flex items-center gap-2.5 px-5 py-2.5 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl border ${
                      isPastel
                        ? 'bg-gradient-to-br from-pink-400/90 via-purple-400/90 to-pink-400/90 hover:from-pink-400 hover:via-purple-400 hover:to-pink-400 hover:shadow-pink-400/30 border-pink-300/30'
                        : 'bg-gradient-to-br from-purple-600/90 via-purple-500/90 to-cyan-600/90 hover:from-purple-600 hover:via-purple-500 hover:to-cyan-600 hover:shadow-purple-500/30 border-purple-400/30'
                    }`}
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
                      className={`relative overflow-hidden group flex items-center gap-2.5 px-5 py-2.5 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl border ${
                      isPastel
                        ? 'bg-gradient-to-br from-pink-400/90 via-purple-400/90 to-pink-400/90 hover:from-pink-400 hover:via-purple-400 hover:to-pink-400 hover:shadow-pink-400/30 border-pink-300/30'
                        : 'bg-gradient-to-br from-purple-600/90 via-purple-500/90 to-cyan-600/90 hover:from-purple-600 hover:via-purple-500 hover:to-cyan-600 hover:shadow-purple-500/30 border-purple-400/30'
                    }`}
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
                      className={`relative overflow-hidden group flex items-center gap-2.5 px-5 py-2.5 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl border ${
                      isPastel
                        ? 'bg-gradient-to-br from-pink-400/90 via-purple-400/90 to-pink-400/90 hover:from-pink-400 hover:via-purple-400 hover:to-pink-400 hover:shadow-pink-400/30 border-pink-300/30'
                        : 'bg-gradient-to-br from-purple-600/90 via-purple-500/90 to-cyan-600/90 hover:from-purple-600 hover:via-purple-500 hover:to-cyan-600 hover:shadow-purple-500/30 border-purple-400/30'
                    }`}
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
                className={`relative overflow-hidden group flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl border-2 transition-all duration-300 font-medium shadow-md hover:shadow-lg backdrop-blur-sm ${
                  isPastel
                    ? 'bg-white/70 hover:bg-white/90 text-gray-800 border-pink-200/50 hover:border-pink-400/60 hover:shadow-pink-400/20'
                    : 'bg-gray-800/70 hover:bg-gray-800/90 text-white border-gray-700/50 hover:border-cyber-purple-400/60 hover:shadow-cyber-purple-500/20'
                }`}
                aria-label="Switch vault directory"
              >
                <div className={`absolute inset-0 transition-all duration-500 ${
                  isPastel
                    ? 'bg-gradient-to-br from-pink-400/0 via-pink-400/0 to-purple-400/0 group-hover:from-pink-400/5 group-hover:via-pink-400/3 group-hover:to-purple-400/5'
                    : 'bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/5 group-hover:via-purple-600/3 group-hover:to-cyan-600/5'
                }`}></div>
                <div className="relative flex items-center gap-2.5">
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity ${
                      isPastel
                        ? 'bg-gradient-to-br from-pink-400/20 to-purple-400/20'
                        : 'bg-gradient-to-br from-purple-600/20 to-cyan-600/20'
                    }`}></div>
                    <FolderOpen size={16} className={`relative z-10 transition-colors ${
                      isPastel
                        ? 'text-gray-600 group-hover:text-pink-500'
                        : 'text-gray-300 group-hover:text-cyber-purple-400'
                    }`} />
                  </div>
                  <span className={`relative z-10 text-sm sm:text-base transition-colors ${
                    isPastel
                      ? 'text-gray-600 group-hover:text-gray-800'
                      : 'text-gray-300 group-hover:text-white'
                  }`}>Switch Vault</span>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div
            ref={dropZoneRef}
            className={`relative z-0 flex-1 overflow-y-auto px-8 pt-6 pb-8 ${
              isDragging
                ? isPastel
                  ? 'bg-pink-300/20 border-2 border-pink-400 border-dashed rounded-lg m-4'
                  : 'bg-cyber-purple-500/20 border-2 border-cyber-purple-500 border-dashed rounded-lg m-4'
                : ''
            }`}
          >
            <ArchiveGrid
              loading={loading}
              isPastel={isPastel}
              cases={cases}
              files={files}
              currentCase={currentCase}
              currentFolderPath={currentFolderPath}
              isExtracting={isExtracting}
              extractingCasePath={extractingCasePath}
              extractingFolderPath={extractingFolderPath}
              dragOverFolder={dragOverFolder}
              onFolderDragOver={handleFolderDragOver}
              onFolderDragLeave={handleFolderDragLeave}
              onFolderDrop={handleFolderDrop}
              onDragStartFile={handleDragStartFile}
              onDragEndFile={handleDragEndFile}
              onOpenFolder={openFolder}
              onRequestDeleteFolder={requestDeleteFolder}
              onRequestRename={requestRename}
              onUpdateFolderBackgroundImage={updateFolderBackgroundImage}
              onFileClick={handleFileClick}
              onDeleteFileDirect={handleDeleteFileDirect}
              onDeleteFileWithConfirm={handleDeleteFileWithConfirm}
              onExtractPDF={handleExtractPDF}
              onRunPDFAudit={handleRunPDFAudit}
              onTranscribeMedia={handleTranscribeMedia}
              onFileTagClick={handleFileTagClick}
              onRequestThumbnail={requestFileThumbnail}
              getTagById={getTagById}
              onSelectCase={setCurrentCase}
              onDeleteCase={deleteCase}
              onRenameCase={handleRenameCase}
              onUpdateCaseBackgroundImage={updateCaseBackgroundImage}
              onCaseTagClick={handleTagClick}
              onEditCaseDescription={handleEditCaseDescription}
              onCreateCase={() => setShowCaseDialog(true)}
              onAddFiles={handleAddFiles}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ArchiveDialogs
        showDriveDialog={showDriveDialog}
        onCloseDriveDialog={() => setShowDriveDialog(false)}
        onConfirmDrive={handleSelectDrive}
        showCaseDialog={showCaseDialog}
        onCloseCaseDialog={() => setShowCaseDialog(false)}
        onConfirmCase={handleCreateCase}
        showDescriptionDialog={showDescriptionDialog}
        caseForDescription={caseForDescription}
        onCloseDescriptionDialog={() => {
          setShowDescriptionDialog(false);
          setCaseForDescription(null);
        }}
        onConfirmDescription={handleConfirmCaseDescription}
        showCreateFolderDialog={showCreateFolderDialog}
        onCloseCreateFolderDialog={() => setShowCreateFolderDialog(false)}
        onConfirmCreateFolder={handleCreateFolder}
        showFolderSelectionDialog={showFolderSelectionDialog}
        onCloseFolderSelectionDialog={() => {
          setShowFolderSelectionDialog(false);
          // Only clear selectedFileForExtraction if user is canceling, not when proceeding
          // The handleFolderSelection and handleMakeNewFolder functions handle dialog transitions
          setSelectedFileForExtraction(null);
        }}
        onSelectDirectory={handleFolderSelection}
        onMakeNewFolder={handleMakeNewFolder}
        showExtractionDialog={showExtractionDialog}
        onCloseExtractionDialog={() => {
          setShowExtractionDialog(false);
          // Only clear selectedFileForExtraction if user explicitly cancels
          // Don't clear it during normal flow transitions
          setSelectedFileForExtraction(null);
        }}
        onConfirmExtraction={handleExtractionConfirm}
        showSaveParentDialog={showSaveParentDialog}
        onCloseSaveParentDialog={() => {
          setShowSaveParentDialog(false);
          setPendingExtraction(null);
          setSelectedFileForExtraction(null);
        }}
        onConfirmSaveParent={handleSaveParentConfirm}
        showDeleteFolderDialog={showDeleteFolderDialog}
        folderToDelete={folderToDelete}
        onCloseDeleteFolderDialog={() => {
          setShowDeleteFolderDialog(false);
          setFolderToDelete(null);
        }}
        onConfirmDeleteFolder={handleConfirmDeleteFolder}
        showDeletePDFDialog={showDeletePDFDialog}
        pdfToDelete={pdfToDelete}
        deletePDFHasExistingFolder={deletePDFHasExistingFolder}
        onCloseDeletePDFDialog={() => {
          setShowDeletePDFDialog(false);
          setPdfToDelete(null);
        }}
        onConfirmDeletePDF={handleConfirmDeletePDF}
        showRenameDialog={showRenameDialog}
        fileToRename={fileToRename}
        onCloseRenameDialog={() => {
          setShowRenameDialog(false);
          setFileToRename(null);
        }}
        onConfirmRename={handleConfirmRename}
        showTagSelector={showTagSelector}
        onCloseTagSelector={() => {
          setShowTagSelector(false);
          setTagSelectorCasePath(null);
          setTagSelectorFilePath(null);
        }}
        onSelectTag={handleTagSelect}
        tags={tags}
        onCreateTag={createTag}
        onDeleteTag={deleteTag}
        tagSelectorSelectedTagId={tagSelectorSelectedTagId}
      />

      {/* Viewer + lazy modals */}
      <ArchiveViewerHost
        selectedFile={selectedFile}
        files={files}
        fileViewerIndex={fileViewerIndex}
        initialPage={initialPage}
        onCloseViewer={closeViewer}
        onNextFile={handleNextFile}
        onPreviousFile={handlePreviousFile}
        onInitialPageApplied={() => setInitialPage(undefined)}
        onTranscribe={handleTranscribeMedia}
        showSecurityChecker={showSecurityChecker}
        pdfPathForAudit={pdfPathForAudit}
        onCloseSecurityChecker={() => {
          setShowSecurityChecker(false);
          setPdfPathForAudit(null);
        }}
        onReportSaved={handleReportSaved}
        showPDFExtraction={showPDFExtraction}
        pdfPathForExtraction={pdfPathForExtraction}
        onClosePDFExtraction={() => {
          setShowPDFExtraction(false);
          setPdfPathForExtraction(null);
        }}
        onExtractionComplete={() => {
          if (currentCase) {
            refreshFiles();
          }
        }}
        currentCasePath={currentCase?.path || null}
      />
    </div>
  );
}
