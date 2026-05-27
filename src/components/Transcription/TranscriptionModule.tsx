import { useCallback, useEffect, useRef, useState } from 'react';
import { Theme } from '../../types';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { CaseSelectionDialog } from '../Archive/CaseSelectionDialog';
import { TranscriptionLandingPage } from './TranscriptionLandingPage';
import { TranscriptionLibraryPage } from './TranscriptionLibraryPage';
import { TranscriptionWorkspacePage } from './TranscriptionWorkspacePage';
import { NewTranscriptionDialog } from './NewTranscriptionDialog';
import { warmTranscriptionEntry } from '../../utils/transcriptionPrefetch';
import { useTranscriptionTheme } from './transcriptionTheme';

type TranscriptionScreen = 'landing' | 'library' | 'workspace';

interface TranscriptionModuleProps {
  theme: Theme;
  onExit: () => void;
  initialSourcePath?: string | null;
  initialCasePath?: string | null;
}

function defaultTitleFromSource(sourcePath: string) {
  const fileName = sourcePath.split(/[/\\]/).pop() || 'media';
  const baseName = fileName.replace(/\.[^.]+$/, '');
  return `Transcript - ${baseName}`;
}

export function TranscriptionModule({
  theme,
  onExit,
  initialSourcePath = null,
  initialCasePath = null,
}: TranscriptionModuleProps) {
  const toast = useToast();
  const [screen, setScreen] = useState<TranscriptionScreen>('landing');
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showCreateCaseDialog, setShowCreateCaseDialog] = useState(false);
  const [pendingCasePath, setPendingCasePath] = useState<string | null>(null);
  const [pendingCaseName, setPendingCaseName] = useState<string | null>(null);
  const [newDialogDefaultTitle, setNewDialogDefaultTitle] = useState(
    'Untitled Transcription'
  );
  const handledInitialLaunchRef = useRef(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const t = useTranscriptionTheme(theme);

  useEffect(() => {
    warmTranscriptionEntry();
  }, []);

  const ensureVault = useCallback(async (): Promise<boolean> => {
    if (!window.electronAPI?.getArchiveConfig) {
      return false;
    }
    const config = await window.electronAPI.getArchiveConfig();
    if (!config.archiveDrive) {
      toast.error(
        'Configure your Vault archive drive in Settings before using Transcription.'
      );
      return false;
    }
    return true;
  }, [toast]);

  const openWorkspace = useCallback((transcriptionFolderPath: string) => {
    setWorkspacePath(transcriptionFolderPath);
    setScreen('workspace');
  }, []);

  const createWorkspace = useCallback(
    async (title: string, casePath?: string | null, sourcePath?: string | null) => {
      if (!(await ensureVault())) return;
      if (!window.electronAPI?.createTranscription) return;

      try {
        const doc = await window.electronAPI.createTranscription(
          title.trim() || 'Untitled Transcription',
          casePath ?? null,
          sourcePath ?? null
        );
        setShowNewDialog(false);
        openWorkspace(doc.transcriptionFolderPath);
      } catch (error) {
        toast.error(getUserFriendlyError(error, { operation: 'creating transcription' }));
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
        className={`flex min-h-screen items-center justify-center ${t.t.bg} ${t.t.primary}`}
      >
        <p className={t.t.muted}>Preparing transcription workspace...</p>
      </div>
    );
  }

  if (screen === 'workspace' && workspacePath) {
    return (
      <TranscriptionWorkspacePage
        theme={theme}
        transcriptionFolderPath={workspacePath}
        onBack={() => setScreen('landing')}
        onHome={onExit}
      />
    );
  }

  if (screen === 'library') {
    return (
      <TranscriptionLibraryPage
        theme={theme}
        onBack={() => setScreen('landing')}
        onOpenTranscription={openWorkspace}
      />
    );
  }

  return (
    <>
      <TranscriptionLandingPage
        theme={theme}
        onBack={onExit}
        onNewWorkspace={() => {
          setNewDialogDefaultTitle('Untitled Transcription');
          setPendingCasePath(null);
          setPendingCaseName(null);
          setShowNewDialog(true);
        }}
        onOpenLibrary={async () => {
          if (!(await ensureVault())) return;
          setScreen('library');
        }}
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
        subtitle="Store this transcription workspace inside a case folder"
        confirmLabel="Use this case"
        emptyStateHint="Create a case below or search your archive"
      />
    </>
  );
}
