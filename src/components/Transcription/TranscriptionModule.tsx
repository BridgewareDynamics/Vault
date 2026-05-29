import { useCallback, useEffect, useRef, useState } from 'react';
import { Theme, TranscriptionDocument } from '../../types';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { CaseSelectionDialog } from '../Archive/CaseSelectionDialog';
import { TranscriptionLandingPage } from './TranscriptionLandingPage';
import { TranscriptionLibraryPage } from './TranscriptionLibraryPage';
import { TranscriptionWorkspacePage } from './TranscriptionWorkspacePage';
import { NewTranscriptionDialog } from './NewTranscriptionDialog';
import { warmTranscriptionEntry } from '../../utils/transcriptionPrefetch';
import { useTranscriptionTheme } from './transcriptionTheme';
import type {
  ModuleHostMode,
  TranscriptionModuleDetachState,
  TranscriptionScreen,
} from '../../types/detachableModules';
import { isLightTheme } from '../../theme/themeSemantics';
import {
  COLLECT_EMBEDDED_TRANSCRIPTION_EVENT,
  EMBEDDED_TRANSCRIPTION_SNAPSHOT_RESPONSE,
} from '../../utils/embeddedModuleSnapshot';

type TranscriptionScreenLocal = TranscriptionScreen;

export interface TranscriptionWorkspaceDetachBridge {
  flushAndSnapshot: () => Promise<{
    workspaceDocument: TranscriptionDocument | null;
    workspacePath: string;
  } | null>;
  isTranscriptionRunning: () => boolean;
}

interface TranscriptionModuleProps {
  theme: Theme;
  onExit: () => void;
  hostMode?: ModuleHostMode;
  initialNavigationState?: TranscriptionModuleDetachState | null;
  onNavigationStateConsumed?: () => void;
  onPopOutComplete?: () => void;
  initialSourcePath?: string | null;
  initialCasePath?: string | null;
}

function defaultTitleFromSource(sourcePath: string) {
  const fileName = sourcePath.split(/[/\\]/).pop() || 'media';
  const baseName = fileName.replace(/\.[^.]+$/, '');
  return `Transcript - ${baseName}`;
}

function applyNavigationState(
  state: TranscriptionModuleDetachState,
  setters: {
    setScreen: (s: TranscriptionScreenLocal) => void;
    setWorkspacePath: (p: string | null) => void;
    setInitialWorkspaceDocument: (d: TranscriptionDocument | null) => void;
    setLaunchSourcePath: (p: string | null) => void;
    setLaunchCasePath: (p: string | null) => void;
  }
) {
  setters.setScreen(state.screen);
  setters.setWorkspacePath(state.workspacePath);
  setters.setInitialWorkspaceDocument(state.workspaceDocument);
  setters.setLaunchSourcePath(state.launchSourcePath);
  setters.setLaunchCasePath(state.launchCasePath);
}

export function TranscriptionModule({
  theme,
  onExit,
  hostMode = 'embedded',
  initialNavigationState = null,
  onNavigationStateConsumed,
  onPopOutComplete,
  initialSourcePath = null,
  initialCasePath = null,
}: TranscriptionModuleProps) {
  const toast = useToast();
  const isDetached = hostMode === 'detached';
  const isPastel = isLightTheme(theme);
  const workspaceBridgeRef = useRef<TranscriptionWorkspaceDetachBridge | null>(null);

  const [screen, setScreen] = useState<TranscriptionScreenLocal>('landing');
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [initialWorkspaceDocument, setInitialWorkspaceDocument] =
    useState<TranscriptionDocument | null>(null);
  const [launchSourcePath, setLaunchSourcePath] = useState<string | null>(initialSourcePath);
  const [launchCasePath, setLaunchCasePath] = useState<string | null>(initialCasePath);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showCreateCaseDialog, setShowCreateCaseDialog] = useState(false);
  const [pendingCasePath, setPendingCasePath] = useState<string | null>(null);
  const [pendingCaseName, setPendingCaseName] = useState<string | null>(null);
  const [newDialogDefaultTitle, setNewDialogDefaultTitle] = useState('Untitled Transcript');
  const handledInitialLaunchRef = useRef(false);
  const consumedInitialNavRef = useRef(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isReattaching, setIsReattaching] = useState(false);
  const [isPoppingOut, setIsPoppingOut] = useState(false);
  const t = useTranscriptionTheme(theme);

  useEffect(() => {
    warmTranscriptionEntry();
  }, []);

  useEffect(() => {
    if (!initialNavigationState || consumedInitialNavRef.current) return;
    consumedInitialNavRef.current = true;
    applyNavigationState(initialNavigationState, {
      setScreen,
      setWorkspacePath,
      setInitialWorkspaceDocument,
      setLaunchSourcePath,
      setLaunchCasePath,
    });
    onNavigationStateConsumed?.();
  }, [initialNavigationState, onNavigationStateConsumed]);

  useEffect(() => {
    const handleInitialData = (event: Event) => {
      const detail = (event as CustomEvent<TranscriptionModuleDetachState>).detail;
      if (!detail) return;
      applyNavigationState(detail, {
        setScreen,
        setWorkspacePath,
        setInitialWorkspaceDocument,
        setLaunchSourcePath,
        setLaunchCasePath,
      });
    };

    window.addEventListener('transcription-module-data', handleInitialData as EventListener);

    const stored = (
      window as Window & { __transcriptionModuleInitialData?: TranscriptionModuleDetachState }
    ).__transcriptionModuleInitialData;
    if (stored) {
      handleInitialData({ detail: stored } as CustomEvent<TranscriptionModuleDetachState>);
      delete (
        window as Window & { __transcriptionModuleInitialData?: TranscriptionModuleDetachState }
      ).__transcriptionModuleInitialData;
    }

    return () => {
      window.removeEventListener('transcription-module-data', handleInitialData as EventListener);
    };
  }, []);

  const ensureVault = useCallback(async (): Promise<boolean> => {
    if (!window.electronAPI?.getArchiveConfig) {
      return false;
    }
    const config = await window.electronAPI.getArchiveConfig();
    if (!config.archiveDrive) {
      toast.error(
        'Configure your Vault archive drive in Settings before using Transcript.'
      );
      return false;
    }
    return true;
  }, [toast]);

  const collectDetachState = useCallback(async (): Promise<TranscriptionModuleDetachState> => {
    let workspaceDocument: TranscriptionDocument | null = initialWorkspaceDocument;
    let path = workspacePath;

    if (screen === 'workspace' && workspaceBridgeRef.current) {
      const snapshot = await workspaceBridgeRef.current.flushAndSnapshot();
      if (snapshot) {
        workspaceDocument = snapshot.workspaceDocument;
        path = snapshot.workspacePath;
      }
    }

    return {
      screen,
      workspacePath: path,
      workspaceDocument,
      launchSourcePath,
      launchCasePath,
    };
  }, [
    initialWorkspaceDocument,
    launchCasePath,
    launchSourcePath,
    screen,
    workspacePath,
  ]);

  const collectDetachStateRef = useRef(collectDetachState);
  collectDetachStateRef.current = collectDetachState;

  useEffect(() => {
    if (hostMode !== 'embedded') return;

    const handleCollectEmbedded = async () => {
      try {
        const state = await collectDetachStateRef.current();
        window.dispatchEvent(
          new CustomEvent(EMBEDDED_TRANSCRIPTION_SNAPSHOT_RESPONSE, {
            detail: { state },
          })
        );
      } catch (error) {
        window.dispatchEvent(
          new CustomEvent(EMBEDDED_TRANSCRIPTION_SNAPSHOT_RESPONSE, {
            detail: {
              state: null,
              error:
                error instanceof Error ? error.message : 'Failed to save Transcript',
            },
          })
        );
      }
    };

    window.addEventListener(COLLECT_EMBEDDED_TRANSCRIPTION_EVENT, handleCollectEmbedded);
    return () => {
      window.removeEventListener(
        COLLECT_EMBEDDED_TRANSCRIPTION_EVENT,
        handleCollectEmbedded
      );
    };
  }, [hostMode]);

  const handlePopOut = useCallback(async () => {
    if (!window.electronAPI?.createTranscriptionWindow) {
      toast.error('Pop out is only available in the desktop app.');
      return;
    }
    if (workspaceBridgeRef.current?.isTranscriptionRunning()) {
      toast.error('Wait for transcription to finish before popping out.');
      return;
    }
    if (isPoppingOut) return;

    setIsPoppingOut(true);
    try {
      const state = await collectDetachState();
      await window.electronAPI.createTranscriptionWindow(state);
      if (isDetached) {
        await window.electronAPI.closeWindow?.();
      } else {
        onPopOutComplete?.();
        toast.info('Transcript opened in a separate window');
      }
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'popping out transcript' }));
    } finally {
      setIsPoppingOut(false);
    }
  }, [collectDetachState, isDetached, isPoppingOut, onPopOutComplete, toast]);

  const handleReattach = useCallback(async () => {
    if (!window.electronAPI?.reattachTranscriptionModule) {
      toast.error('Dock to Vault is only available in the desktop app.');
      return;
    }
    if (workspaceBridgeRef.current?.isTranscriptionRunning()) {
      toast.error('Wait for transcription to finish before docking.');
      return;
    }
    if (isReattaching) return;

    setIsReattaching(true);
    try {
      const state = await collectDetachState();
      await window.electronAPI.reattachTranscriptionModule(state);
      toast.info('Transcript docked to Vault');
      window.setTimeout(() => setIsReattaching(false), 1000);
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'docking transcript' }));
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

  const openWorkspace = useCallback((transcriptionFolderPath: string) => {
    setInitialWorkspaceDocument(null);
    setWorkspacePath(transcriptionFolderPath);
    setScreen('workspace');
  }, []);

  const createWorkspace = useCallback(
    async (title: string, casePath?: string | null, sourcePath?: string | null) => {
      if (!(await ensureVault())) return;
      if (!window.electronAPI?.createTranscription) return;

      try {
        const doc = await window.electronAPI.createTranscription(
          title.trim() || 'Untitled Transcript',
          casePath ?? null,
          sourcePath ?? null
        );
        setShowNewDialog(false);
        openWorkspace(doc.transcriptionFolderPath);
      } catch (error) {
        toast.error(getUserFriendlyError(error, { operation: 'creating transcript' }));
      }
    },
    [ensureVault, openWorkspace, toast]
  );

  useEffect(() => {
    if (handledInitialLaunchRef.current || !initialSourcePath) {
      return;
    }

    handledInitialLaunchRef.current = true;
    setIsBootstrapping(true);
    void createWorkspace(
      defaultTitleFromSource(initialSourcePath),
      initialCasePath,
      initialSourcePath
    ).finally(() => setIsBootstrapping(false));
  }, [createWorkspace, initialCasePath, initialSourcePath]);

  if (isBootstrapping && screen !== 'workspace') {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${t.bg} ${t.primary}`}
      >
        <p className={t.mutedText}>Preparing transcript workspace...</p>
      </div>
    );
  }

  if (screen === 'workspace' && workspacePath) {
    return (
      <TranscriptionWorkspacePage
        theme={theme}
        transcriptionFolderPath={workspacePath}
        initialDocument={initialWorkspaceDocument}
        onBack={() => setScreen('landing')}
        onHome={handleHome}
        registerWorkspaceBridge={(bridge) => {
          workspaceBridgeRef.current = bridge;
        }}
        {...chromeProps}
      />
    );
  }

  if (screen === 'library') {
    return (
      <TranscriptionLibraryPage
        theme={theme}
        onBack={() => setScreen('landing')}
        onOpenTranscription={openWorkspace}
        {...chromeProps}
      />
    );
  }

  return (
    <>
      <TranscriptionLandingPage
        theme={theme}
        onBack={handleHome}
        onNewWorkspace={() => {
          setNewDialogDefaultTitle('Untitled Transcript');
          setPendingCasePath(null);
          setPendingCaseName(null);
          setShowNewDialog(true);
        }}
        onOpenLibrary={async () => {
          if (!(await ensureVault())) return;
          setScreen('library');
        }}
        {...chromeProps}
      />
      <NewTranscriptionDialog
        isOpen={showNewDialog}
        theme={theme}
        defaultTitle={newDialogDefaultTitle}
        linkedCaseName={pendingCaseName}
        onClose={() => {
          setShowNewDialog(false);
          setPendingCasePath(null);
          setPendingCaseName(null);
        }}
        onAssignCase={() => setShowCreateCaseDialog(true)}
        onClearCase={() => {
          setPendingCasePath(null);
          setPendingCaseName(null);
        }}
        onConfirm={(title) => void createWorkspace(title, pendingCasePath, null)}
      />
      <CaseSelectionDialog
        isOpen={showCreateCaseDialog}
        elevated
        onClose={() => setShowCreateCaseDialog(false)}
        onSelectCase={(casePath) => {
          setPendingCasePath(casePath);
          setPendingCaseName(casePath.split(/[\\/]/).filter(Boolean).pop() ?? 'Case');
          setShowCreateCaseDialog(false);
        }}
        title="Assign to case"
        subtitle="Store this transcript workspace inside a case folder"
        confirmLabel="Use this case"
        emptyStateHint="Create a case below or search your archive"
      />
    </>
  );
}
