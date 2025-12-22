import { useState, useEffect, lazy, Suspense } from 'react';
import { ToastProvider, useToast } from './components/Toast/ToastContext';
import { ToastContainer } from './components/Toast/ToastContainer';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ProgressBar } from './components/ProgressBar';
import { Gallery } from './components/Gallery';
import { ImageViewer } from './components/ImageViewer';
import { Toolbar } from './components/Toolbar';
const ArchivePage = lazy(() => import('./components/Archive/ArchivePage').then(module => ({ default: module.ArchivePage })));
import { usePDFExtraction } from './hooks/usePDFExtraction';
import { ExtractedPage } from './types';
import { Home } from 'lucide-react';
import { logger } from './utils/logger';
import { getUserFriendlyError } from './utils/errorMessages';
import './App.css';

function AppContent() {
  const [selectedPdfPath, setSelectedPdfPath] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<ExtractedPage | null>(null);
  const [saveDirectory, setSaveDirectory] = useState<string | null>(null);
  const [saveParentFile, setSaveParentFile] = useState(false);
  const [saveToZip, setSaveToZip] = useState(false);
  const [, setFolderName] = useState<string | undefined>(undefined);
  const [showArchive, setShowArchive] = useState(false);

  const { extractPDF, isExtracting, progress, extractedPages, error, statusMessage, reset } = usePDFExtraction();
  const toast = useToast();

  // Check if Electron API is available
  useEffect(() => {
    if (!window.electronAPI) {
      logger.warn('Electron API not available - running in browser mode');
    }
  }, []);

  // Handle PDF file selection
  const handleSelectFile = async () => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available. Please run in Electron.');
        return;
      }

      const filePath = await window.electronAPI.selectPDFFile();
      if (filePath) {
        setSelectedPdfPath(filePath);
        toast.info('PDF file selected, starting extraction...');
        
        // Start extraction immediately - progress will be shown
        extractPDF(filePath, () => {
          // Progress updates are handled by the hook
        }).then((pages) => {
          toast.success(`Successfully extracted ${pages.length} page${pages.length !== 1 ? 's' : ''}`);
        }).catch((err) => {
          toast.error(getUserFriendlyError(err, { operation: 'PDF extraction', fileName: filePath }));
        });
      }
    } catch (err) {
      toast.error(getUserFriendlyError(err, { operation: 'file selection' }));
    }
  };

  // Handle save directory selection
  const handleSelectSaveDirectory = async () => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return;
      }

      const dirPath = await window.electronAPI.selectSaveDirectory();
      if (dirPath) {
        setSaveDirectory(dirPath);
        toast.success('Save directory selected');
      }
    } catch (err) {
      toast.error(getUserFriendlyError(err, { operation: 'directory selection' }));
    }
  };

  // Handle save
  const handleSave = async (zipFolderName?: string) => {
    if (!saveDirectory || !selectedPdfPath || extractedPages.length === 0) {
      toast.error('Please select a save directory and ensure pages are extracted');
      return;
    }

    if (saveToZip && !zipFolderName) {
      // This should not happen as the dialog should handle it
      toast.error('Please provide a folder name for the ZIP file');
      return;
    }

    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return;
      }

      const result = await window.electronAPI.saveFiles({
        saveDirectory,
        saveParentFile,
        saveToZip,
        folderName: zipFolderName,
        parentFilePath: selectedPdfPath,
        extractedPages: extractedPages.map((page) => ({
          pageNumber: page.pageNumber,
          imageData: page.imageData,
        })),
      });

      if (result.success) {
        toast.success('Files saved successfully!');
        result.messages.forEach((msg: string) => toast.info(msg));
      }
    } catch (err) {
      toast.error(getUserFriendlyError(err, { operation: 'saving files', path: saveDirectory }));
    }
  };

  // Reset on new file selection
  useEffect(() => {
    if (selectedPdfPath) {
      reset();
    }
  }, [selectedPdfPath, reset]);

  // Show archive if requested
  if (showArchive) {
    return (
      <>
        <Suspense
          fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading Archive...</p>
              </div>
            </div>
          }
        >
          <ArchivePage onBack={() => setShowArchive(false)} />
        </Suspense>
        <ToastContainer />
      </>
    );
  }

  // Show welcome screen if no PDF selected and not extracting
  if (!selectedPdfPath && !isExtracting && extractedPages.length === 0) {
    return (
      <>
        <WelcomeScreen 
          onSelectFile={handleSelectFile}
          onOpenArchive={() => setShowArchive(true)}
        />
        <ToastContainer />
      </>
    );
  }

  // Show extraction view even if no pages extracted yet (during extraction)
  if (selectedPdfPath && extractedPages.length === 0 && !isExtracting && !error) {
    // This shouldn't happen, but just in case
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Preparing...</p>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 relative flex items-start">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-purple bg-clip-text text-transparent mb-2">
              Vault
            </h1>
            {selectedPdfPath && (
              <p className="text-gray-400 text-sm truncate max-w-2xl">
                {selectedPdfPath}
              </p>
            )}
          </div>
          {(selectedPdfPath || isExtracting || extractedPages.length > 0) && (
            <button
              onClick={() => {
                setSelectedPdfPath(null);
                setSelectedPage(null);
                setSaveDirectory(null);
                setSaveParentFile(false);
                setSaveToZip(false);
                setFolderName(undefined);
                reset();
                toast.info('Returned home');
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full border border-cyber-purple-500/60 shadow-sm transition-colors"
              aria-label="Return to home screen"
            >
              <Home size={18} aria-hidden="true" />
              <span className="text-sm font-medium">Home</span>
            </button>
          )}
        </div>

        {/* Progress Bar - Show immediately when extracting or when file is selected */}
        {(isExtracting || (selectedPdfPath && progress)) && (
          <div className="mb-6">
            <ProgressBar progress={progress || { currentPage: 0, totalPages: 0, percentage: 0 }} statusMessage={statusMessage} />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border-2 border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Gallery */}
        {extractedPages.length > 0 && (
          <Gallery
            pages={extractedPages}
            onPageClick={setSelectedPage}
          />
        )}

        {/* Image Viewer */}
        <ImageViewer
          page={selectedPage}
          onClose={() => setSelectedPage(null)}
        />

        {/* Toolbar */}
        {extractedPages.length > 0 && (
          <Toolbar
            saveDirectory={saveDirectory}
            saveParentFile={saveParentFile}
            saveToZip={saveToZip}
            onSelectSaveDirectory={handleSelectSaveDirectory}
            onToggleSaveParentFile={() => setSaveParentFile(!saveParentFile)}
            onToggleSaveToZip={() => setSaveToZip(!saveToZip)}
            onSave={handleSave}
            canSave={extractedPages.length > 0 && saveDirectory !== null}
          />
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;

