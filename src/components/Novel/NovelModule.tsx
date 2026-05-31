import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { Theme, NovelDocument } from '../../types';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import {
  prefetchNovelDocument,
  prefetchNovelEditorPage,
  prefetchNovelLibrary,
  warmNovelEntry,
  setCachedNovelLibrary,
} from '../../utils/novelPrefetch';
import type {
  NovelModuleDetachState,
  NovelScreen,
  ModuleHostMode,
} from '../../types/detachableModules';
import { collectWordEditorSnapshot } from '../../utils/wordEditorSnapshot';
import {
  COLLECT_EMBEDDED_NOVEL_EVENT,
  EMBEDDED_NOVEL_SNAPSHOT_RESPONSE,
} from '../../utils/embeddedModuleSnapshot';
import { useWordEditor } from '../../contexts/WordEditorContext';
import { isLightTheme } from '../../theme/themeSemantics';
import { NovelLandingPage } from './NovelLandingPage';
import { NewNovelDialog } from './NewNovelDialog';
import type { NovelEditorDetachBridge } from './NovelEditorPage';

const NovelLibraryPage = lazy(() =>
  import('./NovelLibraryPage').then((module) => ({ default: module.NovelLibraryPage }))
);
const NovelEditorPage = lazy(() =>
  import('./NovelEditorPage').then((module) => ({ default: module.NovelEditorPage }))
);

interface NovelModuleProps {
  theme: Theme;
  onExit: () => void;
  hostMode?: ModuleHostMode;
  initialNavigationState?: NovelModuleDetachState | null;
  onNavigationStateConsumed?: () => void;
  onPopOutComplete?: () => void;
}

function NovelScreenFallback({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <p className="text-white/70">{message}</p>
    </div>
  );
}

function applyNavigationState(
  state: NovelModuleDetachState,
  setters: {
    setScreen: (s: NovelScreen) => void;
    setEditorNovelPath: (p: string | null) => void;
    setInitialEditorDocument: (d: NovelDocument | null) => void;
    setCurrentSpreadIndex: (i: number) => void;
  }
) {
  setters.setScreen(state.screen);
  setters.setEditorNovelPath(state.editorNovelPath);
  setters.setInitialEditorDocument(state.editorDocument);
  setters.setCurrentSpreadIndex(state.currentSpreadIndex ?? 0);
}

export function NovelModule({
  theme,
  onExit,
  hostMode = 'embedded',
  initialNavigationState = null,
  onNavigationStateConsumed,
  onPopOutComplete,
}: NovelModuleProps) {
  const toast = useToast();
  const isDetached = hostMode === 'detached';
  const isPastel = isLightTheme(theme);
  const { isOpen: isWordEditorOpen } = useWordEditor();
  const editorBridgeRef = useRef<NovelEditorDetachBridge | null>(null);
  const collectDetachStateRef = useRef<() => Promise<NovelModuleDetachState>>(async () => ({
    screen: 'landing',
    editorNovelPath: null,
    editorDocument: null,
    currentSpreadIndex: 0,
  }));

  const [screen, setScreen] = useState<NovelScreen>('landing');
  const [editorNovelPath, setEditorNovelPath] = useState<string | null>(null);
  const [initialEditorDocument, setInitialEditorDocument] = useState<NovelDocument | null>(null);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [showNewNovelDialog, setShowNewNovelDialog] = useState(false);
  const [isReattaching, setIsReattaching] = useState(false);
  const [isPoppingOut, setIsPoppingOut] = useState(false);
  const consumedInitialNavRef = useRef(false);

  useEffect(() => {
    warmNovelEntry();
  }, []);

  useEffect(() => {
    if (!initialNavigationState || consumedInitialNavRef.current) return;
    consumedInitialNavRef.current = true;
    applyNavigationState(initialNavigationState, {
      setScreen,
      setEditorNovelPath,
      setInitialEditorDocument,
      setCurrentSpreadIndex,
    });
    onNavigationStateConsumed?.();
  }, [initialNavigationState, onNavigationStateConsumed]);

  useEffect(() => {
    const handleInitialData = (event: Event) => {
      const detail = (event as CustomEvent<NovelModuleDetachState>).detail;
      if (!detail) return;
      applyNavigationState(detail, {
        setScreen,
        setEditorNovelPath,
        setInitialEditorDocument,
        setCurrentSpreadIndex,
      });
    };

    window.addEventListener('novel-module-data', handleInitialData as EventListener);
    const stored = (window as Window & { __novelModuleInitialData?: NovelModuleDetachState }).__novelModuleInitialData;
    if (stored) {
      handleInitialData({ detail: stored } as CustomEvent<NovelModuleDetachState>);
      delete (window as Window & { __novelModuleInitialData?: NovelModuleDetachState }).__novelModuleInitialData;
    }
    return () => window.removeEventListener('novel-module-data', handleInitialData as EventListener);
  }, []);

  const ensureVault = useCallback(async (): Promise<boolean> => {
    if (!window.electronAPI?.getArchiveConfig) return false;
    const config = await window.electronAPI.getArchiveConfig();
    if (!config.archiveDrive) {
      toast.error('Configure your Vault archive drive in Settings before using Novel.');
      return false;
    }
    return true;
  }, [toast]);

  const collectDetachState = useCallback(async (): Promise<NovelModuleDetachState> => {
    let editorDocument: NovelDocument | null = initialEditorDocument;
    let novelPath = editorNovelPath;
    let spreadIndex = currentSpreadIndex;

    if (screen === 'editor' && editorBridgeRef.current) {
      const snapshot = await editorBridgeRef.current.flushAndSnapshot();
      if (snapshot) {
        editorDocument = snapshot.editorDocument;
        novelPath = snapshot.editorNovelPath;
        spreadIndex = snapshot.currentSpreadIndex;
      }
    }

    let wordEditor: NovelModuleDetachState['wordEditor'];
    if (isWordEditorOpen) {
      const snapshot = await collectWordEditorSnapshot();
      if (snapshot) {
        wordEditor = snapshot;
      }
    }

    return {
      screen,
      editorNovelPath: novelPath,
      editorDocument,
      currentSpreadIndex: spreadIndex,
      wordEditor,
    };
  }, [currentSpreadIndex, editorNovelPath, initialEditorDocument, isWordEditorOpen, screen]);

  collectDetachStateRef.current = collectDetachState;

  useEffect(() => {
    if (hostMode !== 'embedded') return;

    const handleCollectEmbedded = async () => {
      try {
        const state = await collectDetachStateRef.current();
        window.dispatchEvent(
          new CustomEvent(EMBEDDED_NOVEL_SNAPSHOT_RESPONSE, {
            detail: { state },
          })
        );
      } catch (error) {
        window.dispatchEvent(
          new CustomEvent(EMBEDDED_NOVEL_SNAPSHOT_RESPONSE, {
            detail: {
              state: null,
              error: error instanceof Error ? error.message : 'Failed to save Novel',
            },
          })
        );
      }
    };

    window.addEventListener(COLLECT_EMBEDDED_NOVEL_EVENT, handleCollectEmbedded);
    return () => {
      window.removeEventListener(COLLECT_EMBEDDED_NOVEL_EVENT, handleCollectEmbedded);
    };
  }, [hostMode]);

  const handlePopOut = useCallback(async () => {
    if (!window.electronAPI?.createNovelWindow) {
      toast.error('Pop out is only available in the desktop app.');
      return;
    }
    if (isPoppingOut) return;
    setIsPoppingOut(true);
    try {
      const state = await collectDetachState();
      await window.electronAPI.createNovelWindow(state);
      if (isDetached) {
        await window.electronAPI.closeWindow?.();
      } else {
        onPopOutComplete?.();
        toast.info('Novel opened in a separate window');
      }
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'popping out novel' }));
    } finally {
      setIsPoppingOut(false);
    }
  }, [collectDetachState, isDetached, isPoppingOut, onPopOutComplete, toast]);

  const handleReattach = useCallback(async () => {
    if (!window.electronAPI?.reattachNovelModule) {
      toast.error('Dock to Vault is only available in the desktop app.');
      return;
    }
    if (isReattaching) return;
    setIsReattaching(true);
    try {
      const state = await collectDetachState();
      await window.electronAPI.reattachNovelModule(state);
      toast.info('Novel docked to Vault');
      window.setTimeout(() => setIsReattaching(false), 1000);
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'docking novel' }));
      setIsReattaching(false);
    }
  }, [collectDetachState, isReattaching, toast]);

  const handleHome = useCallback(() => {
    if (isDetached) {
      void window.electronAPI?.closeWindow?.();
      return;
    }
    onExit();
  }, [isDetached, onExit]);

  const chromeProps = {
    hostMode,
    onPopOut: handlePopOut,
    onReattach: handleReattach,
    popOutDisabled: isPoppingOut || isReattaching,
    isPastel,
  };

  const handleCreateNamedNovel = useCallback(
    async (name: string, casePath: string | null = null, bookSizeId: string = 'us-trade') => {
      if (!(await ensureVault())) return;
      if (!window.electronAPI?.createNovel) return;
      try {
        const doc = (await window.electronAPI.createNovel(name, casePath, bookSizeId)) as NovelDocument;
        setCachedNovelLibrary(null);
        setInitialEditorDocument(doc);
        setEditorNovelPath(doc.novelFolderPath);
        setCurrentSpreadIndex(0);
        setScreen('editor');
        setShowNewNovelDialog(false);
        void prefetchNovelEditorPage();
      } catch (error) {
        toast.error(getUserFriendlyError(error, { operation: 'creating novel' }));
      }
    },
    [ensureVault, toast]
  );

  const openEditor = useCallback((novelFolderPath: string) => {
    setInitialEditorDocument(null);
    setEditorNovelPath(novelFolderPath);
    setCurrentSpreadIndex(0);
    setScreen('editor');
    void prefetchNovelDocument(novelFolderPath);
    void prefetchNovelEditorPage();
  }, []);

  if (screen === 'editor' && editorNovelPath) {
    return (
      <Suspense fallback={<NovelScreenFallback message="Loading editor..." />}>
        <NovelEditorPage
          theme={theme}
          novelFolderPath={editorNovelPath}
          initialDocument={initialEditorDocument}
          initialSpreadIndex={currentSpreadIndex}
          onBack={() => setScreen('landing')}
          onRegisterDetachBridge={(bridge) => {
            editorBridgeRef.current = bridge;
          }}
          {...chromeProps}
        />
      </Suspense>
    );
  }

  if (screen === 'library') {
    return (
      <Suspense fallback={<NovelScreenFallback message="Loading library..." />}>
        <NovelLibraryPage
          theme={theme}
          onBack={() => setScreen('landing')}
          onOpenNovel={openEditor}
          {...chromeProps}
        />
      </Suspense>
    );
  }

  return (
    <>
      <NovelLandingPage
        theme={theme}
        onBack={handleHome}
        onNewNovel={() => setShowNewNovelDialog(true)}
        onOpenLibrary={() => {
          void prefetchNovelLibrary();
          setScreen('library');
        }}
        {...chromeProps}
      />
      <NewNovelDialog
        isOpen={showNewNovelDialog}
        theme={theme}
        onClose={() => setShowNewNovelDialog(false)}
        onConfirm={(name, casePath, bookSizeId) => void handleCreateNamedNovel(name, casePath, bookSizeId)}
      />
    </>
  );
}
