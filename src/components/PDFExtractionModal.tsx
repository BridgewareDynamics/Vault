import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Maximize2,
  Save,
  Image as ImageIcon,
  FolderOpen,
  HardDriveDownload,
  Layers,
} from 'lucide-react';
import { usePDFExtraction } from '../hooks/usePDFExtraction';
import { useToast } from './Toast/ToastContext';
import { PDFExtractionSettings } from './PDFExtractionSettings';
import { PDFExtractionProgress } from './PDFExtractionProgress';
import { PDFExtractionResults } from './PDFExtractionResults';
import { PDFExtractionSaveOptions } from './PDFExtractionSaveOptions';
import { PDFExtractionVaultBrowser } from './PDFExtraction/PDFExtractionVaultBrowser';
import { PDFExtractionSourceHero } from './PDFExtraction/PDFExtractionSourceHero';
import { PDFExtractionPagePreviewPanel } from './PDFExtraction/PDFExtractionPagePreviewPanel';
import { CaseSelectionDialog } from './Archive/CaseSelectionDialog';
import { ArchiveFileViewer } from './Archive/ArchiveFileViewer';
import { ConversionSettings, ExtractedPage } from '../types';
import { isLightTheme } from '../theme/themeSemantics';
import { useSettingsContext } from '../utils/settingsContext';
import { Theme } from '../types';
import { getModuleMenuTheme } from '../theme/moduleMenuTheme';
import { useVaultActiveCase } from '../contexts/VaultActiveCaseContext';

import { ArchiveFile } from '../types';
import { getUserFriendlyError } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import { filterPdfsWithoutExtractionFolders } from '../utils/pdfExtractionCaseFiles';

interface CasePdfEntry {
  name: string;
  path: string;
}

function isPdfFileName(name: string): boolean {
  return name.toLowerCase().endsWith('.pdf');
}

function getFileBaseName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() ?? filePath;
}

function toArchivePdfFile(filePath: string): ArchiveFile {
  return {
    name: getFileBaseName(filePath),
    path: filePath,
    size: 0,
    modified: Date.now(),
    type: 'pdf',
  };
}

interface PDFExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPdfPath?: string | null;
  caseFolderPath?: string | null;
  onExtractionComplete?: () => void;
  existingFolders?: ArchiveFile[];
}

const DEFAULT_SETTINGS: ConversionSettings = {
  dpi: 150,
  quality: 85,
  format: 'jpeg',
  pageRange: 'all',
  colorSpace: 'rgb',
  compressionLevel: 6,
};

export function PDFExtractionModal({
  isOpen,
  onClose,
  initialPdfPath,
  caseFolderPath,
  onExtractionComplete,
  existingFolders,
}: PDFExtractionModalProps) {
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [previewPage, setPreviewPage] = useState<ExtractedPage | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [restoredExtractedPages, setRestoredExtractedPages] = useState<ExtractedPage[]>([]);
  const [pendingPreviewPage, setPendingPreviewPage] = useState<ExtractedPage | null>(null);
  const [vaultCasePath, setVaultCasePath] = useState<string | null>(null);
  const [selectedCaseName, setSelectedCaseName] = useState<string | null>(null);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [casePdfFiles, setCasePdfFiles] = useState<CasePdfEntry[]>([]);
  const [loadingCaseFiles, setLoadingCaseFiles] = useState(false);
  const [hiddenConvertedPdfCount, setHiddenConvertedPdfCount] = useState(0);
  const [pdfOrigin, setPdfOrigin] = useState<'vault' | 'external' | null>(null);
  const [viewerFile, setViewerFile] = useState<ArchiveFile | null>(null);
  const [resolvedExistingFolders, setResolvedExistingFolders] = useState<ArchiveFile[] | undefined>(
    undefined
  );

  const effectiveCaseFolderPath = caseFolderPath ?? vaultCasePath;
  const effectiveExistingFolders = existingFolders ?? resolvedExistingFolders;
  const displayCaseName =
    selectedCaseName ||
    (effectiveCaseFolderPath ? getFileBaseName(effectiveCaseFolderPath) : null);

  const { extractPDF, isExtracting, progress, extractedPages, error, statusMessage, cancel, reset } =
    usePDFExtraction();
  const toast = useToast();
  const { activeCase } = useVaultActiveCase();
  const { settings: appSettings } = useSettingsContext();
  const theme: Theme = (appSettings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);
  const t = getModuleMenuTheme(theme);
  const valueTone = isPastel ? 'text-purple-700' : 'text-cyan-200';

  const hasResults = extractedPages.length > 0 || restoredExtractedPages.length > 0;
  const resultPages = extractedPages.length > 0 ? extractedPages : restoredExtractedPages;
  const showSidePanel = showCaseDialog || !!previewPage;

  const openPdfInViewer = useCallback((path: string) => {
    setViewerFile(toArchivePdfFile(path));
  }, []);

  const clearPdfSelection = useCallback(() => {
    setPdfPath(null);
    setPdfOrigin(null);
    setTotalPages(0);
    reset();
  }, [reset]);

  // Restore preview page when extracted pages are available
  useEffect(() => {
    if (pendingPreviewPage) {
      const allPages = extractedPages.length > 0 ? extractedPages : restoredExtractedPages;
      logger.debug('PDFExtractionModal: Checking pending preview page', {
        hasPendingPreview: !!pendingPreviewPage,
        pendingPageNumber: pendingPreviewPage?.pageNumber,
        extractedPagesCount: extractedPages.length,
        restoredPagesCount: restoredExtractedPages.length,
        allPagesCount: allPages.length,
      });
      
      if (allPages.length > 0) {
        const previewPageInPages = allPages.find(
          (p) => p.pageNumber === pendingPreviewPage.pageNumber
        );
        if (previewPageInPages) {
          setPreviewPage(previewPageInPages);
          logger.debug('PDFExtractionModal: Restored preview page from pending', previewPageInPages.pageNumber);
          setPendingPreviewPage(null);
        } else {
          // If not found, use the pending one directly
          setPreviewPage(pendingPreviewPage);
          logger.debug('PDFExtractionModal: Restored preview page (using pending directly)', pendingPreviewPage.pageNumber);
          setPendingPreviewPage(null);
        }
      }
    }
  }, [extractedPages, restoredExtractedPages, pendingPreviewPage]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to close
      if (e.key === 'Escape' && !isExtracting) {
        onClose();
      }
      // Ctrl/Cmd + O to select file
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleSelectFile();
      }
      // Ctrl/Cmd + S to save (when pages are extracted)
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && (extractedPages.length > 0 || restoredExtractedPages.length > 0)) {
        e.preventDefault();
        setShowSaveDialog(true);
      }
      // Space to start/pause (when file is selected and not extracting)
      if (e.key === ' ' && pdfPath && !isExtracting && extractedPages.length === 0) {
        e.preventDefault();
        handleStartExtraction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExtracting, pdfPath, extractedPages.length]);

  const loadCasePdfFiles = useCallback(
    async (casePath: string) => {
      if (!window.electronAPI?.listCaseFiles) {
        return;
      }
      try {
        setLoadingCaseFiles(true);
        const files = await window.electronAPI.listCaseFiles(casePath);
        const allPdfs = files
          .filter((file) => !file.isFolder && isPdfFileName(file.name))
          .map((file) => ({ name: file.name, path: file.path }));
        const pendingPdfs = filterPdfsWithoutExtractionFolders(allPdfs, files);
        setHiddenConvertedPdfCount(allPdfs.length - pendingPdfs.length);
        setCasePdfFiles(pendingPdfs);

        if (
          pdfPath &&
          pdfOrigin === 'vault' &&
          !pendingPdfs.some((file) => file.path === pdfPath)
        ) {
          clearPdfSelection();
        }
      } catch (loadError) {
        toast.error(getUserFriendlyError(loadError, { operation: 'loading case files' }));
        setCasePdfFiles([]);
        setHiddenConvertedPdfCount(0);
      } finally {
        setLoadingCaseFiles(false);
      }
    },
    [toast, pdfPath, pdfOrigin, clearPdfSelection]
  );

  const loadExistingFoldersForPdf = useCallback(
    async (casePath: string, selectedPdfPath: string) => {
      if (!window.electronAPI?.listCaseFiles || existingFolders) {
        return;
      }
      try {
        const files = await window.electronAPI.listCaseFiles(casePath);
        const pdfName = getFileBaseName(selectedPdfPath);
        setResolvedExistingFolders(
          files.filter(
            (file) =>
              file.isFolder &&
              file.parentPdfName &&
              file.parentPdfName.toLowerCase() === pdfName.toLowerCase()
          ) as ArchiveFile[]
        );
      } catch (loadError) {
        logger.error('Failed to load extraction folders:', loadError);
        setResolvedExistingFolders([]);
      }
    },
    [existingFolders]
  );

  const selectPdfFromPath = useCallback(
    (filePath: string, origin: 'vault' | 'external') => {
      setPdfPath(filePath);
      setPdfOrigin(origin);
      setTotalPages(0);
      reset();
      if (origin === 'vault') {
        toast.info(`Selected ${getFileBaseName(filePath)}`);
      } else {
        toast.info('PDF file selected');
      }
    },
    [reset, toast]
  );

  // Set initial PDF path when modal opens
  useEffect(() => {
    if (isOpen && initialPdfPath) {
      selectPdfFromPath(initialPdfPath, caseFolderPath ? 'vault' : 'external');
      if (caseFolderPath) {
        setVaultCasePath(caseFolderPath);
        setSelectedCaseName(activeCase?.name ?? getFileBaseName(caseFolderPath));
        void loadCasePdfFiles(caseFolderPath);
      }
    } else if (!isOpen) {
      // Reset state when modal closes
      setPdfPath(null);
      setShowSettings(false);
      setShowSaveDialog(false);
      setSelectedPages(new Set());
      setPreviewPage(null);
      setPendingPreviewPage(null);
      setTotalPages(0);
      setRestoredExtractedPages([]);
      setVaultCasePath(null);
      setSelectedCaseName(null);
      setCasePdfFiles([]);
      setHiddenConvertedPdfCount(0);
      setPdfOrigin(null);
      setViewerFile(null);
      setShowCaseDialog(false);
      setResolvedExistingFolders(undefined);
      reset();
    }
  }, [isOpen, initialPdfPath, caseFolderPath, activeCase?.name, reset, selectPdfFromPath, loadCasePdfFiles]);

  useEffect(() => {
    if (!isOpen || caseFolderPath || vaultCasePath || !activeCase?.path) {
      return;
    }
    setVaultCasePath(activeCase.path);
    setSelectedCaseName(activeCase.name);
  }, [isOpen, caseFolderPath, vaultCasePath, activeCase?.path, activeCase?.name]);

  useEffect(() => {
    if (effectiveCaseFolderPath) {
      void loadCasePdfFiles(effectiveCaseFolderPath);
    } else {
      setCasePdfFiles([]);
    }
  }, [effectiveCaseFolderPath, loadCasePdfFiles]);

  useEffect(() => {
    if (effectiveCaseFolderPath && pdfPath) {
      void loadExistingFoldersForPdf(effectiveCaseFolderPath, pdfPath);
    } else if (!existingFolders) {
      setResolvedExistingFolders(undefined);
    }
  }, [effectiveCaseFolderPath, pdfPath, loadExistingFoldersForPdf, existingFolders]);

  // Listen for reattach data from detached window
  useEffect(() => {
    const handleReattach = (event: CustomEvent<{
      pdfPath: string | null;
      settings: ConversionSettings;
      showSettings: boolean;
      extractedPages: ExtractedPage[];
      selectedPages: number[];
      previewPage: ExtractedPage | null;
      isExtracting: boolean;
      progress: any | null;
      error: string | null;
      statusMessage: string;
      caseFolderPath?: string | null;
    }>) => {
      const data = event.detail;
      
      logger.debug('PDFExtractionModal: Received reattach data', {
        hasPdfPath: !!data.pdfPath,
        hasExtractedPages: data.extractedPages?.length || 0,
        extractedPagesCount: data.extractedPages?.length || 0,
      });
      
      restoreReattachState(data);
    };

    // Check for stored reattach data when modal opens
    const checkStoredData = () => {
      const storedData = (window as any).__reattachPdfExtractionData;
      if (storedData) {
        logger.debug('PDFExtractionModal: Found stored reattach data');
        restoreReattachState(storedData);
        // Clear stored data after using it
        delete (window as any).__reattachPdfExtractionData;
      }
    };

    const restoreReattachState = (data: {
      pdfPath: string | null;
      settings: ConversionSettings;
      showSettings: boolean;
      extractedPages: ExtractedPage[];
      selectedPages: number[];
      previewPage: ExtractedPage | null;
      isExtracting: boolean;
      progress: any | null;
      error: string | null;
      statusMessage: string;
      caseFolderPath?: string | null;
    }) => {
      logger.debug('PDFExtractionModal: restoreReattachState called', {
        hasPreviewPage: !!data.previewPage,
        previewPageNumber: data.previewPage?.pageNumber,
        extractedPagesCount: data.extractedPages?.length || 0,
      });

      // Restore state
      if (data.pdfPath) {
        setPdfPath(data.pdfPath);
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      if (data.showSettings !== undefined) {
        setShowSettings(data.showSettings);
      }
      // Always restore extracted pages, even if empty array
      if (data.extractedPages) {
        setRestoredExtractedPages(data.extractedPages);
        setSelectedPages(new Set(data.selectedPages || []));
        logger.debug('PDFExtractionModal: Restored extracted pages', data.extractedPages.length);
        
        // Store preview page to be restored after extracted pages are set
        if (data.previewPage) {
          setPendingPreviewPage(data.previewPage);
          logger.debug('PDFExtractionModal: Stored pending preview page', data.previewPage.pageNumber);
          
          // Also try to restore immediately if pages are already available
          const previewPageInRestored = data.extractedPages.find(
            (p) => p.pageNumber === data.previewPage?.pageNumber
          );
          if (previewPageInRestored) {
            setPreviewPage(previewPageInRestored);
            setPendingPreviewPage(null);
            logger.debug('PDFExtractionModal: Immediately restored preview page', previewPageInRestored.pageNumber);
          }
        } else {
          setPreviewPage(null);
          setPendingPreviewPage(null);
        }
      } else {
        setRestoredExtractedPages([]);
        setSelectedPages(new Set());
        setPreviewPage(null);
        setPendingPreviewPage(null);
      }
    };

    // Check immediately when modal opens
    if (isOpen) {
      checkStoredData();
    }

    window.addEventListener('reattach-pdf-extraction-data' as any, handleReattach as EventListener);
    return () => {
      window.removeEventListener('reattach-pdf-extraction-data' as any, handleReattach as EventListener);
    };
  }, [isOpen]);

  // Load PDF to get total pages
  useEffect(() => {
    if (!pdfPath || totalPages) {
      return;
    }

    const abortController = new AbortController();

    const loadPDFInfo = async () => {
      try {
        if (!window.electronAPI || !pdfPath) return;

        const { setupPDFWorker } = await import('../utils/pdfWorker');
        await setupPDFWorker();
        const pdfjsLib = await import('pdfjs-dist');
        const { createChunkedPDFSource } = await import('../utils/pdfSource');

        const fileData = await window.electronAPI.readPDFFile(pdfPath);
        if (abortController.signal.aborted) return;

        let pdf: { numPages: number; destroy: () => Promise<void> } | null = null;

        if (fileData && typeof fileData === 'object' && 'type' in fileData) {
          if (fileData.type === 'file-path') {
            pdf = await createChunkedPDFSource(fileData.path, pdfjsLib, undefined, undefined, {
              skipWarning: true,
              signal: abortController.signal,
            });
          } else if (fileData.type === 'base64') {
            const cleanBase64 = fileData.data.trim().replace(/\s/g, '');
            const binaryString = atob(cleanBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            pdf = await pdfjsLib.getDocument({ data: bytes.buffer }).promise;
          }
        }

        if (abortController.signal.aborted) return;

        if (pdf) {
          setTotalPages(pdf.numPages);
          await pdf.destroy();
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        logger.error('Failed to load PDF info:', error);
      }
    };

    void loadPDFInfo();

    return () => {
      abortController.abort();
    };
  }, [pdfPath, totalPages]);

  const handleSelectFile = async () => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return;
      }

      const filePath = await window.electronAPI.selectPDFFile();
      if (filePath) {
        selectPdfFromPath(filePath, 'external');
      }
    } catch (selectError) {
      toast.error(selectError instanceof Error ? selectError.message : 'Failed to select file');
    }
  };

  const handleSelectVaultPdf = (filePath: string) => {
    selectPdfFromPath(filePath, 'vault');
  };

  const handleAssignCase = (casePath: string) => {
    const match = casePath.split(/[/\\]/).filter(Boolean).pop();
    setVaultCasePath(casePath);
    setSelectedCaseName(match ?? 'Case');
    setShowCaseDialog(false);
    void loadCasePdfFiles(casePath);
  };

  const handleStartExtraction = async () => {
    if (!pdfPath) {
      toast.error('Please select a PDF file first');
      return;
    }

    try {
      const pages = await extractPDF(pdfPath, settings);

      // Clear restored pages since we have fresh extraction
      setRestoredExtractedPages([]);

      toast.success(`Successfully extracted ${pages.length} page${pages.length !== 1 ? 's' : ''}`);

      // Auto-select all pages and open large preview for the first page
      setSelectedPages(new Set(pages.map((p) => p.pageNumber)));
      if (pages.length > 0) {
        setPreviewPage(pages[0]);
      }
      
      if (onExtractionComplete) {
        onExtractionComplete();
      }
    } catch (error) {
      // Error already handled by hook
      if (error instanceof Error && !error.message.includes('cancelled')) {
        toast.error(error.message);
      }
    }
  };

  const handleSave = async (saveOptions: {
    saveOption: 'save-loose' | 'make-pdf-folder' | 'add-to-pdf-folder' | 'add-folder-to-directory';
    saveDirectory: string;
    folderName?: string;
    subfolderName?: string;
    createNewFolderForLoose?: boolean;
    saveParentFile: boolean;
    saveToZip: boolean;
    fileNamingPattern: string;
  }) => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return;
      }

      const pagesToSave = extractedPages.filter((p) => selectedPages.has(p.pageNumber));
      if (pagesToSave.length === 0) {
        toast.error('Please select at least one page to save');
        return;
      }

      // Generate file names based on pattern
      const generateFileName = (pageNumber: number, pattern: string): string => {
        const baseName = pdfPath ? pdfPath.split(/[/\\]/).pop()?.replace(/\.pdf$/i, '') || 'page' : 'page';
        return pattern
          .replace(/{n}/g, pageNumber.toString())
          .replace(/{n:03d}/g, pageNumber.toString().padStart(3, '0'))
          .replace(/{filename}/g, baseName);
      };

      const pagesWithNames = pagesToSave.map((page) => ({
        pageNumber: page.pageNumber,
        imageData: page.imageData,
        fileName: `${generateFileName(page.pageNumber, saveOptions.fileNamingPattern)}.${settings.format}`,
      }));

      if (effectiveCaseFolderPath) {
        // Handle different save options for archive case folder
        let targetFolderName: string = '';
        let subfolderPath: string | null = null;

        switch (saveOptions.saveOption) {
          case 'save-loose': {
            // For save-loose, we always need a folder name (saveFiles API requires it)
            // If createNewFolderForLoose is true, use the provided folder name
            // If false, use a default folder name (saveFiles will create it)
            if (saveOptions.createNewFolderForLoose) {
              if (!saveOptions.folderName || !saveOptions.folderName.trim()) {
                throw new Error('Folder name is required');
              }
              targetFolderName = saveOptions.folderName.trim();
            } else {
              // Use a default folder name - saveFiles API requires it
              // The folder will be created by saveFiles
              targetFolderName = 'extracted_images';
            }
            break;
          }

          case 'make-pdf-folder': {
            // Check if folder already exists
            let existingFolderPath: string | null = null;
            try {
              const files = await window.electronAPI.listCaseFiles(effectiveCaseFolderPath);
              const pdfName = pdfPath ? pdfPath.split(/[/\\]/).pop() || '' : '';
              const existingFolder = files.find(
                (file: any) =>
                  file.isFolder &&
                  file.parentPdfName &&
                  file.parentPdfName.toLowerCase() === pdfName.toLowerCase()
              );
              
              if (existingFolder) {
                existingFolderPath = existingFolder.path;
                targetFolderName = existingFolder.name;
              }
            } catch (error) {
              logger.error('Error checking for existing folder:', error);
            }

            // Create folder if it doesn't exist
            if (!existingFolderPath) {
              if (!saveOptions.folderName || !saveOptions.folderName.trim()) {
                throw new Error('Folder name is required');
              }
              await window.electronAPI.createExtractionFolder(
                effectiveCaseFolderPath,
                saveOptions.folderName.trim(),
                pdfPath || undefined
              );
              targetFolderName = saveOptions.folderName.trim();
            }
            break;
          }

          case 'add-to-pdf-folder': {
            // Find existing folder and use it
            const pdfName = pdfPath ? pdfPath.split(/[/\\]/).pop() || '' : '';
            const files = await window.electronAPI.listCaseFiles(effectiveCaseFolderPath);
            const existingFolder = files.find(
              (file: any) =>
                file.isFolder &&
                file.parentPdfName &&
                file.parentPdfName.toLowerCase() === pdfName.toLowerCase()
            );

            if (!existingFolder) {
              throw new Error('No existing folder found for this PDF');
            }

            targetFolderName = existingFolder.name;
            break;
          }

          case 'add-folder-to-directory': {
            // Find existing folder and create subfolder
            const pdfName = pdfPath ? pdfPath.split(/[/\\]/).pop() || '' : '';
            const files = await window.electronAPI.listCaseFiles(effectiveCaseFolderPath);
            const existingFolderForSubfolder = files.find(
              (file: any) =>
                file.isFolder &&
                file.parentPdfName &&
                file.parentPdfName.toLowerCase() === pdfName.toLowerCase()
            );

            if (!existingFolderForSubfolder) {
              throw new Error('No existing folder found for this PDF');
            }

            if (!saveOptions.subfolderName || !saveOptions.subfolderName.trim()) {
              throw new Error('Subfolder name is required');
            }

            // Store existing folder path for later use
            subfolderPath = existingFolderForSubfolder.path;
            targetFolderName = saveOptions.subfolderName.trim();
            break;
          }

          default:
            throw new Error('Invalid save option');
        }

        // Handle different save scenarios
        if (saveOptions.saveOption === 'add-folder-to-directory' && subfolderPath) {
          // Use saveFiles API with existing folder as base directory
          // The folderName parameter will create the subfolder inside the saveDirectory
          await window.electronAPI.saveFiles({
            saveDirectory: subfolderPath, // Use existing folder path as base
            saveParentFile: saveOptions.saveParentFile,
            saveToZip: saveOptions.saveToZip,
            folderName: saveOptions.subfolderName!.trim(), // This creates the subfolder inside saveDirectory
            parentFilePath: pdfPath!,
            extractedPages: pagesWithNames.map((p) => ({
              pageNumber: p.pageNumber,
              imageData: p.imageData,
              fileName: p.fileName,
            })),
          });
        } else if (saveOptions.saveOption === 'save-loose') {
          // Save loose files - saveFiles will create the subfolder
          // If createNewFolderForLoose is true, use the provided folder name
          // If false, use default folder name
          await window.electronAPI.saveFiles({
            saveDirectory: effectiveCaseFolderPath, // Base directory (case folder)
            saveParentFile: saveOptions.saveParentFile,
            saveToZip: saveOptions.saveToZip,
            folderName: targetFolderName, // saveFiles will create this subfolder
            parentFilePath: pdfPath!,
            extractedPages: pagesWithNames.map((p) => ({
              pageNumber: p.pageNumber,
              imageData: p.imageData,
              fileName: p.fileName,
            })),
          });
        } else {
          // Use extractPDFFromArchive for extraction folders (make-pdf-folder, add-to-pdf-folder)
          await window.electronAPI.extractPDFFromArchive({
            pdfPath: pdfPath!,
            casePath: effectiveCaseFolderPath,
            folderName: targetFolderName,
            saveParentFile: saveOptions.saveParentFile,
            saveToZip: saveOptions.saveToZip,
            extractedPages: pagesWithNames.map((p) => ({
              pageNumber: p.pageNumber,
              imageData: p.imageData,
              fileName: p.fileName,
            })),
          });
        }

        toast.success(`Saved ${pagesToSave.length} page${pagesToSave.length !== 1 ? 's' : ''} to archive`);
      } else {
        // Save to regular directory
        if (saveOptions.saveToZip) {
          await window.electronAPI.saveFiles({
            saveDirectory: saveOptions.saveDirectory,
            saveParentFile: saveOptions.saveParentFile,
            saveToZip: true,
            folderName: saveOptions.folderName,
            parentFilePath: pdfPath!,
            extractedPages: pagesWithNames.map((p) => ({
              pageNumber: p.pageNumber,
              imageData: p.imageData,
              fileName: p.fileName,
            })),
          });
          toast.success(`Saved ${pagesToSave.length} page${pagesToSave.length !== 1 ? 's' : ''}`);
        } else {
          // Save individual files
          await window.electronAPI.saveFiles({
            saveDirectory: saveOptions.saveDirectory,
            saveParentFile: saveOptions.saveParentFile,
            saveToZip: false,
            folderName: saveOptions.folderName,
            parentFilePath: pdfPath!,
            extractedPages: pagesWithNames.map((p) => ({
              pageNumber: p.pageNumber,
              imageData: p.imageData,
              fileName: p.fileName,
            })),
          });
          toast.success(`Saved ${pagesToSave.length} page${pagesToSave.length !== 1 ? 's' : ''}`);
        }
      }

      setShowSaveDialog(false);
      
      // Refresh files list if extracting to archive
      if (effectiveCaseFolderPath && onExtractionComplete) {
        onExtractionComplete();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save files');
    }
  };

  const handlePageClick = (page: ExtractedPage) => {
    setPreviewPage(page);
  };

  const handlePageSelect = (pageNumber: number, selected: boolean) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(pageNumber);
      } else {
        next.delete(pageNumber);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPages(new Set(extractedPages.map((p) => p.pageNumber)));
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
  };

  const handleDetach = async () => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return;
      }

      if (!window.electronAPI.createPdfExtractionWindow) {
        toast.error('Detach functionality not available. The createPdfExtractionWindow method is not registered.');
        logger.error('createPdfExtractionWindow method not found on electronAPI');
        return;
      }

      // Prepare state to transfer
      const allPages = extractedPages.length > 0 ? extractedPages : restoredExtractedPages;
      const state = {
        pdfPath,
        settings: {
          ...settings,
          pageRange: settings.pageRange || 'all',
          customPageRange: settings.customPageRange || '',
          compressionLevel: settings.compressionLevel ?? 6,
        },
        showSettings,
        extractedPages: allPages,
        selectedPages: Array.from(selectedPages),
        previewPage: previewPage || null,
        isExtracting,
        progress: progress || null,
        error: error || null,
        statusMessage,
        caseFolderPath: effectiveCaseFolderPath || null,
      };

      logger.debug('PDFExtractionModal: Detaching with state', {
        hasExtractedPages: allPages.length > 0,
        isExtracting,
        pdfPath,
        extractedPagesCount: allPages.length,
        hasPreviewPage: !!previewPage,
        previewPageNumber: previewPage?.pageNumber,
      });

      // Create detached window
      await window.electronAPI.createPdfExtractionWindow(state);
      // Close modal after detaching
      onClose();
      toast.info('Extraction opened in separate window');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to open extraction in separate window: ${errorMessage}`);
      logger.error('Detach error:', error);
      
      // Log additional debugging information
      logger.error('Electron API available:', !!window.electronAPI);
      logger.error('createPdfExtractionWindow available:', !!window.electronAPI?.createPdfExtractionWindow);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="pdf-extraction-studio"
        className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.button
          type="button"
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-label="Close PDF conversion studio"
          onClick={() => {
            if (!isExtracting) {
              onClose();
            }
          }}
        />

        <div
          className={`relative z-10 flex w-full flex-col items-stretch gap-4 p-1 ${
            showSidePanel
              ? 'max-w-[min(100%,118rem)] xl:flex-row xl:items-stretch xl:justify-center xl:gap-6'
              : 'max-w-[min(100%,92rem)] items-center lg:flex-row lg:items-start lg:justify-center'
          }`}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-extraction-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className={`flex max-h-[min(90vh,860px)] w-full min-w-0 flex-col overflow-hidden rounded-[32px] border shadow-2xl ${t.dialogShellLarge} ${
              showSidePanel ? 'xl:max-w-[58rem] xl:flex-1' : 'max-w-6xl shrink-0'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`shrink-0 border-b px-6 py-5 ${t.dialogHeader}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`shrink-0 rounded-2xl p-3 ${t.button}`}>
                    <Layers className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs uppercase tracking-[0.28em] ${valueTone}`}>Vault Imaging</p>
                    <h2
                      id="pdf-extraction-title"
                      className={`truncate text-xl font-bold ${isPastel ? 'text-gray-900' : 'text-white'}`}
                    >
                      PDF Raster Studio
                    </h2>
                    <p className={`mt-1 text-sm ${t.mutedText}`}>
                      High-fidelity page extraction with Vault case integration
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDetach}
                    disabled={isExtracting}
                    title={isExtracting ? 'Finish or cancel extraction before detaching' : undefined}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${t.secondaryButton}`}
                    aria-label="Detach to separate window"
                  >
                    <Maximize2 className="h-4 w-4" />
                    Detach
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isExtracting}
                    className={`rounded-xl border p-2.5 disabled:cursor-not-allowed disabled:opacity-50 ${t.dialogCancel}`}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="vault-studio-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
                <section className="space-y-4">
                  <div className={`rounded-[26px] border p-5 ${t.compactInsetSurface}`}>
                    <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Vault case</p>
                    <p className={`mt-2 text-sm leading-6 ${t.mutedText}`}>
                      {displayCaseName
                        ? `Browsing PDFs in ${displayCaseName}`
                        : 'Assign a case to browse its PDF library'}
                    </p>
                    {activeCase && effectiveCaseFolderPath === activeCase.path && (
                      <p
                        className={`mt-1 text-xs ${isPastel ? 'text-emerald-700' : 'text-emerald-300'}`}
                      >
                        Using your current workspace case
                      </p>
                    )}
                    {!caseFolderPath && (
                      <button
                        type="button"
                        disabled={isExtracting}
                        onClick={() => setShowCaseDialog(true)}
                        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${t.secondaryButton}`}
                      >
                        <FolderOpen className="h-4 w-4" />
                        {effectiveCaseFolderPath ? 'Change case' : 'Select case'}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isExtracting}
                      onClick={handleSelectFile}
                      className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${t.secondaryButton}`}
                    >
                      <HardDriveDownload className="h-4 w-4" />
                      Import external PDF
                    </button>
                  </div>

                  {effectiveCaseFolderPath ? (
                    <div className={`rounded-[26px] border p-4 ${t.dialogInset}`}>
                      <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Case library</p>
                      <p className={`mt-1 text-xs leading-5 ${t.mutedText}`}>
                        Hover a card to expand in the PDF viewer. PDFs that already have an
                        extraction folder above them in the case are hidden to avoid duplicates.
                      </p>
                      {hiddenConvertedPdfCount > 0 && (
                        <p
                          className={`mt-2 text-xs font-medium ${isPastel ? 'text-amber-800' : 'text-amber-200'}`}
                        >
                          {hiddenConvertedPdfCount} PDF{hiddenConvertedPdfCount !== 1 ? 's' : ''}{' '}
                          hidden — already converted to images in this case.
                        </p>
                      )}
                      <div className="mt-4 max-h-[min(52vh,520px)] overflow-y-auto pr-1">
                        <PDFExtractionVaultBrowser
                          files={casePdfFiles}
                          selectedPath={pdfPath}
                          loading={loadingCaseFiles}
                          disabled={isExtracting}
                          onSelect={handleSelectVaultPdf}
                          onExpand={openPdfInViewer}
                          t={t}
                          isPastel={isPastel}
                          emptyHint={
                            hiddenConvertedPdfCount > 0
                              ? 'Every PDF in this case already has an extraction folder with images. Add a new PDF or use Import external PDF to convert another document.'
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={`rounded-[26px] border px-5 py-10 text-center ${t.dialogInset}`}>
                      <FolderOpen className={`mx-auto h-10 w-10 ${isPastel ? 'text-purple-300' : 'text-gray-500'}`} />
                      <p className={`mt-3 text-sm font-medium ${t.mutedText}`}>
                        Select a Vault case to preview and pick PDFs
                      </p>
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <PDFExtractionSourceHero
                    filePath={pdfPath}
                    fileName={pdfPath ? getFileBaseName(pdfPath) : null}
                    totalPages={totalPages}
                    origin={pdfOrigin}
                    disabled={isExtracting}
                    onBrowseExternal={handleSelectFile}
                    onClear={clearPdfSelection}
                    onExpand={() => pdfPath && openPdfInViewer(pdfPath)}
                    t={t}
                    isPastel={isPastel}
                  />

                  {pdfPath && totalPages > 0 && (
                    <PDFExtractionSettings
                      settings={settings}
                      onSettingsChange={setSettings}
                      totalPages={totalPages}
                      isOpen={showSettings}
                      onToggle={() => setShowSettings(!showSettings)}
                      isPastel={isPastel}
                    />
                  )}

                  {isExtracting && progress && (
                    <PDFExtractionProgress progress={progress} onCancel={cancel} isPastel={isPastel} />
                  )}

                  {error && (
                    <div
                      className={`rounded-[20px] border px-4 py-3 text-sm ${
                        isPastel
                          ? 'border-rose-200 bg-rose-50 text-rose-800'
                          : 'border-rose-500/30 bg-rose-950/40 text-rose-100'
                      }`}
                      role="alert"
                    >
                      {error}
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  {hasResults ? (
                    <>
                      <PDFExtractionResults
                        pages={resultPages}
                        selectedPages={selectedPages}
                        onPageClick={handlePageClick}
                        onPageSelect={handlePageSelect}
                        onSelectAll={handleSelectAll}
                        onDeselectAll={handleDeselectAll}
                        isPastel={isPastel}
                        activePageNumber={previewPage?.pageNumber ?? null}
                        t={t}
                      />
                    </>
                  ) : (
                    <div className={`flex min-h-[20rem] flex-col items-center justify-center rounded-[26px] border p-8 text-center ${t.dialogInset}`}>
                      <ImageIcon className={`h-14 w-14 opacity-40 ${isPastel ? 'text-purple-300' : 'text-gray-500'}`} />
                      <p className={`mt-4 text-base font-semibold ${isPastel ? 'text-gray-900' : 'text-white'}`}>
                        Output canvas
                      </p>
                      <p className={`mt-2 max-w-xs text-sm leading-6 ${t.mutedText}`}>
                        Load a PDF, tune parameters, then run conversion. Extracted pages appear here for review
                        before saving to your case.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>

            <div className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-6 py-5 ${t.dialogFooter}`}>
              <div className="flex flex-wrap gap-2">
                {pdfPath && !isExtracting && !hasResults && (
                  <button
                    type="button"
                    onClick={handleStartExtraction}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold ${t.button}`}
                  >
                    <Zap className="h-4 w-4" />
                    Run conversion
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {hasResults && !isExtracting && (
                  <button
                    type="button"
                    disabled={selectedPages.size === 0}
                    onClick={() => setShowSaveDialog(true)}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${t.button}`}
                  >
                    <Save className="h-4 w-4" />
                    Save {selectedPages.size > 0 ? selectedPages.size : ''} page
                    {selectedPages.size !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          <CaseSelectionDialog
            layout="companion"
            companionSize="wide"
            isOpen={showCaseDialog}
            elevated
            title="Assign to case"
            subtitle="Browse PDFs from the selected Vault case"
            confirmLabel="Use this case"
            onClose={() => setShowCaseDialog(false)}
            onSelectCase={handleAssignCase}
          />

          <AnimatePresence mode="popLayout">
            {previewPage && !showCaseDialog ? (
              <PDFExtractionPagePreviewPanel
                page={previewPage}
                pages={resultPages}
                isSelected={selectedPages.has(previewPage.pageNumber)}
                onClose={() => setPreviewPage(null)}
                onNavigate={setPreviewPage}
                onToggleSelect={handlePageSelect}
                t={t}
                isPastel={isPastel}
              />
            ) : null}
          </AnimatePresence>
        </div>

        <PDFExtractionSaveOptions
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onConfirm={handleSave}
          initialSaveDirectory={effectiveCaseFolderPath || null}
          defaultFolderName={pdfPath ? pdfPath.split(/[/\\]/).pop()?.replace(/\.pdf$/i, '') : undefined}
          pdfPath={pdfPath}
          casePath={effectiveCaseFolderPath || null}
          existingFolders={effectiveExistingFolders}
          isPastel={isPastel}
        />

        {viewerFile && (
          <ArchiveFileViewer
            file={viewerFile}
            files={[viewerFile]}
            onClose={() => setViewerFile(null)}
            overlayZIndex={110}
          />
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
