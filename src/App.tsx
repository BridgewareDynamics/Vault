import { useState, useEffect, lazy, Suspense } from 'react';
import { ToastProvider, useToast } from './components/Toast/ToastContext';
import { ToastContainer } from './components/Toast/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SecurityCheckerModal } from './components/SecurityCheckerModal';
import { ProgressBar } from './components/ProgressBar';
import { Gallery } from './components/Gallery';
import { ImageViewer } from './components/ImageViewer';
import { Toolbar } from './components/Toolbar';
import { SettingsPanel } from './components/Settings/SettingsPanel';
const ArchivePage = lazy(() => import('./components/Archive/ArchivePage').then(module => ({ default: module.ArchivePage })));
import { usePDFExtraction } from './hooks/usePDFExtraction';
import { ExtractedPage } from './types';
import { Home } from 'lucide-react';
import { logger } from './utils/logger';
import { getUserFriendlyError } from './utils/errorMessages';
import { SettingsProvider, useSettingsContext } from './utils/settingsContext';
import { getMemoryManager } from './utils/memoryManager';
import { WordEditorProvider, useWordEditor } from './contexts/WordEditorContext';
import { ArchiveContextProvider } from './contexts/ArchiveContext';
import { DetachedWordEditor } from './components/WordEditor/DetachedWordEditor';
import { DetachedSecurityChecker } from './components/DetachedSecurityChecker';
import { ResizableDivider } from './components/ResizableDivider';
import './App.css';

function AppContent() {
  const [selectedPdfPath, setSelectedPdfPath] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<ExtractedPage | null>(null);
  const [saveDirectory, setSaveDirectory] = useState<string | null>(null);
  const [saveParentFile, setSaveParentFile] = useState(false);
  const [saveToZip, setSaveToZip] = useState(false);
  const [, setFolderName] = useState<string | undefined>(undefined);
  const [showArchive, setShowArchive] = useState(false);
  const [showSecurityChecker, setShowSecurityChecker] = useState(false);

  // Listen for reattach data from detached PDF audit window
  useEffect(() => {
    const handleReattach = () => {
      // Open the security checker modal when reattaching
      setShowSecurityChecker(true);
    };

    window.addEventListener('reattach-pdf-audit-data' as any, handleReattach as EventListener);
    return () => {
      window.removeEventListener('reattach-pdf-audit-data' as any, handleReattach as EventListener);
    };
  }, []);

  const { extractPDF, isExtracting, progress, extractedPages, error, statusMessage, reset } = usePDFExtraction();
  const toast = useToast();
  const { settings } = useSettingsContext();
  const { isOpen: isWordEditorOpen, dividerPosition, setDividerPosition, isDividerDragging } = useWordEditor();

  // Check if we're in detached editor mode
  // In dev mode, it's a query param: ?editor=detached
  // In production, it's a hash: #editor=detached
  const [isDetachedEditor, setIsDetachedEditor] = useState(false);
  const [isDetachedAudit, setIsDetachedAudit] = useState(false);

  // Check for detached editor mode on mount and after window loads
  // This needs to run after the window is fully loaded because hash might not be available immediately
  useEffect(() => {
    const checkDetached = () => {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      const isDetached = search.includes('editor=detached') || hash.includes('editor=detached');
      const isAuditDetached = search.includes('audit=detached') || hash.includes('audit=detached');
      
      if (isDetached !== isDetachedEditor) {
        setIsDetachedEditor(isDetached);
      }
      if (isAuditDetached !== isDetachedAudit) {
        setIsDetachedAudit(isAuditDetached);
      }
    };
    
    // Check immediately
    checkDetached();
    
    // Check again after a short delay (for production builds where hash might not be ready)
    const timeoutId = setTimeout(checkDetached, 100);
    
    // Also check on hash changes
    window.addEventListener('hashchange', checkDetached);
    
    // Check when window loads (for production builds)
    window.addEventListener('load', checkDetached);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('hashchange', checkDetached);
      window.removeEventListener('load', checkDetached);
    };
  }, [isDetachedEditor, isDetachedAudit]);

  // Check if Electron API is available
  useEffect(() => {
    if (!window.electronAPI) {
      logger.warn('Electron API not available - running in browser mode');
    }
  }, []);

  // If in detached audit mode, show only the audit component
  const shouldShowDetachedAudit = isDetachedAudit || 
    window.location.search.includes('audit=detached') || 
    window.location.hash.includes('audit=detached');
  
  if (shouldShowDetachedAudit) {
    return <DetachedSecurityChecker />;
  }

  // If in detached editor mode, show only the editor
  // Use direct check as fallback in case state hasn't updated yet (for production builds)
  const shouldShowDetached = isDetachedEditor || 
    window.location.search.includes('editor=detached') || 
    window.location.hash.includes('editor=detached');
  
  if (shouldShowDetached) {
    return <DetachedWordEditor />;
  }

  // Initialize memory manager when settings are loaded
  useEffect(() => {
    if (settings) {
      const memoryManager = getMemoryManager();
      memoryManager.initialize(settings);

      // Register cleanup callback for image caches
      const unregister = memoryManager.registerCleanupCallback(() => {
        // Clear any image caches if needed
        // This is a placeholder - actual cache clearing would be implemented
        // based on your specific caching strategy
        logger.info('[MemoryManager] Cleanup triggered - clearing caches');
      });

      return () => {
        unregister();
        memoryManager.shutdown();
      };
    }
  }, [settings]);

  // Listen for bookmark open events - open archive if needed
  useEffect(() => {
    // Track last processed bookmark to prevent duplicates
    let lastProcessedBookmark: string | null = null;
    
    const handleOpenBookmark = (event: CustomEvent<{ pdfPath: string; pageNumber: number; keepPanelOpen?: boolean }>) => {
      const { pdfPath, pageNumber, keepPanelOpen } = event.detail;
      
      // Create a unique key for this bookmark
      const bookmarkKey = `${pdfPath}:${pageNumber}`;
      
      // Skip if we just processed this bookmark (prevent duplicates)
      if (lastProcessedBookmark === bookmarkKey) {
        return;
      }
      lastProcessedBookmark = bookmarkKey;
      
      // Reset after a delay to allow the same bookmark to be opened again if needed
      setTimeout(() => {
        if (lastProcessedBookmark === bookmarkKey) {
          lastProcessedBookmark = null;
        }
      }, 2000);
      
      // Always store bookmark info in sessionStorage for ArchivePage to pick up
      sessionStorage.setItem('pending-bookmark-open', JSON.stringify({ pdfPath, pageNumber }));
      
      // Close word editor if open - but only if not opened from within the panel
      // If keepPanelOpen is true, the bookmark was opened from the Word Editor panel's bookmark library
      if (isWordEditorOpen && !keepPanelOpen) {
        // Dispatch a custom event to close the word editor
        // The SettingsPanel will handle this via the WordEditorContext
        const closeEvent = new CustomEvent('close-word-editor-for-bookmark');
        window.dispatchEvent(closeEvent);
      }
      
      // Open archive if not already open
      if (!showArchive) {
        setShowArchive(true);
        // Small delay to ensure ArchivePage is mounted before handling the event
        setTimeout(() => {
          // Re-dispatch the event so ArchivePage can handle it
          window.dispatchEvent(event);
        }, 300);
      } else {
        // Archive is already open, dispatch event immediately for ArchivePage to handle
        // Small delay to ensure ArchivePage is ready
        setTimeout(() => {
          window.dispatchEvent(event);
        }, 100);
      }
    };

    const handleNavigateToCaseFolder = (event: CustomEvent<{ casePath: string }>) => {
      // Open archive if not already open
      if (!showArchive) {
        setShowArchive(true);
        // Small delay to ensure ArchivePage is mounted before handling the event
        setTimeout(() => {
          // Re-dispatch the event so ArchivePage can handle it
          window.dispatchEvent(event);
        }, 300);
      } else {
        // Archive is already open, dispatch event immediately for ArchivePage to handle
        // Small delay to ensure ArchivePage is ready
        setTimeout(() => {
          window.dispatchEvent(event);
        }, 100);
      }
    };

    window.addEventListener('open-bookmark' as any, handleOpenBookmark as EventListener);
    window.addEventListener('navigate-to-case-folder' as any, handleNavigateToCaseFolder as EventListener);
    return () => {
      window.removeEventListener('open-bookmark' as any, handleOpenBookmark as EventListener);
      window.removeEventListener('navigate-to-case-folder' as any, handleNavigateToCaseFolder as EventListener);
    };
  }, [showArchive, isWordEditorOpen]);

  // Update memory manager when settings change
  useEffect(() => {
    if (settings) {
      const memoryManager = getMemoryManager();
      memoryManager.updateSettings(settings);
    }
  }, [settings]);

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
    // If Editor is open, show side-by-side layout
    if (isWordEditorOpen) {
      return (
        <>
          <div className="flex h-screen overflow-hidden">
            {/* Archive on the left */}
            <div 
              className={`overflow-auto ${isDividerDragging ? '' : 'transition-all duration-300'}`}
              style={{ width: `${dividerPosition}%` }}
            >
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
            </div>
            
            {/* Resizable Divider */}
            <ResizableDivider
              position={dividerPosition}
              onResize={setDividerPosition}
              minLeft={20}
              minRight={30}
            />
            
            {/* Editor on the right - rendered by SettingsPanel with inline mode */}
            <div 
              id="word-editor-inline-container"
              className={`overflow-hidden h-full ${isDividerDragging ? '' : 'transition-all duration-300'}`}
              style={{ width: `${100 - dividerPosition}%` }}
            />
          </div>
          <SettingsPanel isArchiveVisible={true} hideFixedButtons={true} />
          <ToastContainer />
        </>
      );
    }
    
    // Editor not open, show full-width Archive
    return (
      <>
        <div 
          className="transition-all duration-300"
        >
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
        </div>
        <SettingsPanel isArchiveVisible={true} hideFixedButtons={true} />
        <ToastContainer />
      </>
    );
  }

  // Show welcome screen if no PDF selected and not extracting
  if (!selectedPdfPath && !isExtracting && extractedPages.length === 0) {
    return (
      <>
        <div 
          className="transition-all duration-300"
        >
          <WelcomeScreen 
            onSelectFile={handleSelectFile}
            onOpenArchive={() => setShowArchive(true)}
            onOpenSecurityChecker={() => setShowSecurityChecker(true)}
          />
        </div>
        <ToastContainer />
        <SettingsPanel hideWordEditorButton={true} isArchiveVisible={false} hideFixedButtons={true} />
        <SecurityCheckerModal
          isOpen={showSecurityChecker}
          onClose={() => setShowSecurityChecker(false)}
        />
      </>
    );
  }

  // Show extraction view even if no pages extracted yet (during extraction)
  if (selectedPdfPath && extractedPages.length === 0 && !isExtracting && !error) {
    // This shouldn't happen, but just in case
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Preparing...</p>
          </div>
        </div>
        <SettingsPanel isArchiveVisible={false} hideFixedButtons={true} />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div 
        className="transition-all duration-300"
        style={{
          width: '100%',
          maxWidth: '1280px',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '2rem 1rem',
        }}
      >
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

      <SettingsPanel isArchiveVisible={false} hideFixedButtons={true} />
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <WordEditorProvider>
          <ArchiveContextProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </ArchiveContextProvider>
        </WordEditorProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}

export default App;

