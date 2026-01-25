import { useState, useEffect } from 'react';
import { FileText, Minimize2, Upload, Save, Eye, Image as ImageIcon, X, Zap } from 'lucide-react';
import { usePDFExtraction } from '../hooks/usePDFExtraction';
import { useToast } from './Toast/ToastContext';
import { PDFExtractionSettings } from './PDFExtractionSettings';
import { PDFExtractionProgress } from './PDFExtractionProgress';
import { PDFExtractionResults } from './PDFExtractionResults';
import { PDFExtractionSaveOptions } from './PDFExtractionSaveOptions';
import { ConversionSettings, ExtractedPage, Theme } from '../types';
import { useSettingsContext } from '../utils/settingsContext';

interface PdfExtractionState {
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
}

const DEFAULT_SETTINGS: ConversionSettings = {
  dpi: 150,
  quality: 85,
  format: 'jpeg',
  pageRange: 'all',
  colorSpace: 'rgb',
  compressionLevel: 6,
};

export function DetachedPDFExtraction() {
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [previewPage, setPreviewPage] = useState<ExtractedPage | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isReattaching, setIsReattaching] = useState(false);
  const [caseFolderPath, setCaseFolderPath] = useState<string | null>(null);

  // Local state for extraction when detaching during extraction
  const [localExtractedPages, setLocalExtractedPages] = useState<ExtractedPage[]>([]);
  const [localIsExtracting, setLocalIsExtracting] = useState(false);
  const [localProgress, setLocalProgress] = useState<any | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localStatusMessage, setLocalStatusMessage] = useState('');

  const { extractPDF, isExtracting, progress, extractedPages, error, statusMessage, cancel, reset } =
    usePDFExtraction();
  const toast = useToast();
  const { settings: appSettings } = useSettingsContext();
  const theme: Theme = (appSettings?.theme as Theme) || 'brideware-purple';
  const isPastel = theme === 'pastel';

  // Use hook state if available, otherwise use local state
  const finalIsExtracting = isExtracting || localIsExtracting;
  const finalProgress = progress || localProgress;
  const finalError = error || localError;
  const finalStatusMessage = statusMessage || localStatusMessage;
  const finalExtractedPages = extractedPages.length > 0 ? extractedPages : localExtractedPages;

  // Listen for initial data from main process
  useEffect(() => {
    const handleData = (event: CustomEvent<PdfExtractionState>) => {
      const data = event.detail;
      console.log('DetachedPDFExtraction: Received pdf-extraction-data', {
        hasPdfPath: !!data.pdfPath,
        hasExtractedPages: data.extractedPages?.length || 0,
        isExtracting: data.isExtracting,
      });

      if (data.pdfPath) {
        setPdfPath(data.pdfPath);
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      if (data.showSettings !== undefined) {
        setShowSettings(data.showSettings);
      }
      if (data.caseFolderPath !== undefined) {
        setCaseFolderPath(data.caseFolderPath || null);
      }
      if (data.extractedPages && data.extractedPages.length > 0) {
        setLocalExtractedPages(data.extractedPages);
        setSelectedPages(new Set(data.selectedPages || []));
        
        // Restore preview page if it exists
        if (data.previewPage) {
          // Find the preview page in the extracted pages to ensure it has the full data
          const previewPageInExtracted = data.extractedPages.find(
            (p) => p.pageNumber === data.previewPage?.pageNumber
          );
          if (previewPageInExtracted) {
            setPreviewPage(previewPageInExtracted);
            console.log('DetachedPDFExtraction: Restored preview page', previewPageInExtracted.pageNumber);
          } else {
            // If preview page not found in extracted pages, use the provided one
            setPreviewPage(data.previewPage);
          }
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
    };

    window.addEventListener('pdf-extraction-data' as any, handleData as EventListener);

    const checkExistingData = () => {
      const existingData = (window as any).__pdfExtractionInitialData;
      if (existingData) {
        console.log('DetachedPDFExtraction: Found existing initial data');
        handleData({ detail: existingData } as CustomEvent<PdfExtractionState>);
      }
    };

    // Check immediately and after a short delay
    checkExistingData();
    setTimeout(checkExistingData, 100);

    return () => {
      window.removeEventListener('pdf-extraction-data' as any, handleData as EventListener);
    };
  }, []);

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
        setLocalExtractedPages([]);
        setSelectedPages(new Set());
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
      setLocalIsExtracting(true);
      setLocalError(null);
      const extractedPagesResult = await extractPDF(pdfPath, settings, (progress) => {
        setLocalProgress(progress);
        setLocalStatusMessage(progress.statusMessage || 'Extracting...');
      });
      
      // After extraction completes, update local state
      // Use the result from extractPDF, which returns the extracted pages
      const pagesToUse = extractedPagesResult || extractedPages;
      setLocalExtractedPages(pagesToUse);
      setSelectedPages(new Set(pagesToUse.map((p) => p.pageNumber)));
      
      setLocalIsExtracting(false);
      setLocalProgress(null);
      
      console.log('DetachedPDFExtraction: Extraction completed', {
        resultCount: extractedPagesResult?.length || 0,
        hookCount: extractedPages.length,
        finalCount: pagesToUse.length,
      });
      
      toast.success(`Successfully extracted ${pagesToUse.length} page${pagesToUse.length !== 1 ? 's' : ''}`);
    } catch (error) {
      setLocalIsExtracting(false);
      setLocalProgress(null);
      if (error instanceof Error && !error.message.includes('cancelled')) {
        setLocalError(error.message);
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

      const pagesToSave = finalExtractedPages.filter((p) => selectedPages.has(p.pageNumber));
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

      // Determine folder name based on save option
      let targetFolderName: string;
      if (saveOptions.saveOption === 'save-loose') {
        // For save-loose, use provided folder name or default
        targetFolderName = (saveOptions.createNewFolderForLoose && saveOptions.folderName) 
          ? saveOptions.folderName 
          : 'extracted_images';
      } else {
        // For other options, require folder name
        if (!saveOptions.folderName) {
          throw new Error('Folder name is required');
        }
        targetFolderName = saveOptions.folderName;
      }

      if (caseFolderPath) {
        // Save to archive case folder (always use extractPDFFromArchive for archive)
        await window.electronAPI.extractPDFFromArchive({
          pdfPath: pdfPath!,
          casePath: caseFolderPath,
          folderName: targetFolderName,
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
        await window.electronAPI.saveFiles({
          saveDirectory: saveOptions.saveDirectory,
          saveParentFile: saveOptions.saveParentFile,
          saveToZip: saveOptions.saveToZip,
          folderName: targetFolderName,
          parentFilePath: pdfPath!,
          extractedPages: pagesWithNames.map((p) => ({
            pageNumber: p.pageNumber,
            imageData: p.imageData,
            fileName: p.fileName,
          })),
        });
        toast.success(`Saved ${pagesToSave.length} page${pagesToSave.length !== 1 ? 's' : ''}`);
      }

      setShowSaveDialog(false);
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
    setSelectedPages(new Set(finalExtractedPages.map((p) => p.pageNumber)));
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
  };

  const handleReattach = async () => {
    if (isReattaching) {
      return;
    }

    setIsReattaching(true);

    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        setIsReattaching(false);
        return;
      }

      const state = {
        pdfPath,
        settings: {
          dpi: settings.dpi,
          quality: settings.quality,
          format: settings.format,
          pageRange: (settings.pageRange || 'all') as 'all' | 'custom' | 'selected',
          customPageRange: settings.customPageRange || '',
          colorSpace: settings.colorSpace,
          compressionLevel: settings.compressionLevel ?? 6,
        },
        showSettings,
        extractedPages: finalExtractedPages,
        selectedPages: Array.from(selectedPages),
        previewPage: previewPage || null,
        isExtracting: finalIsExtracting,
        progress: finalProgress,
        error: finalError,
        statusMessage: finalStatusMessage,
        caseFolderPath: caseFolderPath || null,
      };

      console.log('DetachedPDFExtraction: Reattaching with state', {
        hasPdfPath: !!pdfPath,
        hasExtractedPages: finalExtractedPages.length > 0,
        extractedPagesCount: finalExtractedPages.length,
        selectedPagesCount: selectedPages.size,
        hasPreviewPage: !!previewPage,
        previewPageNumber: previewPage?.pageNumber,
        extractedPagesSample: finalExtractedPages.slice(0, 2).map(p => ({
          pageNumber: p.pageNumber,
          hasImageData: !!p.imageData,
          imageDataLength: p.imageData?.length || 0,
        })),
      });

      if (window.electronAPI.reattachPdfExtraction) {
        await window.electronAPI.reattachPdfExtraction(state);
        setTimeout(() => {
          setIsReattaching(false);
        }, 1000);
      } else {
        if (window.electronAPI.closeWindow) {
          await window.electronAPI.closeWindow();
        }
        setIsReattaching(false);
      }
    } catch (error) {
      toast.error('Failed to reattach extraction window');
      console.error('Reattach error:', error);
      setIsReattaching(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${
      isPastel
        ? 'bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50'
        : 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900'
    }`}>
      {/* Header */}
      <div className={`relative p-6 border-b backdrop-blur-xl ${
        isPastel
          ? 'border-pink-200/30 bg-gradient-to-r from-white/90 via-pink-50/50 to-white/90'
          : 'border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95'
      }`}
      style={isPastel ? {
        boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15)',
      } : {}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              {isPastel ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-200/50 via-purple-200/50 to-blue-200/50 rounded-xl blur-xl opacity-50"></div>
                  <div className="relative p-3 bg-gradient-to-br from-pink-100/80 via-purple-100/80 to-blue-100/80 rounded-xl shadow-lg border-2 border-pink-200/40">
                    <FileText className="w-6 h-6 text-pink-500" />
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl blur-xl opacity-50"></div>
                  <div className="relative p-3 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl shadow-2xl">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </>
              )}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                isPastel
                  ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent'
              }`}>
                PDF to Image Conversion
              </h2>
              <p className={`text-sm mt-1 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Extract pages from PDF files as high-quality images
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReattach}
              disabled={isReattaching}
              className={`px-4 py-2 rounded-xl transition-all border flex items-center gap-2 text-sm disabled:opacity-50 ${
                isPastel
                  ? 'bg-pink-50/80 hover:bg-pink-100/80 border-pink-200/50 hover:border-pink-300/50 text-gray-700 hover:text-gray-900'
                  : 'bg-gray-800/80 hover:bg-gray-700/80 border-gray-700/50 hover:border-cyber-purple-400/50 text-gray-300 hover:text-white'
              }`}
              aria-label="Reattach to main window"
              title="Reattach to main window"
            >
              <Minimize2 size={16} className={isPastel ? 'text-pink-500' : 'text-cyber-purple-400'} />
              <span>{isReattaching ? 'Reattaching...' : 'Reattach'}</span>
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
            <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-2xl ${
              isPastel
                ? 'bg-white/80 border-pink-200/40'
                : 'bg-gray-800/60 border-cyber-purple-400/20'
            }`}
            style={isPastel ? {
              boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
            } : {}}>
              <div className="space-y-4">
                <div>
                  <label className={`block text-lg font-bold mb-4 ${
                    isPastel ? 'text-gray-700' : 'text-gray-200'
                  }`}>Select PDF File</label>
                  <button
                    onClick={handleSelectFile}
                    disabled={finalIsExtracting}
                    className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-base transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] ${
                      isPastel
                        ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 hover:from-pink-500 hover:via-purple-500 hover:to-pink-500 disabled:from-gray-300 disabled:to-gray-300 text-white'
                        : 'bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 text-white'
                    }`}
                  >
                    <Upload className="w-5 h-5" />
                    <span>{pdfPath ? 'Change PDF File' : 'Select PDF File'}</span>
                  </button>
                </div>

                {pdfPath && (
                  <div className={`flex items-center gap-4 p-4 rounded-xl border ${
                    isPastel
                      ? 'bg-pink-50/60 border-pink-300/30'
                      : 'bg-gray-900/60 border-cyber-cyan-400/30'
                  }`}>
                    <div className={`p-2.5 rounded-lg ${
                      isPastel
                        ? 'bg-pink-200/20'
                        : 'bg-cyber-cyan-400/20'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        isPastel ? 'text-pink-500' : 'text-cyber-cyan-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs mb-1 ${
                        isPastel ? 'text-gray-600' : 'text-gray-400'
                      }`}>Selected File</p>
                      <p className={`text-sm truncate font-medium ${
                        isPastel ? 'text-gray-700' : 'text-gray-200'
                      }`}>{pdfPath}</p>
                      {totalPages > 0 && (
                        <p className={`text-xs mt-1 ${
                          isPastel ? 'text-gray-500' : 'text-gray-500'
                        }`}>{totalPages} pages</p>
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
                    isPastel={isPastel}
                  />
                )}

                {/* Start Extraction Button */}
                {pdfPath && !finalIsExtracting && finalExtractedPages.length === 0 && (
                  <button
                    onClick={handleStartExtraction}
                    className={`w-full flex items-center justify-center gap-3 px-6 py-5 rounded-xl font-bold text-white text-lg transition-all shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ${
                      isPastel
                        ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 hover:from-pink-500 hover:via-purple-500 hover:to-pink-500 hover:shadow-pink-500/50'
                        : 'bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 hover:from-cyan-700 hover:via-purple-700 hover:to-cyan-700 hover:shadow-cyan-500/50'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <Zap className="w-6 h-6 relative z-10" />
                    <span className="relative z-10">Start Conversion</span>
                  </button>
                )}

                {/* Progress */}
                {finalIsExtracting && finalProgress && (
                  <PDFExtractionProgress progress={finalProgress} onCancel={cancel} isPastel={isPastel} />
                )}

                {/* Error Display */}
                {finalError && (
                  <div className={`border-2 rounded-xl p-4 ${
                    isPastel
                      ? 'bg-red-50/80 border-red-300/50'
                      : 'bg-red-900/40 border-red-600/50'
                  }`}>
                    <p className={`text-sm font-medium ${
                      isPastel ? 'text-red-600' : 'text-red-300'
                    }`}>Error</p>
                    <p className={`text-xs mt-1 ${
                      isPastel ? 'text-red-500' : 'text-red-400'
                    }`}>{finalError}</p>
                  </div>
                )}

                {/* Save Button */}
                {finalExtractedPages.length > 0 && !finalIsExtracting && (
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    disabled={selectedPages.size === 0}
                    className={`w-full flex items-center justify-center gap-3 px-6 py-4 text-white rounded-xl font-bold transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2 ${
                      isPastel
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 disabled:from-gray-300 disabled:to-gray-300'
                        : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700'
                    }`}
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
            {finalExtractedPages.length > 0 ? (
              <>
                {/* Gallery */}
                <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-2xl ${
                  isPastel
                    ? 'bg-white/80 border-pink-200/40'
                    : 'bg-gray-800/60 border-cyber-purple-400/20'
                }`}
                style={isPastel ? {
                  boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                } : {}}>
                  <PDFExtractionResults
                    pages={finalExtractedPages}
                    selectedPages={selectedPages}
                    onPageClick={handlePageClick}
                    onPageSelect={handlePageSelect}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    isPastel={isPastel}
                  />
                </div>

                {/* Image Preview */}
                {previewPage ? (
                  <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-2xl ${
                    isPastel
                      ? 'bg-white/80 border-pink-200/40'
                      : 'bg-gray-800/60 border-cyber-purple-400/20'
                  }`}
                  style={isPastel ? {
                    boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                  } : {}}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-bold ${
                          isPastel ? 'text-gray-700' : 'text-gray-200'
                        }`}>
                          Page {previewPage.pageNumber} Preview
                        </h3>
                        <button
                          onClick={() => setPreviewPage(null)}
                          className={`p-2 rounded-lg transition-colors ${
                            isPastel
                              ? 'hover:bg-pink-100/50 text-gray-600 hover:text-gray-900'
                              : 'hover:bg-gray-700/50 text-gray-400 hover:text-white'
                          }`}
                          aria-label="Close preview"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className={`rounded-lg p-6 flex items-center justify-center min-h-[500px] ${
                        isPastel ? 'bg-pink-50/50' : 'bg-gray-900/50'
                      }`}>
                        <img
                          src={previewPage.imageData}
                          alt={`Page ${previewPage.pageNumber}`}
                          className={`max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border ${
                            isPastel ? 'border-pink-200/50' : 'border-gray-700/50'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`backdrop-blur-sm rounded-2xl p-12 shadow-2xl flex items-center justify-center min-h-[400px] ${
                    isPastel
                      ? 'bg-white/80 border-pink-200/40'
                      : 'bg-gray-800/60 border-cyber-purple-400/20'
                  }`}
                  style={isPastel ? {
                    boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                  } : {}}>
                    <div className={`text-center ${
                      isPastel ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No preview selected</p>
                      <p className="text-sm mt-2">Click the eye icon on any extracted page to preview it here</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={`backdrop-blur-sm rounded-2xl p-12 shadow-2xl flex items-center justify-center h-[400px] ${
                isPastel
                  ? 'bg-white/80 border-pink-200/40'
                  : 'bg-gray-800/60 border-cyber-purple-400/20'
              }`}
              style={isPastel ? {
                boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
              } : {}}>
                <div className={`text-center ${
                  isPastel ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No pages extracted yet</p>
                  <p className="text-sm mt-2">Select a PDF file and start conversion to see results</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <PDFExtractionSaveOptions
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onConfirm={handleSave}
        initialSaveDirectory={caseFolderPath || null}
        defaultFolderName={pdfPath ? pdfPath.split(/[/\\]/).pop()?.replace(/\.pdf$/i, '') : undefined}
        isPastel={isPastel}
      />
    </div>
  );
}
