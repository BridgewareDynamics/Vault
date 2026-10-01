import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';

import { Theme, MapDocument } from '../../types';

import { useToast } from '../Toast/ToastContext';

import { getUserFriendlyError } from '../../utils/errorMessages';

import {

  prefetchMapDocument,

  prefetchMapEditorPage,

  prefetchMapLibrary,

  warmMapEntry,

} from '../../utils/mapPrefetch';

import type {

  MapModuleDetachState,

  MapScreen,

  ModuleHostMode,

} from '../../types/detachableModules';

import { collectWordEditorSnapshot } from '../../utils/wordEditorSnapshot';
import {
  COLLECT_EMBEDDED_MAP_EVENT,
  EMBEDDED_MAP_SNAPSHOT_RESPONSE,
} from '../../utils/embeddedModuleSnapshot';

import { useWordEditor } from '../../contexts/WordEditorContext';

import { isLightTheme } from '../../theme/themeSemantics';

import { MapLandingPage } from './MapLandingPage';

import { NewMapNameDialog } from './NewMapNameDialog';



const MapLibraryPage = lazy(() =>

  import('./MapLibraryPage').then((module) => ({ default: module.MapLibraryPage }))

);

const MapEditorPage = lazy(() =>

  import('./MapEditorPage').then((module) => ({ default: module.MapEditorPage }))

);



export interface MapEditorDetachBridge {

  flushAndSnapshot: () => Promise<{

    editorDocument: MapDocument | null;

    editorMapPath: string;

  } | null>;

}



interface MapModuleProps {

  theme: Theme;

  onExit: () => void;

  hostMode?: ModuleHostMode;

  initialNavigationState?: MapModuleDetachState | null;

  onNavigationStateConsumed?: () => void;

  onPopOutComplete?: () => void;

}



function MapScreenFallback({ message }: { message: string }) {

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">

      <p className="text-white/70">{message}</p>

    </div>

  );

}



function applyNavigationState(

  state: MapModuleDetachState,

  setters: {

    setScreen: (s: MapScreen) => void;

    setEditorMapPath: (p: string | null) => void;

    setInitialEditorDocument: (d: MapDocument | null) => void;

    setAutoEditTitleKey: (k: number | null) => void;

  }

) {

  setters.setScreen(state.screen);

  setters.setEditorMapPath(state.editorMapPath);

  setters.setInitialEditorDocument(state.editorDocument);

  setters.setAutoEditTitleKey(state.autoEditTitleKey);

}



export function MapModule({

  theme,

  onExit,

  hostMode = 'embedded',

  initialNavigationState = null,

  onNavigationStateConsumed,

  onPopOutComplete,

}: MapModuleProps) {

  const toast = useToast();

  const isDetached = hostMode === 'detached';

  const isPastel = isLightTheme(theme);

  const { isOpen: isWordEditorOpen } = useWordEditor();

  const editorBridgeRef = useRef<MapEditorDetachBridge | null>(null);



  const [screen, setScreen] = useState<MapScreen>('landing');

  const [editorMapPath, setEditorMapPath] = useState<string | null>(null);

  const [initialEditorDocument, setInitialEditorDocument] = useState<MapDocument | null>(null);

  const [autoEditTitleKey, setAutoEditTitleKey] = useState<number | null>(null);

  const [showNewMapDialog, setShowNewMapDialog] = useState(false);

  const [isReattaching, setIsReattaching] = useState(false);

  const [isPoppingOut, setIsPoppingOut] = useState(false);

  const consumedInitialNavRef = useRef(false);



  useEffect(() => {

    warmMapEntry();

  }, []);



  useEffect(() => {

    if (!initialNavigationState || consumedInitialNavRef.current) return;

    consumedInitialNavRef.current = true;

    applyNavigationState(initialNavigationState, {

      setScreen,

      setEditorMapPath,

      setInitialEditorDocument,

      setAutoEditTitleKey,

    });

    onNavigationStateConsumed?.();

  }, [initialNavigationState, onNavigationStateConsumed]);



  useEffect(() => {

    const handleInitialData = (event: Event) => {

      const detail = (event as CustomEvent<MapModuleDetachState>).detail;

      if (!detail) return;

      applyNavigationState(detail, {

        setScreen,

        setEditorMapPath,

        setInitialEditorDocument,

        setAutoEditTitleKey,

      });

    };



    window.addEventListener('map-module-data', handleInitialData as EventListener);



    const stored = (window as Window & { __mapModuleInitialData?: MapModuleDetachState })

      .__mapModuleInitialData;

    if (stored) {

      handleInitialData({ detail: stored } as CustomEvent<MapModuleDetachState>);

      delete (window as Window & { __mapModuleInitialData?: MapModuleDetachState })

        .__mapModuleInitialData;

    }



    return () => {

      window.removeEventListener('map-module-data', handleInitialData as EventListener);

    };

  }, []);



  const ensureVault = useCallback(async (): Promise<boolean> => {

    if (!window.electronAPI?.getArchiveConfig) return false;

    const config = await window.electronAPI.getArchiveConfig();

    if (!config.archiveDrive) {

      toast.error('Configure your Vault archive drive in Settings before using Map.');

      return false;

    }

    return true;

  }, [toast]);



  const collectDetachState = useCallback(async (): Promise<MapModuleDetachState> => {

    let editorDocument: MapDocument | null = initialEditorDocument;

    let mapPath = editorMapPath;



    if (screen === 'editor' && editorBridgeRef.current) {

      const snapshot = await editorBridgeRef.current.flushAndSnapshot();

      if (snapshot) {

        editorDocument = snapshot.editorDocument;

        mapPath = snapshot.editorMapPath;

      }

    }



    let wordEditor: MapModuleDetachState['wordEditor'];

    if (isWordEditorOpen) {

      const snapshot = await collectWordEditorSnapshot();

      if (snapshot) {

        wordEditor = snapshot;

      }

    }



    return {

      screen,

      editorMapPath: mapPath,

      editorDocument,

      autoEditTitleKey,

      wordEditor,

    };

  }, [autoEditTitleKey, editorMapPath, initialEditorDocument, isWordEditorOpen, screen]);

  const collectDetachStateRef = useRef(collectDetachState);
  collectDetachStateRef.current = collectDetachState;

  useEffect(() => {
    if (hostMode !== 'embedded') return;

    const handleCollectEmbedded = async () => {
      try {
        const state = await collectDetachStateRef.current();
        window.dispatchEvent(
          new CustomEvent(EMBEDDED_MAP_SNAPSHOT_RESPONSE, {
            detail: { state },
          })
        );
      } catch (error) {
        window.dispatchEvent(
          new CustomEvent(EMBEDDED_MAP_SNAPSHOT_RESPONSE, {
            detail: {
              state: null,
              error: error instanceof Error ? error.message : 'Failed to save Map',
            },
          })
        );
      }
    };

    window.addEventListener(COLLECT_EMBEDDED_MAP_EVENT, handleCollectEmbedded);
    return () => {
      window.removeEventListener(COLLECT_EMBEDDED_MAP_EVENT, handleCollectEmbedded);
    };
  }, [hostMode]);

  const handlePopOut = useCallback(async () => {

    if (!window.electronAPI?.createMapWindow) {

      toast.error('Pop out is only available in the desktop app.');

      return;

    }

    if (isPoppingOut) return;



    setIsPoppingOut(true);

    try {

      const state = await collectDetachState();

      await window.electronAPI.createMapWindow(state);

      if (isDetached) {

        await window.electronAPI.closeWindow?.();

      } else {

        onPopOutComplete?.();

        toast.info('Map opened in a separate window');

      }

    } catch (error) {

      toast.error(getUserFriendlyError(error, { operation: 'popping out map' }));

    } finally {

      setIsPoppingOut(false);

    }

  }, [collectDetachState, isDetached, isPoppingOut, onPopOutComplete, toast]);



  const handleReattach = useCallback(async () => {

    if (!window.electronAPI?.reattachMapModule) {

      toast.error('Dock to Vault is only available in the desktop app.');

      return;

    }

    if (isReattaching) return;



    setIsReattaching(true);

    try {

      const state = await collectDetachState();

      await window.electronAPI.reattachMapModule(state);

      toast.info('Map docked to Vault');

      window.setTimeout(() => setIsReattaching(false), 1000);

    } catch (error) {

      toast.error(getUserFriendlyError(error, { operation: 'docking map' }));

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



  const handleCreateNamedMap = useCallback(async (mapName: string) => {

    if (!(await ensureVault())) return;

    if (!window.electronAPI?.createMap) return;

    try {

      const title = mapName.trim() || 'Untitled Map';

      const doc = await window.electronAPI.createMap(title, null);

      void prefetchMapEditorPage();

      setInitialEditorDocument(doc as MapDocument);

      setEditorMapPath(doc.mapFolderPath);

      setAutoEditTitleKey(Date.now());

      setShowNewMapDialog(false);

      setScreen('editor');

    } catch (error) {

      toast.error(getUserFriendlyError(error, { operation: 'creating map' }));

    }

  }, [ensureVault, toast]);



  const handleOpenLibrary = useCallback(async () => {

    if (!(await ensureVault())) return;

    void prefetchMapLibrary();

    setScreen('library');

  }, [ensureVault]);



  const handleOpenMap = useCallback((mapFolderPath: string) => {

    void prefetchMapEditorPage();

    void prefetchMapDocument(mapFolderPath);

    setInitialEditorDocument(null);

    setEditorMapPath(mapFolderPath);

    setAutoEditTitleKey(null);

    setScreen('editor');

  }, []);



  const handleLeaveEditor = useCallback(() => {

    setInitialEditorDocument(null);

    setEditorMapPath(null);

    setScreen('landing');

  }, []);



  if (screen === 'editor' && editorMapPath) {

    return (

      <Suspense fallback={<MapScreenFallback message="Loading editor..." />}>

        <MapEditorPage

          theme={theme}

          mapFolderPath={editorMapPath}

          initialDocument={initialEditorDocument}

          autoEditTitleKey={autoEditTitleKey}

          onBack={handleLeaveEditor}

          onHome={handleHome}

          registerEditorBridge={(bridge) => {

            editorBridgeRef.current = bridge;

          }}

          {...chromeProps}

        />

      </Suspense>

    );

  }



  if (screen === 'library') {

    return (

      <Suspense fallback={<MapScreenFallback message="Loading library..." />}>

        <MapLibraryPage

          theme={theme}

          onBack={() => setScreen('landing')}

          onOpenMap={handleOpenMap}

          {...chromeProps}

        />

      </Suspense>

    );

  }



  return (

    <>

      <MapLandingPage

        theme={theme}

        onBack={handleHome}

        onNewMap={() => setShowNewMapDialog(true)}

        onOpenLibrary={handleOpenLibrary}

        {...chromeProps}

      />

      <NewMapNameDialog

        isOpen={showNewMapDialog}

        theme={theme}

        onClose={() => setShowNewMapDialog(false)}

        onConfirm={handleCreateNamedMap}

      />

    </>

  );

}


