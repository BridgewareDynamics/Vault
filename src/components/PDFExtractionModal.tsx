import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  Upload,
  Zap,
  Maximize2,
  Save,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { usePDFExtraction } from '../hooks/usePDFExtraction';
import { useToast } from './Toast/ToastContext';
import { PDFExtractionSettings } from './PDFExtractionSettings';
import { PDFExtractionProgress } from './PDFExtractionProgress';
import { PDFExtractionResults } from './PDFExtractionResults';
import { PDFExtractionSaveOptions } from './PDFExtractionSaveOptions';
import { ConversionSettings, ExtractedPage } from '../types';

interface PDFExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPdfPath?: string | null;
  caseFolderPath?: string | null;
  onExtractionComplete?: () => void;
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

  const { extractPDF, isExtracting, progress, extractedPages, error, statusMessage, cancel, reset } =
    usePDFExtraction();
  const toast = useToast();

  // Restore preview page when extracted pages are available
  useEffect(() => {
    if (pendingPreviewPage) {
      const allPages = extractedPages.length > 0 ? extractedPages : restoredExtractedPages;
      console.log('PDFExtractionModal: Checking pending preview page', {
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
          console.log('PDFExtractionModal: Restored preview page from pending', previewPageInPages.pageNumber);
          setPendingPreviewPage(null);
        } else {
          // If not found, use the pending one directly
          setPreviewPage(pendingPreviewPage);
          console.log('PDFExtractionModal: Restored preview page (using pending directly)', pendingPreviewPage.pageNumber);
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

  // Set initial PDF path when modal opens
  useEffect(() => {
    if (isOpen && initialPdfPath) {
      setPdfPath(initialPdfPath);
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
      reset();
    }
  }, [isOpen, initialPdfPath, reset]);

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
    }>) => {
      const data = event.detail;
      
      console.log('PDFExtractionModal: Received reattach data', {
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
        console.log('PDFExtractionModal: Found stored reattach data');
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
    }) => {
      console.log('PDFExtractionModal: restoreReattachState called', {
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
        console.log('PDFExtractionModal: Restored extracted pages', data.extractedPages.length);
        
        // Store preview page to be restored after extracted pages are set
        if (data.previewPage) {
          setPendingPreviewPage(data.previewPage);
          console.log('PDFExtractionModal: Stored pending preview page', data.previewPage.pageNumber);
          
          // Also try to restore immediately if pages are already available
          const previewPageInRestored = data.extractedPages.find(
            (p) => p.pageNumber === data.previewPage?.pageNumber
          );
          if (previewPageInRestored) {
            setPreviewPage(previewPageInRestored);
            setPendingPreviewPage(null);
            console.log('PDFExtractionModal: Immediately restored preview page', previewPageInRestored.pageNumber);
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
    if (pdfPath && !totalPages) {
      loadPDFInfo();
    }
  }, [pdfPath]);

  const loadPDFInfo = async () => {
    try {
      if (!window.electronAPI || !pdfPath) return;

      const { setupPDFWorker } = await import('../utils/pdfWorker');
      await setupPDFWorker();
      const pdfjsLib = await import('pdfjs-dist');
      const { createChunkedPDFSource } = await import('../utils/pdfSource');

      const fileData = await window.electronAPI.readPDFFile(pdfPath);
      let pdf: any = null;

      if (fileData && typeof fileData === 'object' && 'type' in fileData) {
        if (fileData.type === 'file-path') {
          pdf = await createChunkedPDFSource(fileData.path, pdfjsLib);
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

      if (pdf) {
        setTotalPages(pdf.numPages);
        await pdf.destroy();
      }
    } catch (error) {
      console.error('Failed to load PDF info:', error);
    }
  };

  const handleSelectFile = async () => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return;
      }

      const filePath = await window.electronAPI.selectPDFFile();
      if (filePath) {
        setPdfPath(filePath);
        setTotalPages(0);
        reset();
        toast.info('PDF file selected');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to select file');
    }
  };

  const handleStartExtraction = async () => {
    if (!pdfPath) {
      toast.error('Please select a PDF file first');
      return;
    }

    try {
      await extractPDF(pdfPath, settings);
      
      // Clear restored pages since we have fresh extraction
      setRestoredExtractedPages([]);
      
      toast.success(`Successfully extracted ${extractedPages.length} page${extractedPages.length !== 1 ? 's' : ''}`);
      
      // Auto-select all pages
      setSelectedPages(new Set(extractedPages.map((p) => p.pageNumber)));
      
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
    saveDirectory: string;
    folderName: string;
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

      if (caseFolderPath) {
        // Save to archive case folder (always use extractPDFFromArchive for archive)
        await window.electronAPI.extractPDFFromArchive({
          pdfPath: pdfPath!,
          casePath: caseFolderPath,
          folderName: saveOptions.folderName,
          saveParentFile: saveOptions.saveParentFile,
          saveToZip: saveOptions.saveToZip,
          extractedPages: pagesWithNames.map((p) => ({
            pageNumber: p.pageNumber,
            imageData: p.imageData,
            fileName: p.fileName,
          })),
        });
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
      if (caseFolderPath && onExtractionComplete) {
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
        console.error('createPdfExtractionWindow method not found on electronAPI');
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
      };

      console.log('PDFExtractionModal: Detaching with state', {
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
      console.error('Detach error:', error);
      
      // Log additional debugging information
      console.error('Electron API available:', !!window.electronAPI);
      console.error('createPdfExtractionWindow available:', !!window.electronAPI?.createPdfExtractionWindow);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isExtracting) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl border-2 border-cyber-purple-400/40 shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl blur-xl opacity-50"></div>
                  <div className="relative p-3 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl shadow-2xl">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent">
                    PDF to Image Conversion
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Extract pages from PDF files as high-quality images
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDetach}
                  className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl transition-all border border-gray-700/50 hover:border-cyber-purple-400/50 flex items-center gap-2 text-gray-300 hover:text-white text-sm"
                  aria-label="Detach to separate window"
                  title="Open in separate window"
                >
                  <Maximize2 size={16} className="text-cyber-purple-400" />
                  <span>Detach</span>
                </button>
                <button
                  onClick={onClose}
                  disabled={isExtracting}
                  className="p-2 hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Controls */}
              <div className="space-y-6">
                {/* File Selection */}
                <div className="bg-gray-800/60 backdrop-blur-sm border border-cyber-purple-400/20 rounded-2xl p-6 shadow-2xl">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-lg font-bold text-gray-200 mb-4">Select PDF File</label>
                      <button
                        onClick={handleSelectFile}
                        disabled={isExtracting}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-bold text-white text-base transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Upload className="w-5 h-5" />
                        <span>{pdfPath ? 'Change PDF File' : 'Select PDF File'}</span>
                      </button>
                    </div>

                    {pdfPath && (
                      <div className="flex items-center gap-4 p-4 bg-gray-900/60 rounded-xl border border-cyber-cyan-400/30">
                        <div className="p-2.5 bg-cyber-cyan-400/20 rounded-lg">
                          <FileText className="w-5 h-5 text-cyber-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 mb-1">Selected File</p>
                          <p className="text-sm text-gray-200 truncate font-medium">{pdfPath}</p>
                          {totalPages > 0 && (
                            <p className="text-xs text-gray-500 mt-1">{totalPages} pages</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Settings */}
                    {pdfPath && totalPages > 0 && (
                      <PDFExtractionSettings
                        settings={settings}
                        onSettingsChange={setSettings}
                        totalPages={totalPages}
                        isOpen={showSettings}
                        onToggle={() => setShowSettings(!showSettings)}
                      />
                    )}

                    {/* Start Extraction Button */}
                    {pdfPath && !isExtracting && extractedPages.length === 0 && (
                      <button
                        onClick={handleStartExtraction}
                        className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 hover:from-cyan-700 hover:via-purple-700 hover:to-cyan-700 rounded-xl font-bold text-white text-lg transition-all shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <Zap className="w-6 h-6 relative z-10" />
                        <span className="relative z-10">Start Conversion</span>
                      </button>
                    )}

                    {/* Progress */}
                    {isExtracting && progress && (
                      <PDFExtractionProgress progress={progress} onCancel={cancel} />
                    )}

                    {/* Error Display */}
                    {error && (
                      <div className="bg-red-900/40 border-2 border-red-600/50 rounded-xl p-4">
                        <p className="text-sm text-red-300 font-medium">Error</p>
                        <p className="text-xs text-red-400 mt-1">{error}</p>
                      </div>
                    )}

                    {/* Save Button */}
                    {(extractedPages.length > 0 || restoredExtractedPages.length > 0) && !isExtracting && (
                      <button
                        onClick={() => setShowSaveDialog(true)}
                        disabled={selectedPages.size === 0}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl font-bold transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        <span>
                          Save {selectedPages.size > 0 ? `${selectedPages.size} ` : ''}Page
                          {selectedPages.size !== 1 ? 's' : ''}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Results Gallery and Preview */}
              <div className="space-y-6">
                {(extractedPages.length > 0 || restoredExtractedPages.length > 0) ? (
                  <>
                    {/* Gallery - Limited to 3 rows with scrolling */}
                    <div className="bg-gray-800/60 backdrop-blur-sm border border-cyber-purple-400/20 rounded-2xl p-6 shadow-2xl">
                      <PDFExtractionResults
                        pages={extractedPages.length > 0 ? extractedPages : restoredExtractedPages}
                        selectedPages={selectedPages}
                        onPageClick={handlePageClick}
                        onPageSelect={handlePageSelect}
                        onSelectAll={handleSelectAll}
                        onDeselectAll={handleDeselectAll}
                      />
                    </div>

                    {/* Image Preview - Below Gallery */}
                    {previewPage ? (
                      <div className="bg-gray-800/60 backdrop-blur-sm border border-cyber-purple-400/20 rounded-2xl p-6 shadow-2xl">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-200">
                              Page {previewPage.pageNumber} Preview
                            </h3>
                            <button
                              onClick={() => setPreviewPage(null)}
                              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
                              aria-label="Close preview"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="bg-gray-900/50 rounded-lg p-6 flex items-center justify-center min-h-[500px]">
                            <img
                              src={previewPage.imageData}
                              alt={`Page ${previewPage.pageNumber}`}
                              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-gray-700/50"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-800/60 backdrop-blur-sm border border-cyber-purple-400/20 rounded-2xl p-12 shadow-2xl flex items-center justify-center min-h-[400px]">
                        <div className="text-center text-gray-400">
                          <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No preview selected</p>
                          <p className="text-sm mt-2">Click the eye icon on any extracted page to preview it here</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-800/60 backdrop-blur-sm border border-cyber-purple-400/20 rounded-2xl p-12 shadow-2xl flex items-center justify-center h-[400px]">
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No pages extracted yet</p>
                      <p className="text-sm mt-2">Select a PDF file and start conversion to see results</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save Dialog */}
        <PDFExtractionSaveOptions
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onConfirm={handleSave}
          initialSaveDirectory={caseFolderPath || null}
          defaultFolderName={pdfPath ? pdfPath.split(/[/\\]/).pop()?.replace(/\.pdf$/i, '') : undefined}
        />
      </motion.div>
    </AnimatePresence>
  );
}
