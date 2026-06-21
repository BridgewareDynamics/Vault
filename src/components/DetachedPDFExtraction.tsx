import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  HardDriveDownload,
  Image as ImageIcon,
  Layers,
  Minimize2,
  Save,
  Zap,
} from 'lucide-react';
import { usePDFExtraction } from '../hooks/usePDFExtraction';
import { useToast } from './Toast/ToastContext';
import { ToastContainer } from './Toast/ToastContainer';
import { PDFExtractionSettings } from './PDFExtractionSettings';
import { PDFExtractionProgress } from './PDFExtractionProgress';
import { PDFExtractionResults } from './PDFExtractionResults';
import { PDFExtractionSaveOptions } from './PDFExtractionSaveOptions';
import { PDFExtractionVaultBrowser } from './PDFExtraction/PDFExtractionVaultBrowser';
import { PDFExtractionSourceHero } from './PDFExtraction/PDFExtractionSourceHero';
import { PDFExtractionPagePreviewPanel } from './PDFExtraction/PDFExtractionPagePreviewPanel';
import { CaseSelectionDialog } from './Archive/CaseSelectionDialog';
import { ArchiveFileViewer } from './Archive/ArchiveFileViewer';
import { ArchiveFile, ConversionSettings, ExtractedPage, Theme } from '../types';
import { isLightTheme } from '../theme/themeSemantics';
import { useSettingsContext } from '../utils/settingsContext';
import { getModuleMenuTheme } from '../theme/moduleMenuTheme';
import { useVaultActiveCase } from '../contexts/VaultActiveCaseContext';
import { getUserFriendlyError } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import { filterPdfsWithoutExtractionFolders } from '../utils/pdfExtractionCaseFiles';

interface PdfExtractionState {
  pdfPath: string | null;
  settings: ConversionSettings;
  showSettings: boolean;
  extractedPages: ExtractedPage[];
  selectedPages: number[];
  previewPage: ExtractedPage | null;
  isExtracting: boolean;
  progress: { currentPage: number; totalPages: number; percentage: number; statusMessage?: string } | null;
  error: string | null;
  statusMessage: string;
  caseFolderPath?: string | null;
}

interface CasePdfEntry {
  name: string;
  path: string;
}

const DEFAULT_SETTINGS: ConversionSettings = {
  dpi: 150,
  quality: 85,
  format: 'jpeg',
  pageRange: 'all',
  colorSpace: 'rgb',
  compressionLevel: 6,
};

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

export function DetachedPDFExtraction() {
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [previewPage, setPreviewPage] = useState<ExtractedPage | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isReattaching, setIsReattaching] = useState(false);
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

  const [localExtractedPages, setLocalExtractedPages] = useState<ExtractedPage[]>([]);
  const [localIsExtracting, setLocalIsExtracting] = useState(false);
  const [localProgress, setLocalProgress] = useState<PdfExtractionState['progress']>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localStatusMessage, setLocalStatusMessage] = useState('');

  const { extractPDF, isExtracting, progress, extractedPages, error, cancel, reset } =
    usePDFExtraction();
  const toast = useToast();
  const { activeCase } = useVaultActiveCase();
  const { settings: appSettings } = useSettingsContext();
  const theme: Theme = (appSettings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);
  const t = getModuleMenuTheme(theme);
  const valueTone = isPastel ? 'text-purple-700' : 'text-cyan-200';

  const effectiveCaseFolderPath = vaultCasePath;
  const displayCaseName =
    selectedCaseName ||
    (effectiveCaseFolderPath ? getFileBaseName(effectiveCaseFolderPath) : null);

  const finalIsExtracting = isExtracting || localIsExtracting;
  const finalProgress = progress || localProgress;
  const finalError = error || localError;
  const resultPages = extractedPages.length > 0 ? extractedPages : localExtractedPages;
  const hasResults = resultPages.length > 0;
  const showSidePanel = showCaseDialog || !!previewPage;

  const openPdfInViewer = useCallback((path: string) => {
    setViewerFile(toArchivePdfFile(path));
  }, []);

  const clearPdfSelection = useCallback(() => {
    setPdfPath(null);
    setPdfOrigin(null);
    setTotalPages(0);
    reset();
    setLocalExtractedPages([]);
    setSelectedPages(new Set());
    setPreviewPage(null);
  }, [reset]);

  const selectPdfFromPath = useCallback(
    (filePath: string, origin: 'vault' | 'external') => {
      setPdfPath(filePath);
      setPdfOrigin(origin);
      setTotalPages(0);
      reset();
      setLocalExtractedPages([]);
      setSelectedPages(new Set());
      setPreviewPage(null);
      if (origin === 'vault') {
        toast.info(`Selected ${getFileBaseName(filePath)}`);
      } else {
        toast.info('PDF file selected');
      }
    },
    [reset, toast]
  );

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

  const loadExistingFoldersForPdf = useCallback(async (casePath: string, selectedPdfPath: string) => {
    if (!window.electronAPI?.listCaseFiles) {
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
  }, []);

  const applyInitialState = useCallback(
    (data: PdfExtractionState) => {
      if (data.pdfPath) {
        setPdfPath(data.pdfPath);
        setPdfOrigin(data.caseFolderPath ? 'vault' : 'external');
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      if (data.showSettings !== undefined) {
        setShowSettings(data.showSettings);
      }
      if (data.caseFolderPath) {
        setVaultCasePath(data.caseFolderPath);
        setSelectedCaseName(getFileBaseName(data.caseFolderPath));
        void loadCasePdfFiles(data.caseFolderPath);
      }
      if (data.extractedPages?.length) {
        setLocalExtractedPages(data.extractedPages);
        setSelectedPages(new Set(data.selectedPages || []));
        if (data.previewPage) {
          const match = data.extractedPages.find((p) => p.pageNumber === data.previewPage?.pageNumber);
          setPreviewPage(match ?? data.previewPage);
        } else {
          setPreviewPage(null);
        }
      }
      if (data.isExtracting) {
        setLocalIsExtracting(true);
        setLocalStatusMessage(data.statusMessage || 'Extraction in progress...');
        if (data.progress) {
          setLocalProgress(data.progress);
        }
      }
    },
    [loadCasePdfFiles]
  );

  useEffect(() => {
    const handleData = (event: CustomEvent<PdfExtractionState>) => {
      applyInitialState(event.detail);
    };

    window.addEventListener('pdf-extraction-data' as keyof WindowEventMap, handleData as EventListener);

    const existingData = (window as Window & { __pdfExtractionInitialData?: PdfExtractionState })
      .__pdfExtractionInitialData;
    if (existingData) {
      applyInitialState(existingData);
    }

    return () => {
      window.removeEventListener(
        'pdf-extraction-data' as keyof WindowEventMap,
        handleData as EventListener
      );
    };
  }, [applyInitialState]);

  useEffect(() => {
    if (!vaultCasePath && activeCase?.path) {
      setVaultCasePath(activeCase.path);
      setSelectedCaseName(activeCase.name);
    }
  }, [vaultCasePath, activeCase?.path, activeCase?.name]);

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
    } else {
      setResolvedExistingFolders(undefined);
    }
  }, [effectiveCaseFolderPath, pdfPath, loadExistingFoldersForPdf]);

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
      } catch (loadError) {
        if (abortController.signal.aborted) return;
        logger.error('Failed to load PDF info:', loadError);
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
      setLocalIsExtracting(true);
      setLocalError(null);
      const pages = await extractPDF(pdfPath, settings, (nextProgress) => {
        setLocalProgress(nextProgress);
        setLocalStatusMessage(nextProgress.statusMessage || 'Extracting...');
      });

      setLocalExtractedPages(pages);
      setSelectedPages(new Set(pages.map((p) => p.pageNumber)));
      if (pages.length > 0) {
        setPreviewPage(pages[0]);
      }

      setLocalIsExtracting(false);
      setLocalProgress(null);
      toast.success(`Successfully extracted ${pages.length} page${pages.length !== 1 ? 's' : ''}`);
    } catch (extractError) {
      setLocalIsExtracting(false);
      setLocalProgress(null);
      if (extractError instanceof Error && !extractError.message.includes('cancelled')) {
        setLocalError(extractError.message);
        toast.error(extractError.message);
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

      const pagesToSave = resultPages.filter((p) => selectedPages.has(p.pageNumber));
      if (pagesToSave.length === 0) {
        toast.error('Please select at least one page to save');
        return;
      }

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
        let targetFolderName = '';
        let subfolderPath: string | null = null;

        switch (saveOptions.saveOption) {
          case 'save-loose':
            targetFolderName =
              saveOptions.createNewFolderForLoose && saveOptions.folderName?.trim()
                ? saveOptions.folderName.trim()
                : 'extracted_images';
            break;
          case 'make-pdf-folder': {
            const files = await window.electronAPI.listCaseFiles(effectiveCaseFolderPath);
            const pdfName = pdfPath ? getFileBaseName(pdfPath) : '';
            const existingFolder = files.find(
              (file) =>
                file.isFolder &&
                file.parentPdfName &&
                file.parentPdfName.toLowerCase() === pdfName.toLowerCase()
            );
            if (existingFolder) {
              targetFolderName = existingFolder.name;
            } else {
              if (!saveOptions.folderName?.trim()) {
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
            const pdfName = pdfPath ? getFileBaseName(pdfPath) : '';
            const files = await window.electronAPI.listCaseFiles(effectiveCaseFolderPath);
            const existingFolder = files.find(
              (file) =>
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
            const pdfName = pdfPath ? getFileBaseName(pdfPath) : '';
            const files = await window.electronAPI.listCaseFiles(effectiveCaseFolderPath);
            const existingFolder = files.find(
              (file) =>
                file.isFolder &&
                file.parentPdfName &&
                file.parentPdfName.toLowerCase() === pdfName.toLowerCase()
            );
            if (!existingFolder) {
              throw new Error('No existing folder found for this PDF');
            }
            if (!saveOptions.subfolderName?.trim()) {
              throw new Error('Subfolder name is required');
            }
            subfolderPath = existingFolder.path;
            targetFolderName = saveOptions.subfolderName.trim();
            break;
          }
          default:
            throw new Error('Invalid save option');
        }

        if (saveOptions.saveOption === 'add-folder-to-directory' && subfolderPath) {
          await window.electronAPI.saveFiles({
            saveDirectory: subfolderPath,
            saveParentFile: saveOptions.saveParentFile,
            saveToZip: saveOptions.saveToZip,
            folderName: saveOptions.subfolderName!.trim(),
            parentFilePath: pdfPath!,
            extractedPages: pagesWithNames,
          });
        } else if (saveOptions.saveOption === 'save-loose') {
          await window.electronAPI.saveFiles({
            saveDirectory: effectiveCaseFolderPath,
            saveParentFile: saveOptions.saveParentFile,
            saveToZip: saveOptions.saveToZip,
            folderName: targetFolderName,
            parentFilePath: pdfPath!,
            extractedPages: pagesWithNames,
          });
        } else {
          await window.electronAPI.extractPDFFromArchive({
            pdfPath: pdfPath!,
            casePath: effectiveCaseFolderPath,
            folderName: targetFolderName,
            saveParentFile: saveOptions.saveParentFile,
            saveToZip: saveOptions.saveToZip,
            extractedPages: pagesWithNames,
          });
        }

        toast.success(`Saved ${pagesToSave.length} page${pagesToSave.length !== 1 ? 's' : ''} to archive`);
      } else {
        await window.electronAPI.saveFiles({
          saveDirectory: saveOptions.saveDirectory,
          saveParentFile: saveOptions.saveParentFile,
          saveToZip: saveOptions.saveToZip,
          folderName: saveOptions.folderName,
          parentFilePath: pdfPath!,
          extractedPages: pagesWithNames,
        });
        toast.success(`Saved ${pagesToSave.length} page${pagesToSave.length !== 1 ? 's' : ''}`);
      }

      setShowSaveDialog(false);
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Failed to save files');
    }
  };

  const handleReattach = async () => {
    if (isReattaching) return;
    setIsReattaching(true);

    try {
      if (!window.electronAPI?.reattachPdfExtraction) {
        toast.error('Reattach is not available');
        setIsReattaching(false);
        return;
      }

      await window.electronAPI.reattachPdfExtraction({
        pdfPath,
        settings: {
          ...settings,
          pageRange: settings.pageRange || 'all',
          customPageRange: settings.customPageRange || '',
          compressionLevel: settings.compressionLevel ?? 6,
        },
        showSettings,
        extractedPages: resultPages,
        selectedPages: Array.from(selectedPages),
        previewPage: previewPage || null,
        isExtracting: finalIsExtracting,
        progress: finalProgress,
        error: finalError,
        statusMessage: localStatusMessage,
        caseFolderPath: effectiveCaseFolderPath || null,
      });
    } catch (reattachError) {
      toast.error('Failed to reattach extraction window');
      logger.error('Reattach error:', reattachError);
      setIsReattaching(false);
    }
  };

  return (
    <div className={`flex min-h-screen flex-col ${t.bg}`}>
      <div
        className={`flex min-h-0 flex-1 flex-col items-stretch gap-4 p-4 xl:flex-row xl:items-stretch ${
          showSidePanel ? 'xl:justify-center' : ''
        }`}
      >
        <div
          className={`flex min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[32px] border shadow-2xl ${t.dialogShellLarge} ${
            showSidePanel ? 'xl:max-w-[58rem] xl:flex-1' : 'mx-auto max-w-[min(100%,92rem)]'
          }`}
        >
          <div className={`shrink-0 border-b px-6 py-5 ${t.dialogHeader}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`shrink-0 rounded-2xl p-3 ${t.button}`}>
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs uppercase tracking-[0.28em] ${valueTone}`}>Vault Imaging</p>
                  <h1 className={`truncate text-xl font-bold ${isPastel ? 'text-gray-900' : 'text-white'}`}>
                    PDF Raster Studio
                  </h1>
                  <p className={`mt-1 text-sm ${t.mutedText}`}>
                    Detached workspace — high-fidelity page extraction
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReattach}
                disabled={isReattaching || finalIsExtracting}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${t.secondaryButton}`}
                aria-label="Reattach to main window"
              >
                <Minimize2 className="h-4 w-4" />
                {isReattaching ? 'Reattaching…' : 'Reattach'}
              </button>
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
                    <p className={`mt-1 text-xs ${isPastel ? 'text-emerald-700' : 'text-emerald-300'}`}>
                      Using your current workspace case
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={finalIsExtracting}
                    onClick={() => setShowCaseDialog(true)}
                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${t.secondaryButton}`}
                  >
                    <FolderOpen className="h-4 w-4" />
                    {effectiveCaseFolderPath ? 'Change case' : 'Select case'}
                  </button>
                  <button
                    type="button"
                    disabled={finalIsExtracting}
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
                      Hover a card to expand in the PDF viewer. PDFs that already have an extraction
                      folder above them in the case are hidden to avoid duplicates.
                    </p>
                    {hiddenConvertedPdfCount > 0 && (
                      <p
                        className={`mt-2 text-xs font-medium ${isPastel ? 'text-amber-800' : 'text-amber-200'}`}
                      >
                        {hiddenConvertedPdfCount} PDF{hiddenConvertedPdfCount !== 1 ? 's' : ''} hidden —
                        already converted to images in this case.
                      </p>
                    )}
                    <div className="mt-4 max-h-[min(52vh,520px)] overflow-y-auto pr-1">
                      <PDFExtractionVaultBrowser
                        files={casePdfFiles}
                        selectedPath={pdfPath}
                        loading={loadingCaseFiles}
                        disabled={finalIsExtracting}
                        onSelect={handleSelectVaultPdf}
                        onExpand={openPdfInViewer}
                        t={t}
                        isPastel={isPastel}
                        emptyHint={
                          hiddenConvertedPdfCount > 0
                            ? 'Every PDF in this case already has an extraction folder with images. Add a new PDF or use Import external PDF.'
                            : undefined
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-[26px] border px-5 py-10 text-center ${t.dialogInset}`}>
                    <FolderOpen
                      className={`mx-auto h-10 w-10 ${isPastel ? 'text-purple-300' : 'text-gray-500'}`}
                    />
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
                  disabled={finalIsExtracting}
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

                {finalIsExtracting && finalProgress && (
                  <PDFExtractionProgress
                    progress={finalProgress}
                    onCancel={cancel}
                    isPastel={isPastel}
                  />
                )}

                {finalError && (
                  <div
                    className={`rounded-[20px] border px-4 py-3 text-sm ${
                      isPastel
                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                        : 'border-rose-500/30 bg-rose-950/40 text-rose-100'
                    }`}
                    role="alert"
                  >
                    {finalError}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                {hasResults ? (
                  <PDFExtractionResults
                    pages={resultPages}
                    selectedPages={selectedPages}
                    onPageClick={setPreviewPage}
                    onPageSelect={(pageNumber, selected) => {
                      setSelectedPages((prev) => {
                        const next = new Set(prev);
                        if (selected) next.add(pageNumber);
                        else next.delete(pageNumber);
                        return next;
                      });
                    }}
                    onSelectAll={() =>
                      setSelectedPages(new Set(resultPages.map((p) => p.pageNumber)))
                    }
                    onDeselectAll={() => setSelectedPages(new Set())}
                    isPastel={isPastel}
                    activePageNumber={previewPage?.pageNumber ?? null}
                    t={t}
                  />
                ) : (
                  <div
                    className={`flex min-h-[20rem] flex-col items-center justify-center rounded-[26px] border p-8 text-center ${t.dialogInset}`}
                  >
                    <ImageIcon
                      className={`h-14 w-14 opacity-40 ${isPastel ? 'text-purple-300' : 'text-gray-500'}`}
                    />
                    <p className={`mt-4 text-base font-semibold ${isPastel ? 'text-gray-900' : 'text-white'}`}>
                      Output canvas
                    </p>
                    <p className={`mt-2 max-w-xs text-sm leading-6 ${t.mutedText}`}>
                      Load a PDF, tune parameters, then run conversion. Extracted pages appear here
                      for review before saving to your case.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>

          <div className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-6 py-5 ${t.dialogFooter}`}>
            <div className="flex flex-wrap gap-2">
              {pdfPath && !finalIsExtracting && !hasResults && (
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
              {hasResults && !finalIsExtracting && (
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
        </div>

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
              onToggleSelect={(pageNumber, selected) => {
                setSelectedPages((prev) => {
                  const next = new Set(prev);
                  if (selected) next.add(pageNumber);
                  else next.delete(pageNumber);
                  return next;
                });
              }}
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
        defaultFolderName={pdfPath ? getFileBaseName(pdfPath).replace(/\.pdf$/i, '') : undefined}
        pdfPath={pdfPath}
        casePath={effectiveCaseFolderPath || null}
        existingFolders={resolvedExistingFolders}
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

      <ToastContainer />
    </div>
  );
}
