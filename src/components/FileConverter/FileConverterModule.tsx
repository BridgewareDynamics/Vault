import { useCallback, useEffect, useRef, useState } from 'react';
import { Theme } from '../../types';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { warmFileConverterEntry } from '../../utils/fileConverterPrefetch';
import { isLightTheme } from '../../theme/themeSemantics';
import type {
  FileConverterModuleDetachState,
  FileConverterScreen,
  FileConverterWorkspaceDetachBridge,
  ModuleHostMode,
} from '../../types/detachableModules';
import { FileConverterLandingPage } from './FileConverterLandingPage';
import { FileConverterWorkspacePage } from './FileConverterWorkspacePage';
import { DEFAULT_FILE_CONVERTER_TARGET } from './fileConverterDefaults';

export type { FileConverterWorkspaceDetachBridge };

interface FileConverterModuleProps {
  theme: Theme;
  onExit: () => void;
  hostMode?: ModuleHostMode;
  initialNavigationState?: FileConverterModuleDetachState | null;
  onNavigationStateConsumed?: () => void;
  onPopOutComplete?: () => void;
}

function applyNavigationState(
  state: FileConverterModuleDetachState,
  setters: {
    setScreen: (screen: FileConverterScreen) => void;
    setInitialWorkspaceState: (state: FileConverterModuleDetachState | null) => void;
  }
) {
  setters.setScreen(state.screen);
  if (state.screen === 'workspace') {
    setters.setInitialWorkspaceState(state);
  } else {
    setters.setInitialWorkspaceState(null);
  }
}

export function FileConverterModule({
  theme,
  onExit,
  hostMode = 'embedded',
  initialNavigationState = null,
  onNavigationStateConsumed,
  onPopOutComplete,
}: FileConverterModuleProps) {
  const toast = useToast();
  const isDetached = hostMode === 'detached';
  const isPastel = isLightTheme(theme);
  const workspaceBridgeRef = useRef<FileConverterWorkspaceDetachBridge | null>(null);

  const [screen, setScreen] = useState<FileConverterScreen>('landing');
  const [initialWorkspaceState, setInitialWorkspaceState] =
    useState<FileConverterModuleDetachState | null>(null);
  const [isPoppingOut, setIsPoppingOut] = useState(false);
  const [isReattaching, setIsReattaching] = useState(false);
  const consumedInitialNavRef = useRef(false);

  useEffect(() => {
    warmFileConverterEntry();
  }, []);

  useEffect(() => {
    if (!initialNavigationState || consumedInitialNavRef.current) {
      return;
    }
    consumedInitialNavRef.current = true;
    applyNavigationState(initialNavigationState, { setScreen, setInitialWorkspaceState });
    onNavigationStateConsumed?.();
  }, [initialNavigationState, onNavigationStateConsumed]);

  useEffect(() => {
    const handleInitialData = (event: Event) => {
      const detail = (event as CustomEvent<FileConverterModuleDetachState>).detail;
      if (!detail) {
        return;
      }
      applyNavigationState(detail, { setScreen, setInitialWorkspaceState });
    };

    window.addEventListener('file-converter-module-data', handleInitialData as EventListener);

    const stored = (window as Window & { __fileConverterModuleInitialData?: FileConverterModuleDetachState })
      .__fileConverterModuleInitialData;
    if (stored) {
      handleInitialData({ detail: stored } as CustomEvent<FileConverterModuleDetachState>);
      delete (window as Window & { __fileConverterModuleInitialData?: FileConverterModuleDetachState })
        .__fileConverterModuleInitialData;
    }

    return () => {
      window.removeEventListener('file-converter-module-data', handleInitialData as EventListener);
    };
  }, []);

  const collectDetachState = useCallback(async (): Promise<FileConverterModuleDetachState> => {
    if (screen === 'workspace' && workspaceBridgeRef.current) {
      return workspaceBridgeRef.current.collectDetachState();
    }
    return {
      screen,
      source: null,
      target: DEFAULT_FILE_CONVERTER_TARGET,
      selectedCasePath: null,
    };
  }, [screen]);

  const handlePopOut = useCallback(async () => {
    if (!window.electronAPI?.createFileConverterWindow) {
      toast.error('Pop out is only available in the desktop app.');
      return;
    }
    if (workspaceBridgeRef.current?.isConverting()) {
      toast.error('Wait for the conversion to finish before popping out.');
      return;
    }
    if (isPoppingOut) {
      return;
    }

    setIsPoppingOut(true);
    try {
      const state = await collectDetachState();
      await window.electronAPI.createFileConverterWindow(state);
      if (isDetached) {
        await window.electronAPI.closeWindow?.();
      } else {
        onPopOutComplete?.();
        toast.info('File Converter opened in a separate window');
      }
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'popping out file converter' }));
    } finally {
      setIsPoppingOut(false);
    }
  }, [collectDetachState, isDetached, isPoppingOut, onPopOutComplete, toast]);

  const handleReattach = useCallback(async () => {
    if (!window.electronAPI?.reattachFileConverterModule) {
      toast.error('Dock to Vault is only available in the desktop app.');
      return;
    }
    if (workspaceBridgeRef.current?.isConverting()) {
      toast.error('Wait for the conversion to finish before docking.');
      return;
    }
    if (isReattaching) {
      return;
    }

    setIsReattaching(true);
    try {
      const state = await collectDetachState();
      await window.electronAPI.reattachFileConverterModule(state);
      toast.info('File Converter docked to Vault');
      window.setTimeout(() => setIsReattaching(false), 1000);
    } catch (error) {
      setIsReattaching(false);
      toast.error(getUserFriendlyError(error, { operation: 'docking file converter' }));
    }
  }, [collectDetachState, isReattaching, toast]);

  const chromeProps = {
    hostMode,
    onPopOut: handlePopOut,
    onReattach: handleReattach,
    popOutDisabled: isPoppingOut || isReattaching,
    isPastel,
  };

  const handleBackFromWorkspace = useCallback(() => {
    setScreen('landing');
    setInitialWorkspaceState(null);
  }, []);

  const handleStartConversion = useCallback(() => {
    setInitialWorkspaceState(null);
    setScreen('workspace');
  }, []);

  if (screen === 'workspace') {
    return (
      <FileConverterWorkspacePage
        theme={theme}
        onBack={handleBackFromWorkspace}
        onExit={onExit}
        initialState={initialWorkspaceState}
        registerWorkspaceBridge={(bridge) => {
          workspaceBridgeRef.current = bridge;
        }}
        {...chromeProps}
      />
    );
  }

  return (
    <FileConverterLandingPage
      theme={theme}
      onBack={onExit}
      onStartConversion={handleStartConversion}
      {...chromeProps}
    />
  );
}
