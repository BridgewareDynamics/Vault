import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { ToastProvider, useToast } from './components/Toast/ToastContext';
import { ToastContainer } from './components/Toast/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SecurityCheckerModal } from './components/SecurityCheckerModal';
import { PDFExtractionModal } from './components/PDFExtractionModal';
import { ProgressBar } from './components/ProgressBar';
import { Gallery } from './components/Gallery';
import { ImageViewer } from './components/ImageViewer';
import { Toolbar } from './components/Toolbar';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { usePDFExtraction } from './hooks/usePDFExtraction';
import { ConversionSettings } from './types';
import { isLightTheme } from './theme/themeSemantics';
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
import { DetachedPDFExtraction } from './components/DetachedPDFExtraction';
import { ResizableDivider } from './components/ResizableDivider';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';
import { Theme } from './types';
import {
  prefetchTranscriptionModule,
  warmTranscriptionEntry,
} from './utils/transcriptionPrefetch';
import { prefetchMapModule } from './utils/mapPrefetch';
import type {
  FileConverterModuleDetachState,
  MapModuleDetachState,
  TranscriptionModuleDetachState,
} from './types/detachableModules';
import { dispatchWordEditorReattach } from './utils/wordEditorSnapshot';
import {
  planSwapToMapInMain,
  planSwapToTranscriptionInMain,
} from './utils/mainEmbeddedModule';
import {
  loadFileConverterModule,
  prefetchFileConverterModule,
} from './utils/fileConverterPrefetch';
import { FileConverterLoadingShell } from './components/FileConverter/FileConverterLoadingShell';
import './App.css';

const ArchivePage = lazy(() => import('./components/Archive/ArchivePage').then(module => ({ default: module.ArchivePage })));
const MapModule = lazy(() =>
  import('./utils/mapPrefetch').then(({ loadMapModule }) =>
    loadMapModule().then((module) => ({
      default: module.MapModule,
    }))
  )
);
const TranscriptionModule = lazy(() =>
  import('./utils/transcriptionPrefetch').then(({ loadTranscriptionModule }) =>
    loadTranscriptionModule().then((module) => ({
      default: module.TranscriptionModule,
    }))
  )
);
const FileConverterModule = lazy(() =>
  loadFileConverterModule().then((module) => ({
    default: module.FileConverterModule,
  }))
);

function isDetachedRoute(token: string) {
  const search = window.location.search || '';
  const hash = window.location.hash || '';
  return search.includes(token) || hash.includes(token);
}

function AppContent() {
  const [selectedPdfPath, setSelectedPdfPath] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<ExtractedPage | null>(null);
  const [saveDirectory, setSaveDirectory] = useState<string | null>(null);
  const [saveParentFile, setSaveParentFile] = useState(false);
  const [saveToZip, setSaveToZip] = useState(false);
  const [, setFolderName] = useState<string | undefined>(undefined);
  const [showArchive, setShowArchive] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [showSecurityChecker, setShowSecurityChecker] = useState(false);
  const [showPDFExtraction, setShowPDFExtraction] = useState(false);
  const [showFileConverter, setShowFileConverter] = useState(false);
  const [fileConverterReattachState, setFileConverterReattachState] =
    useState<FileConverterModuleDetachState | null>(null);
  const [transcriptionLaunchSourcePath, setTranscriptionLaunchSourcePath] = useState<string | null>(null);
  const [transcriptionLaunchCasePath, setTranscriptionLaunchCasePath] = useState<string | null>(null);
  const [mapReattachState, setMapReattachState] = useState<MapModuleDetachState | null>(null);
  const [transcriptionReattachState, setTranscriptionReattachState] =
    useState<TranscriptionModuleDetachState | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true); // Default to true for new users
  const onboardingCompletedRef = useRef(false); // Track if onboarding was explicitly completed

  const moduleVisibilityRef = useRef({ showMap, showTranscription });
  useEffect(() => {
    moduleVisibilityRef.current = { showMap, showTranscription };
  }, [showMap, showTranscription]);

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

  // Listen for reattach data from detached PDF extraction window
  useEffect(() => {
    const handleReattach = (event: any) => {
      const data = event.detail;
      
      // Only handle reattach if caseFolderPath is absent (home menu usage)
      // If caseFolderPath is present, ArchivePage will handle it
      if (data && !data.caseFolderPath) {
        // Open the PDF extraction modal when reattaching from home menu
        console.log('App: Received reattach-pdf-extraction-data event without caseFolderPath, opening modal');
        setShowPDFExtraction(true);
      }
    };

    window.addEventListener('reattach-pdf-extraction-data' as any, handleReattach as EventListener);
    
    // Also check for stored data on mount
    const checkStoredData = () => {
      const storedData = (window as any).__reattachPdfExtractionData;
      if (storedData && !storedData.caseFolderPath) {
        console.log('App: Found stored reattach data without caseFolderPath, opening modal');
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

  const { extractPDF, isExtracting, progress, extractedPages, error, statusMessage, reset } = usePDFExtraction();
  const toast = useToast();

  const applyMapInMain = useCallback(
    async (incoming: MapModuleDetachState | null): Promise<boolean> => {
      const result = await planSwapToMapInMain({
        incoming,
        visibility: moduleVisibilityRef.current,
      });

      if (!result.ok) {
        toast.error(result.message);
        return false;
      }

      if (result.flushWarning) {
        toast.warning(
          'Could not fully save Transcript before switching. Recent autosave may still apply.'
        );
      }

      if (result.displacedTranscription) {
        setTranscriptionReattachState(result.displacedTranscription);
      }

      setTranscriptionLaunchSourcePath(null);
      setTranscriptionLaunchCasePath(null);
      setShowTranscription(false);
      setMapReattachState(incoming);
      setShowMap(true);

      if (incoming?.wordEditor?.isOpen) {
        window.setTimeout(() => {
          dispatchWordEditorReattach(incoming.wordEditor!);
        }, 100);
      }

      return true;
    },
    [toast]
  );

  const applyTranscriptionInMain = useCallback(
    async (
      incoming: TranscriptionModuleDetachState | null,
      launch?: { sourcePath?: string | null; casePath?: string | null }
    ): Promise<boolean> => {
      const result = await planSwapToTranscriptionInMain({
        incoming,
        visibility: moduleVisibilityRef.current,
        launchSourcePath: launch?.sourcePath,
        launchCasePath: launch?.casePath,
      });

      if (!result.ok) {
        toast.error(result.message);
        return false;
      }

      if (result.flushWarning) {
        toast.warning(
          'Could not fully save Map before switching. Recent autosave may still apply.'
        );
      }

      if (result.displacedMap) {
        setMapReattachState(result.displacedMap);
      }

      setShowMap(false);

      if (incoming) {
        setTranscriptionReattachState(incoming);
        setTranscriptionLaunchSourcePath(incoming.launchSourcePath);
        setTranscriptionLaunchCasePath(incoming.launchCasePath);
      } else {
        setTranscriptionReattachState(null);
        setTranscriptionLaunchSourcePath(launch?.sourcePath ?? null);
        setTranscriptionLaunchCasePath(launch?.casePath ?? null);
      }

      setShowTranscription(true);
      return true;
    },
    [toast]
  );

  const applyFileConverterInMain = useCallback((incoming: FileConverterModuleDetachState | null) => {
    setShowMap(false);
    setShowTranscription(false);
    setFileConverterReattachState(incoming);
    setShowFileConverter(true);
    return true;
  }, []);

  useEffect(() => {
    const handleMapReattach = (event: Event) => {
      const detail = (event as CustomEvent<MapModuleDetachState>).detail;
      if (!detail) return;
      void applyMapInMain(detail);
    };

    const handleTranscriptionReattach = (event: Event) => {
      const detail = (event as CustomEvent<TranscriptionModuleDetachState>).detail;
      if (!detail) return;
      void applyTranscriptionInMain(detail);
    };

    const handleFileConverterReattach = (event: Event) => {
      const detail = (event as CustomEvent<FileConverterModuleDetachState>).detail;
      if (!detail) return;
      applyFileConverterInMain(detail);
    };

    window.addEventListener('reattach-map-module-data', handleMapReattach as EventListener);
    window.addEventListener(
      'reattach-transcription-module-data',
      handleTranscriptionReattach as EventListener
    );
    window.addEventListener(
      'reattach-file-converter-module-data',
      handleFileConverterReattach as EventListener
    );

    const storedMap = (window as Window & { __reattachMapModuleData?: MapModuleDetachState })
      .__reattachMapModuleData;
    if (storedMap) {
      void applyMapInMain(storedMap);
      delete (window as Window & { __reattachMapModuleData?: MapModuleDetachState })
        .__reattachMapModuleData;
    }

    const storedTranscription = (
      window as Window & { __reattachTranscriptionModuleData?: TranscriptionModuleDetachState }
    ).__reattachTranscriptionModuleData;
    if (storedTranscription) {
      void applyTranscriptionInMain(storedTranscription);
      delete (
        window as Window & { __reattachTranscriptionModuleData?: TranscriptionModuleDetachState }
      ).__reattachTranscriptionModuleData;
    }

    const storedFileConverter = (
      window as Window & { __reattachFileConverterModuleData?: FileConverterModuleDetachState }
    ).__reattachFileConverterModuleData;
    if (storedFileConverter) {
      applyFileConverterInMain(storedFileConverter);
      delete (
        window as Window & { __reattachFileConverterModuleData?: FileConverterModuleDetachState }
      ).__reattachFileConverterModuleData;
    }

    return () => {
      window.removeEventListener('reattach-map-module-data', handleMapReattach as EventListener);
      window.removeEventListener(
        'reattach-transcription-module-data',
        handleTranscriptionReattach as EventListener
      );
      window.removeEventListener(
        'reattach-file-converter-module-data',
        handleFileConverterReattach as EventListener
      );
    };
  }, [applyMapInMain, applyTranscriptionInMain, applyFileConverterInMain]);
  const { settings, updateSettings } = useSettingsContext();
  const { isOpen: isWordEditorOpen, dividerPosition, setDividerPosition, isDividerDragging } = useWordEditor();
  const [shouldUseOverlayMode, setShouldUseOverlayMode] = useState(false);

  // Check if onboarding should be shown
  useEffect(() => {
    // Don't override if onboarding was just completed in this session
    if (onboardingCompletedRef.current) {
      console.log('[Onboarding] Onboarding was completed in this session, not overriding');
      return;
    }

    if (settings) {
      // If showOnboarding is explicitly false, don't show
      // If undefined/null (new user), default to true
      // For new users without settings, showOnboarding will be true by default
      const shouldShow = settings.showOnboarding !== false;
      console.log('[Onboarding] Settings loaded:', { 
        showOnboarding: settings.showOnboarding, 
        shouldShow,
        type: typeof settings.showOnboarding,
        settingsKeys: Object.keys(settings),
        hasShowOnboarding: 'showOnboarding' in settings,
      });
      console.log('[Onboarding] Setting showOnboarding to:', shouldShow, 'from settings:', settings.showOnboarding);
      setShowOnboarding(shouldShow);
    } else {
      // If settings haven't loaded yet, keep showOnboarding as true (default for new users)
      console.log('[Onboarding] Settings not loaded yet, defaulting to true');
      setShowOnboarding(true);
    }
  }, [settings]);

  // Apply theme to document body
  useEffect(() => {
    if (settings?.theme) {
      const theme = settings.theme;
      console.log('[App] Applying theme to document:', theme);
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      
      // Also apply as class for CSS targeting
      document.documentElement.classList.remove('theme-pastel', 'theme-brideware-purple');
      document.documentElement.classList.add(`theme-${theme}`);
      document.body.classList.remove('theme-pastel', 'theme-brideware-purple');
      document.body.classList.add(`theme-${theme}`);
    }
  }, [settings?.theme]);

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

  // If in detached extraction mode, show only the extraction component
  const shouldShowDetachedExtraction = 
    window.location.search.includes('extraction=detached') || 
    window.location.hash.includes('extraction=detached');
  
  if (shouldShowDetachedExtraction) {
    return <DetachedPDFExtraction />;
  }

  // If in detached editor mode, show only the editor
  // Use direct check as fallback in case state hasn't updated yet (for production builds)
  const shouldShowDetached = isDetachedEditor || 
    window.location.search.includes('editor=detached') || 
    window.location.hash.includes('editor=detached');
  
  if (shouldShowDetached) {
    return <DetachedWordEditor />;
  }

  if (isDetachedRoute('map=detached')) {
    const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
    return (
      <>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
              Loading Map...
            </div>
          }
        >
          <MapModule theme={theme} hostMode="detached" onExit={() => void window.electronAPI?.closeWindow?.()} />
        </Suspense>
        <ToastContainer />
        <SettingsPanel
          hideWordEditorButton={true}
          isArchiveVisible={false}
          hideFixedButtons={true}
          inlineWordEditorContainerId="map-word-editor-inline-container"
        />
      </>
    );
  }

  if (isDetachedRoute('transcription=detached')) {
    const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
    return (
      <>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
              Loading Transcript...
            </div>
          }
        >
          <TranscriptionModule
            theme={theme}
            hostMode="detached"
            onExit={() => void window.electronAPI?.closeWindow?.()}
          />
        </Suspense>
        <ToastContainer />
        <SettingsPanel
          hideWordEditorButton={true}
          isArchiveVisible={false}
          hideFixedButtons={true}
        />
      </>
    );
  }

  if (isDetachedRoute('file-converter=detached')) {
    const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
    return (
      <>
        <Suspense
          fallback={
            <FileConverterLoadingShell
              theme={theme}
              onClose={() => void window.electronAPI?.closeWindow?.()}
            />
          }
        >
          <FileConverterModule
            theme={theme}
            hostMode="detached"
            onExit={() => void window.electronAPI?.closeWindow?.()}
          />
        </Suspense>
        <ToastContainer />
        <SettingsPanel hideWordEditorButton={true} isArchiveVisible={false} hideFixedButtons={true} />
      </>
    );
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
      const { pdfPath, pageNumber } = event.detail;
      
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
      
      // Don't close the word editor when opening bookmarks - keep it open so users can access typing/notes
      // The panel should remain open regardless of where the bookmark is opened from
      
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

    const handleOpenWordEditorFromViewer = () => {
      // When word editor is opened from PDF viewer, use overlay mode to preserve viewer state
      setShouldUseOverlayMode(true);
    };

    const handleCloseWordEditor = () => {
      // Reset overlay mode flag when word editor closes
      setShouldUseOverlayMode(false);
    };

    window.addEventListener('open-bookmark' as any, handleOpenBookmark as EventListener);
    window.addEventListener('navigate-to-case-folder' as any, handleNavigateToCaseFolder as EventListener);
    window.addEventListener('open-word-editor-from-viewer' as any, handleOpenWordEditorFromViewer as EventListener);
    window.addEventListener('close-word-editor' as any, handleCloseWordEditor as EventListener);
    return () => {
      window.removeEventListener('open-bookmark' as any, handleOpenBookmark as EventListener);
      window.removeEventListener('navigate-to-case-folder' as any, handleNavigateToCaseFolder as EventListener);
      window.removeEventListener('open-word-editor-from-viewer' as any, handleOpenWordEditorFromViewer as EventListener);
      window.removeEventListener('close-word-editor' as any, handleCloseWordEditor as EventListener);
    };
  }, [showArchive, isWordEditorOpen]);

  // Update memory manager when settings change
  useEffect(() => {
    if (settings) {
      const memoryManager = getMemoryManager();
      memoryManager.updateSettings(settings);
    }
  }, [settings]);

  // Reset overlay mode flag when word editor closes
  useEffect(() => {
    if (!isWordEditorOpen) {
      setShouldUseOverlayMode(false);
    }
  }, [isWordEditorOpen]);

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
        const defaultSettings: ConversionSettings = {
          dpi: 150,
          quality: 85,
          format: 'jpeg',
          pageRange: 'all',
          colorSpace: 'rgb',
          compressionLevel: 6,
        };
        extractPDF(filePath, defaultSettings).then((pages) => {
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

      // Helper function to generate fileName from PDF path and page number
      const generateFileName = (pdfPath: string, pageNumber: number, imageData: string): string => {
        const pdfBasename = pdfPath.replace(/\\/g, '/').split('/').pop()?.replace(/\.pdf$/i, '') || 'page';
        // Detect format from imageData (data:image/png or data:image/jpeg)
        const isPng = imageData.startsWith('data:image/png');
        const ext = isPng ? 'png' : 'jpg';
        return `${pdfBasename}_page_${String(pageNumber).padStart(3, '0')}.${ext}`;
      };

      const result = await window.electronAPI.saveFiles({
        saveDirectory,
        saveParentFile,
        saveToZip,
        folderName: zipFolderName,
        parentFilePath: selectedPdfPath,
        extractedPages: extractedPages.map((page) => ({
          pageNumber: page.pageNumber,
          imageData: page.imageData,
          fileName: generateFileName(selectedPdfPath, page.pageNumber, page.imageData),
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

  if (showFileConverter) {
    const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
    return (
      <>
        <Suspense
          fallback={
            <FileConverterLoadingShell
              theme={theme}
              onClose={() => setShowFileConverter(false)}
            />
          }
        >
          <FileConverterModule
            theme={theme}
            hostMode="embedded"
            initialNavigationState={fileConverterReattachState}
            onNavigationStateConsumed={() => setFileConverterReattachState(null)}
            onPopOutComplete={() => setShowFileConverter(false)}
            onExit={() => setShowFileConverter(false)}
          />
        </Suspense>
        <ToastContainer />
        <SettingsPanel hideWordEditorButton={true} isArchiveVisible={false} hideFixedButtons={true} />
      </>
    );
  }

  // Show Map feature
  if (showMap) {
    const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
    return (
      <>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
              Loading Map...
            </div>
          }
        >
          <MapModule
            theme={theme}
            hostMode="embedded"
            initialNavigationState={mapReattachState}
            onNavigationStateConsumed={() => setMapReattachState(null)}
            onPopOutComplete={() => setShowMap(false)}
            onExit={() => setShowMap(false)}
          />
        </Suspense>
        <ToastContainer />
        <SettingsPanel
          hideWordEditorButton={true}
          isArchiveVisible={false}
          hideFixedButtons={true}
          inlineWordEditorContainerId="map-word-editor-inline-container"
        />
      </>
    );
  }

  if (showTranscription) {
    const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
    return (
      <>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
              Loading Transcript...
            </div>
          }
        >
          <TranscriptionModule
            theme={theme}
            hostMode="embedded"
            initialNavigationState={transcriptionReattachState}
            onNavigationStateConsumed={() => setTranscriptionReattachState(null)}
            onPopOutComplete={() => {
              setShowTranscription(false);
              setTranscriptionLaunchSourcePath(null);
              setTranscriptionLaunchCasePath(null);
            }}
            onExit={() => {
              setShowTranscription(false);
              setTranscriptionLaunchSourcePath(null);
              setTranscriptionLaunchCasePath(null);
            }}
            initialSourcePath={transcriptionLaunchSourcePath}
            initialCasePath={transcriptionLaunchCasePath}
          />
        </Suspense>
        <ToastContainer />
        <SettingsPanel
          hideWordEditorButton={true}
          isArchiveVisible={false}
          hideFixedButtons={true}
        />
      </>
    );
  }

  // Show archive if requested
  if (showArchive) {
    // Always render the same structure to prevent ArchivePage from remounting
    // Just adjust the layout based on whether word editor is open
    const useSideBySideLayout = isWordEditorOpen && !shouldUseOverlayMode;
    
    return (
      <>
        <div className={`h-screen overflow-hidden ${useSideBySideLayout ? 'flex' : ''}`}>
          {/* Archive container - always rendered in same position, just width changes */}
          <div 
            className={`overflow-auto ${isDividerDragging ? '' : 'transition-all duration-300'}`}
            style={useSideBySideLayout ? { width: `${dividerPosition}%` } : { width: '100%' }}
          >
            <Suspense
              fallback={
                (() => {
                  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
                  const isPastel = isLightTheme(theme);
                  
                  return (
                    <div className={`relative min-h-screen flex items-center justify-center overflow-hidden ${
                      isPastel
                        ? 'bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50'
                        : 'bg-gradient-to-br from-gray-950 via-purple-950/50 to-gray-950'
                    }`}>
                      {/* Animated Background Grid */}
                      <div 
                        className={`absolute inset-0 ${isPastel ? 'opacity-10' : 'opacity-20'}`}
                        style={{
                          backgroundImage: isPastel
                            ? `
                              linear-gradient(rgba(251, 182, 206, 0.15) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(251, 182, 206, 0.15) 1px, transparent 1px)
                            `
                            : `
                              linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
                            `,
                          backgroundSize: '50px 50px',
                          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)',
                        }}
                      />
                      
                      {/* Content */}
                      <div className="relative z-10 text-center space-y-6">
                        {/* Modern Spinner with Gradient */}
                        <div className="inline-flex items-center justify-center">
                          <div className="relative">
                            {isPastel ? (
                              <>
                                {/* Pastel Theme Spinner */}
                                {/* Outer Glow Ring */}
                                <div className="absolute inset-0 border-4 border-pink-300/40 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                                <div className="absolute inset-2 border-2 border-purple-300/50 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                                
                                {/* Main Spinner */}
                                <div className="relative w-16 h-16">
                                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-400 border-r-purple-400 animate-spin"></div>
                                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-400 border-l-pink-400 animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}></div>
                                </div>
                                
                                {/* Center Glow */}
                                <div className="absolute inset-4 bg-gradient-to-br from-pink-300/30 to-purple-300/30 rounded-full blur-xl"></div>
                                
                                {/* Soft pastel particles effect */}
                                <div className="absolute inset-0 rounded-full">
                                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-pink-300/40 rounded-full blur-sm animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                                  <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-purple-300/40 rounded-full blur-sm animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '2s' }}></div>
                                  <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-blue-300/40 rounded-full blur-sm animate-pulse" style={{ animationDelay: '1s', animationDuration: '2s' }}></div>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* Dark Theme Spinner */}
                                {/* Outer Glow Ring */}
                                <div className="absolute inset-0 border-4 border-cyber-purple-400/40 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                                <div className="absolute inset-2 border-2 border-cyber-cyan-400/50 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                                
                                {/* Main Spinner */}
                                <div className="relative w-16 h-16">
                                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyber-purple-400 border-r-cyber-cyan-400 animate-spin"></div>
                                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-cyber-cyan-400 border-l-cyber-purple-400 animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}></div>
                                </div>
                                
                                {/* Center Glow */}
                                <div className="absolute inset-4 bg-gradient-to-br from-cyber-purple-400/20 to-cyber-cyan-400/20 rounded-full blur-xl"></div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Loading Text */}
                        <div className="space-y-2">
                          <p className={`text-xl font-semibold bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] ${
                            isPastel
                              ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400'
                              : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400'
                          }`}>
                            Loading Archive...
                          </p>
                          <p className={`text-sm font-medium ${isPastel ? 'text-gray-600' : 'text-gray-400'}`}>Initializing vault systems</p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              }
            >
              <ArchivePage
                key="archive-page"
                onBack={() => setShowArchive(false)}
                onOpenTranscription={(sourcePath, casePath) => {
                  warmTranscriptionEntry();
                  setShowArchive(false);
                  void applyTranscriptionInMain(null, { sourcePath, casePath });
                }}
              />
            </Suspense>
          </div>
          
          {/* Resizable Divider - only shown in side-by-side layout */}
          {useSideBySideLayout && (
            <ResizableDivider
              position={dividerPosition}
              onResize={setDividerPosition}
              minLeft={20}
              minRight={30}
            />
          )}
          
          {/* Editor container - only shown in side-by-side layout */}
          {useSideBySideLayout && (
            <div 
              id="word-editor-inline-container"
              className={`overflow-hidden h-full ${isDividerDragging ? '' : 'transition-all duration-300'}`}
              style={{ width: `${100 - dividerPosition}%` }}
            />
          )}
        </div>
        <SettingsPanel isArchiveVisible={true} hideFixedButtons={true} />
        <ToastContainer />
      </>
    );
  }

  // Show welcome screen if no PDF selected and not extracting
  if (!selectedPdfPath && !isExtracting && extractedPages.length === 0) {
    console.log('[Onboarding] Rendering welcome screen, showOnboarding:', showOnboarding, typeof showOnboarding);
    return (
      <>
        {/* Show onboarding modal if needed - ALWAYS render it first */}
        {showOnboarding && (
          <OnboardingModal
            onComplete={async (theme: Theme, dontShowAgain: boolean) => {
              console.log('[Onboarding] Completing onboarding - theme:', theme, 'dontShowAgain:', dontShowAgain);
              try {
                // Mark onboarding as completed to prevent useEffect from overriding
                onboardingCompletedRef.current = true;
                setShowOnboarding(false);
                
                console.log('[Onboarding] Updating settings with theme:', theme);
                await updateSettings({
                  showOnboarding: !dontShowAgain,
                  theme,
                });
                console.log('[Onboarding] Settings updated successfully, theme set to:', theme);
                
                // Force a small delay to ensure settings context has updated
                // The useEffect above will pick up the theme change from settings context
                setTimeout(() => {
                  console.log('[Onboarding] Settings should now be updated in context');
                }, 100);
              } catch (error) {
                console.error('[Onboarding] Failed to update settings:', error);
                // Reset the ref if update failed so onboarding can be shown again
                onboardingCompletedRef.current = false;
              }
            }}
          />
        )}
        <div 
          className="transition-all duration-300"
        >
          <WelcomeScreen 
            onSelectFile={handleSelectFile}
            onOpenArchive={() => setShowArchive(true)}
            onOpenSecurityChecker={() => setShowSecurityChecker(true)}
            onOpenPDFExtraction={() => setShowPDFExtraction(true)}
            onOpenFileConverter={() => {
              void prefetchFileConverterModule();
              setShowFileConverter(true);
            }}
            onOpenMap={() => {
              void prefetchMapModule();
              void applyMapInMain(null);
            }}
            onOpenTranscription={() => {
              void prefetchTranscriptionModule();
              void applyTranscriptionInMain(null);
            }}
          />
        </div>
        <ToastContainer />
        <SettingsPanel hideWordEditorButton={true} isArchiveVisible={false} hideFixedButtons={true} />
        <SecurityCheckerModal
          isOpen={showSecurityChecker}
          onClose={() => setShowSecurityChecker(false)}
        />
        <PDFExtractionModal
          isOpen={showPDFExtraction}
          onClose={() => setShowPDFExtraction(false)}
        />
      </>
    );
  }

  // Show extraction view even if no pages extracted yet (during extraction)
  if (selectedPdfPath && extractedPages.length === 0 && !isExtracting && !error) {
    // This shouldn't happen, but just in case
    const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
    const isPastel = isLightTheme(theme);
    
    return (
      <>
        <div className={`relative min-h-screen flex items-center justify-center overflow-hidden ${
          isPastel
            ? 'bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50'
            : 'bg-gradient-to-br from-gray-950 via-purple-950/50 to-gray-950'
        }`}>
          {/* Animated Background Grid */}
          <div 
            className={`absolute inset-0 ${isPastel ? 'opacity-10' : 'opacity-20'}`}
            style={{
              backgroundImage: isPastel
                ? `
                  linear-gradient(rgba(251, 182, 206, 0.15) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(251, 182, 206, 0.15) 1px, transparent 1px)
                `
                : `
                  linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
                `,
              backgroundSize: '50px 50px',
              maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)',
            }}
          />
          
          {/* Content */}
          <div className="relative z-10 text-center space-y-6">
            {/* Modern Spinner with Gradient */}
            <div className="inline-flex items-center justify-center">
              <div className="relative">
                {isPastel ? (
                  <>
                    {/* Pastel Theme Spinner */}
                    {/* Outer Glow Ring */}
                    <div className="absolute inset-0 border-4 border-pink-300/40 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute inset-2 border-2 border-purple-300/50 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                    
                    {/* Main Spinner */}
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-400 border-r-purple-400 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-400 border-l-pink-400 animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}></div>
                    </div>
                    
                    {/* Center Glow */}
                    <div className="absolute inset-4 bg-gradient-to-br from-pink-300/30 to-purple-300/30 rounded-full blur-xl"></div>
                    
                    {/* Soft pastel particles effect */}
                    <div className="absolute inset-0 rounded-full">
                      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-pink-300/40 rounded-full blur-sm animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                      <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-purple-300/40 rounded-full blur-sm animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '2s' }}></div>
                      <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-blue-300/40 rounded-full blur-sm animate-pulse" style={{ animationDelay: '1s', animationDuration: '2s' }}></div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Dark Theme Spinner */}
                    {/* Outer Glow Ring */}
                    <div className="absolute inset-0 border-4 border-cyber-purple-400/40 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute inset-2 border-2 border-cyber-cyan-400/50 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                    
                    {/* Main Spinner */}
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyber-purple-400 border-r-cyber-cyan-400 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-cyber-cyan-400 border-l-cyber-purple-400 animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}></div>
                    </div>
                    
                    {/* Center Glow */}
                    <div className="absolute inset-4 bg-gradient-to-br from-cyber-purple-400/20 to-cyber-cyan-400/20 rounded-full blur-xl"></div>
                  </>
                )}
              </div>
            </div>
            
            {/* Loading Text */}
            <div className="space-y-2">
              <p className={`text-xl font-semibold bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] ${
                isPastel
                  ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400'
                  : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400'
              }`}>
                Preparing...
              </p>
              <p className={`text-sm font-medium ${isPastel ? 'text-gray-600' : 'text-gray-400'}`}>Initializing extraction systems</p>
            </div>
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

