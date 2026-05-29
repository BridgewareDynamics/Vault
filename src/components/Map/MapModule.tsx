import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Theme, MapDocument } from '../../types';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import {
  prefetchMapDocument,
  prefetchMapEditorPage,
  prefetchMapLibrary,
  warmMapEntry,
} from '../../utils/mapPrefetch';
import { MapLandingPage } from './MapLandingPage';
import { NewMapNameDialog } from './NewMapNameDialog';

const MapLibraryPage = lazy(() =>
  import('./MapLibraryPage').then((module) => ({ default: module.MapLibraryPage }))
);
const MapEditorPage = lazy(() =>
  import('./MapEditorPage').then((module) => ({ default: module.MapEditorPage }))
);

type MapScreen = 'landing' | 'library' | 'editor';

interface MapModuleProps {
  theme: Theme;
  onExit: () => void;
}

function MapScreenFallback({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <p className="text-white/70">{message}</p>
    </div>
  );
}

export function MapModule({ theme, onExit }: MapModuleProps) {
  const toast = useToast();
  const [screen, setScreen] = useState<MapScreen>('landing');
  const [editorMapPath, setEditorMapPath] = useState<string | null>(null);
  const [initialEditorDocument, setInitialEditorDocument] = useState<MapDocument | null>(null);
  const [autoEditTitleKey, setAutoEditTitleKey] = useState<number | null>(null);
  const [showNewMapDialog, setShowNewMapDialog] = useState(false);

  useEffect(() => {
    warmMapEntry();
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
          onHome={onExit}
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
        />
      </Suspense>
    );
  }

  return (
    <>
      <MapLandingPage
        theme={theme}
        onBack={onExit}
        onNewMap={() => setShowNewMapDialog(true)}
        onOpenLibrary={handleOpenLibrary}
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
