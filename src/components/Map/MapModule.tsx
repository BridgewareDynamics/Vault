import { useState, useCallback, useEffect } from 'react';
import { Theme } from '../../types';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { prefetchMapLibrary, warmMapEntry } from '../../utils/mapPrefetch';
import { MapLandingPage } from './MapLandingPage';
import { MapLibraryPage } from './MapLibraryPage';
import { MapEditorPage } from './MapEditorPage';
import { NewMapNameDialog } from './NewMapNameDialog';

type MapScreen = 'landing' | 'library' | 'editor';

interface MapModuleProps {
  theme: Theme;
  onExit: () => void;
}

export function MapModule({ theme, onExit }: MapModuleProps) {
  const toast = useToast();
  const [screen, setScreen] = useState<MapScreen>('landing');
  const [editorMapPath, setEditorMapPath] = useState<string | null>(null);
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
    setEditorMapPath(mapFolderPath);
    setAutoEditTitleKey(null);
    setScreen('editor');
  }, []);

  if (screen === 'editor' && editorMapPath) {
    return (
      <MapEditorPage
        theme={theme}
        mapFolderPath={editorMapPath}
        autoEditTitleKey={autoEditTitleKey}
        onBack={() => setScreen('landing')}
        onHome={onExit}
      />
    );
  }

  if (screen === 'library') {
    return (
      <MapLibraryPage
        theme={theme}
        onBack={() => setScreen('landing')}
        onOpenMap={handleOpenMap}
      />
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
