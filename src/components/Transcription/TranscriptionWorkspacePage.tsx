import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Theme,
  TranscriptionDocument,
  TranscriptionEngineModel,
  TranscriptionEngineStatus,
  TranscriptionSource,
} from '../../types';
import { useTranscriptionDocument } from '../../hooks/useTranscriptionDocument';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { CaseSelectionDialog } from '../Archive/CaseSelectionDialog';
import {
  resolvePreferredParakeetModelKey,
  shouldApplyPreferredParakeetModel,
} from '../../utils/transcriptionDefaults';
import { TranscriptionWorkspaceShell } from './workspace/TranscriptionWorkspaceShell';
import { useTranscriptionWorkspaceUi } from './workspace/useTranscriptionWorkspaceUi';
import type { TranscriptionMediaSkimmerSelection } from './workspace/TranscriptionMediaSkimmer';
import { deriveSegmentSettingsFromDuration } from '../../utils/transcriptionSegmentDefaults';
import { useTranscriptionSourceDuration } from './workspace/useTranscriptionSourceDuration';

interface TranscriptionWorkspacePageProps {
  theme: Theme;
  transcriptionFolderPath: string;
  onBack: () => void;
  onHome: () => void;
}

function normalizePath(value: string | null | undefined) {
  return value ? value.replace(/\\/g, '/').toLowerCase() : '';
}

function derivePrecisionFromModelKey(modelKey: string) {
  if (!modelKey.includes(' - ')) {
    return 'float32';
  }

  return modelKey.split(' - ').slice(1).join(' - ');
}

function deriveModelBaseName(modelKey: string) {
  return modelKey.includes(' - ') ? modelKey.split(' - ').slice(0, -1).join(' - ') : modelKey;
}

function applyPreferredParakeetModel(
  updateDocument: (updater: (previous: TranscriptionDocument) => TranscriptionDocument) => void,
  availableModels: TranscriptionEngineModel[],
  currentModelKey?: string
) {
  if (
    currentModelKey &&
    !shouldApplyPreferredParakeetModel(currentModelKey, availableModels)
  ) {
    return;
  }

  updateDocument((previous) => {
    if (!shouldApplyPreferredParakeetModel(previous.settings.model, availableModels)) {
      return previous;
    }

    const nextModel = resolvePreferredParakeetModelKey(availableModels);
    return {
      ...previous,
      settings: {
        ...previous.settings,
        model: nextModel,
        precision: derivePrecisionFromModelKey(nextModel),
      },
    };
  });
}

function preferCpuModelKey(modelKey: string, availableModels: TranscriptionEngineModel[]) {
  const currentBaseName = deriveModelBaseName(modelKey);
  const preferredKey = `${currentBaseName} - float32`;
  if (availableModels.some((model) => model.key === preferredKey)) {
    return preferredKey;
  }

  return modelKey;
}

function buildPendingSource(
  filePath: string,
  archiveDrive: string | null,
  linkedCasePath: string | null
): TranscriptionSource {
  const normalizedFilePath = normalizePath(filePath);
  const normalizedArchiveDrive = normalizePath(archiveDrive);
  const normalizedCasePath = normalizePath(linkedCasePath);
  const isVaultSource =
    !!normalizedArchiveDrive && normalizedFilePath.startsWith(normalizedArchiveDrive);
  const isVideo = ['.asf', '.avi', '.mkv', '.mov', '.mp4', '.webm', '.wmv'].some((ext) =>
    filePath.toLowerCase().endsWith(ext)
  );

  return {
    id: crypto.randomUUID(),
    fileName: filePath.split(/[/\\]/).pop() || filePath,
    originalPath: filePath,
    mediaType: isVideo ? 'video' : 'audio',
    origin: isVaultSource ? 'vault' : 'local',
    casePath:
      normalizedCasePath && normalizedFilePath.startsWith(normalizedCasePath)
        ? linkedCasePath
        : null,
  };
}

export function TranscriptionWorkspacePage({
  theme,
  transcriptionFolderPath,
  onBack,
  onHome,
}: TranscriptionWorkspacePageProps) {
  const ui = useTranscriptionWorkspaceUi(theme);
  const toast = useToast();
  const {
    document,
    loading,
    saving,
    dirty,
    setDocument,
    updateDocument,
    saveNow,
  } = useTranscriptionDocument(transcriptionFolderPath);

  const [titleDraft, setTitleDraft] = useState('');
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [engineStatus, setEngineStatus] = useState<TranscriptionEngineStatus | null>(null);
  const [models, setModels] = useState<TranscriptionEngineModel[]>([]);
  const [loadingEngineState, setLoadingEngineState] = useState(false);
  const [running, setRunning] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const documentRef = useRef(document);
  documentRef.current = document;
  const hasAppliedPreferredModelRef = useRef(false);

  useEffect(() => {
    hasAppliedPreferredModelRef.current = false;
  }, [transcriptionFolderPath]);

  useEffect(() => {
    if (document?.title) {
      setTitleDraft(document.title);
    }
  }, [document?.title]);

  useEffect(() => {
    if (document?.sources?.length && !selectedSourceId) {
      setSelectedSourceId(document.sources[0].id);
    }
  }, [document?.sources, selectedSourceId]);

  useEffect(() => {
    if (!document || !engineStatus?.running || engineStatus.deviceDefault !== 'cpu') {
      return;
    }

    if (document.settings.device !== 'cuda') {
      return;
    }

    updateDocument((previous) => {
      const nextModel = preferCpuModelKey(previous.settings.model, models);
      return {
        ...previous,
        settings: {
          ...previous.settings,
          device: 'cpu',
          model: nextModel,
          precision: derivePrecisionFromModelKey(nextModel),
        },
      };
    });
  }, [
    document,
    engineStatus?.deviceDefault,
    engineStatus?.running,
    models,
    updateDocument,
  ]);

  const selectedSource = useMemo(
    () =>
      document?.sources.find((source) => source.id === selectedSourceId) ??
      document?.sources[0] ??
      null,
    [document?.sources, selectedSourceId]
  );

  const loadEngineState = useCallback(async () => {
    if (!window.electronAPI?.getTranscriptionEngineStatus) return;
    setLoadingEngineState(true);
    try {
      const status = await window.electronAPI.getTranscriptionEngineStatus();
      setEngineStatus(status);
      if (status.running && window.electronAPI.listTranscriptionModels) {
        const nextModels = await window.electronAPI.listTranscriptionModels();
        setModels(nextModels);
        if (!hasAppliedPreferredModelRef.current) {
          applyPreferredParakeetModel(
            updateDocument,
            nextModels,
            documentRef.current?.settings.model
          );
          hasAppliedPreferredModelRef.current = true;
        }
      }
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'loading transcription engine' }));
    } finally {
      setLoadingEngineState(false);
    }
  }, [toast, updateDocument]);

  useEffect(() => {
    void loadEngineState();
  }, [loadEngineState]);

  const commitTitle = useCallback(() => {
    if (!document) return;
    const nextTitle = titleDraft.trim() || 'Untitled Transcription';
    setTitleDraft(nextTitle);
    if (nextTitle === document.title) return;
    updateDocument((previous) => ({ ...previous, title: nextTitle }));
  }, [document, titleDraft, updateDocument]);

  const handleAssignCase = async (casePath: string) => {
    if (!document) return;

    try {
      const updatedDocument = { ...document, casePath };
      updateDocument(() => updatedDocument, { skipAutosave: true });
      await saveNow(updatedDocument);
      toast.success('Transcription linked to case');
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'linking transcription to case' }));
    }
  };

  const handleMoveToLibrary = async () => {
    if (!document?.casePath) return;
    if (
      !confirm(
        'Move this transcription back to the Vault library and unlink it from the current case?'
      )
    ) {
      return;
    }

    try {
      const updatedDocument = { ...document, casePath: null };
      updateDocument(() => updatedDocument, { skipAutosave: true });
      await saveNow(updatedDocument);
      toast.success('Transcription moved to Vault library');
    } catch (error) {
      toast.error(
        getUserFriendlyError(error, { operation: 'moving transcription to Vault library' })
      );
    }
  };

  const handleStartEngine = async () => {
    if (!window.electronAPI?.startTranscriptionEngine) return;

    try {
      setLoadingEngineState(true);
      const status = await window.electronAPI.startTranscriptionEngine();
      setEngineStatus(status);
      if (window.electronAPI.listTranscriptionModels) {
        const nextModels = await window.electronAPI.listTranscriptionModels();
        setModels(nextModels);
        applyPreferredParakeetModel(
          updateDocument,
          nextModels,
          documentRef.current?.settings.model
        );
        hasAppliedPreferredModelRef.current = true;
      }
      toast.success('Vault transcription engine is ready');
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'starting transcription engine' }));
    } finally {
      setLoadingEngineState(false);
    }
  };

  const handleAddMedia = async () => {
    if (!document || !window.electronAPI?.selectTranscriptionMedia) return;

    try {
      const [selectedPaths, archiveConfig] = await Promise.all([
        window.electronAPI.selectTranscriptionMedia(),
        window.electronAPI.getArchiveConfig?.(),
      ]);

      if (selectedPaths.length === 0) {
        return;
      }

      updateDocument((previous) => {
        const additions = selectedPaths
          .filter(
            (sourcePath) =>
              !previous.sources.some(
                (source) =>
                  source.originalPath === sourcePath || source.storedPath === sourcePath
              )
          )
          .map((sourcePath) =>
            buildPendingSource(
              sourcePath,
              archiveConfig?.archiveDrive ?? null,
              previous.casePath
            )
          );

        if (additions.length === 0) {
          return previous;
        }

        return {
          ...previous,
          sources: [...additions, ...previous.sources],
        };
      });

      if (!selectedSourceId) {
        setSelectedSourceId(document.sources[0]?.id ?? null);
      }

      toast.success(
        `Added ${selectedPaths.length} media file${selectedPaths.length === 1 ? '' : 's'}`
      );
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'selecting media' }));
    }
  };

  const handleRemoveSource = (sourceId: string) => {
    updateDocument((previous) => ({
      ...previous,
      sources: previous.sources.filter((source) => source.id !== sourceId),
      settings:
        previous.settings.mediaSelection?.sourceId === sourceId
          ? { ...previous.settings, mediaSelection: null }
          : previous.settings,
    }));

    if (selectedSourceId === sourceId) {
      setSelectedSourceId(null);
    }
  };

  useTranscriptionSourceDuration(selectedSource, (totalDurationSeconds) => {
    if (!selectedSource) return;

    updateDocument((previous) => {
      const saved = previous.settings.mediaSelection;
      if (
        saved?.sourceId === selectedSource.id &&
        saved.totalDurationSeconds === totalDurationSeconds
      ) {
        return previous;
      }

      const { segmentLength, segmentDuration } = deriveSegmentSettingsFromDuration(
        totalDurationSeconds
      );

      return {
        ...previous,
        settings: {
          ...previous.settings,
          segmentLength,
          segmentDuration,
          mediaSelection: {
            sourceId: selectedSource.id,
            startSeconds: 0,
            endSeconds: totalDurationSeconds,
            totalDurationSeconds,
          },
        },
      };
    });
  });

  const handleMediaSelectionChange = useCallback(
    (selection: TranscriptionMediaSkimmerSelection) => {
      if (!selectedSource) return;

      const { segmentLength, segmentDuration } = deriveSegmentSettingsFromDuration(
        selection.selectionDurationSeconds
      );

      updateDocument((previous) => ({
        ...previous,
        settings: {
          ...previous.settings,
          segmentLength,
          segmentDuration,
          mediaSelection: {
            sourceId: selectedSource.id,
            startSeconds: selection.startSeconds,
            endSeconds: selection.endSeconds,
            totalDurationSeconds: selection.totalDurationSeconds,
          },
        },
      }));
    },
    [selectedSource, updateDocument]
  );

  const handleRun = async () => {
    if (!document || !selectedSource || !window.electronAPI?.runTranscription) {
      return;
    }

    try {
      setRunning(true);
      const result = await window.electronAPI.runTranscription({
        transcriptionFolderPath: document.transcriptionFolderPath,
        sourcePath: selectedSource.originalPath,
        casePath: document.casePath,
        title: titleDraft.trim() || document.title,
        settings: document.settings,
      });
      setDocument(result);

      if (result.status === 'completed') {
        toast.success('Transcription completed');
      } else {
        toast.error(result.lastError || 'Transcription did not complete successfully.');
      }
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'running transcription' }));
    } finally {
      setRunning(false);
    }
  };

  const handleCancel = async () => {
    if (!document || !window.electronAPI?.cancelTranscriptionJob) return;

    try {
      await window.electronAPI.cancelTranscriptionJob(document.transcriptionFolderPath);
      const latest = await window.electronAPI.readTranscription(document.transcriptionFolderPath);
      setDocument(latest);
      toast.info('Cancellation requested');
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'cancelling transcription' }));
    }
  };

  const handleExportTranscript = async () => {
    if (!document?.transcriptText || !window.electronAPI?.showSaveDialog) return;

    try {
      const result = await window.electronAPI.showSaveDialog({
        title: 'Export Transcript',
        defaultPath: `${(titleDraft.trim() || document.title).replace(/[<>:"/\\|?*]/g, '_')}.txt`,
        filters: [{ name: 'Text', extensions: ['txt'] }],
      });

      if (!result.canceled && result.filePath && window.electronAPI.saveTextFile) {
        await window.electronAPI.saveTextFile(result.filePath, document.transcriptText);
        toast.success('Transcript exported');
      }
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'exporting transcript' }));
    }
  };

  const currentModel = useMemo(
    () =>
      models.find((model) => model.key === document?.settings.model) ??
      models[0] ??
      null,
    [document?.settings.model, models]
  );

  const displayModels = useMemo(
    () =>
      models.length > 0 || !document
        ? models
        : [
            {
              key: document.settings.model,
              name: document.settings.model,
              modelId: '',
              precision: document.settings.precision,
              modelType: 'parakeet',
              defaultSegmentLength: document.settings.segmentLength,
              supportsTimestamps: true,
              bundled:
                engineStatus?.defaultModelKey === document.settings.model &&
                !!engineStatus.defaultModelReady,
              cached:
                engineStatus?.defaultModelKey === document.settings.model &&
                !!engineStatus.defaultModelReady,
            },
          ],
    [
      document?.settings.model,
      document?.settings.precision,
      document?.settings.segmentLength,
      engineStatus?.defaultModelKey,
      engineStatus?.defaultModelReady,
      models,
    ]
  );

  const deviceOptions = useMemo(
    () =>
      engineStatus?.deviceDefault === 'cuda'
        ? [
            { value: 'cuda' as const, label: 'CUDA' },
            { value: 'cpu' as const, label: 'CPU' },
          ]
        : [{ value: 'cpu' as const, label: 'CPU' }],
    [engineStatus?.deviceDefault]
  );

  if (loading || !document) {
    return (
      <div className={`flex h-screen items-center justify-center ${ui.t.bg}`}>
        <p className={ui.t.muted}>Loading transcription workspace...</p>
      </div>
    );
  }

  const linkedCaseName =
    document.casePath?.split(/[\\/]/).filter(Boolean).pop() ?? null;

  const modelOptions =
    models.length > 0
      ? models
      : [
          {
            key: document.settings.model,
            name: document.settings.model,
            modelId: '',
            precision: document.settings.precision,
            modelType: 'parakeet',
            defaultSegmentLength: document.settings.segmentLength,
            supportsTimestamps: true,
          } as TranscriptionEngineModel,
        ];

  return (
    <>
      <TranscriptionWorkspaceShell
        ui={ui}
        document={document}
        titleDraft={titleDraft}
        dirty={dirty}
        saving={saving}
        running={running}
        linkedCaseName={linkedCaseName}
        engineStatus={engineStatus}
        loadingEngineState={loadingEngineState}
        displayModels={modelOptions}
        deviceOptions={deviceOptions}
        selectedSource={selectedSource}
        currentModel={currentModel}
        onBack={onBack}
        onHome={onHome}
        onTitleChange={setTitleDraft}
        onTitleCommit={commitTitle}
        onTitleEscape={() => setTitleDraft(document.title)}
        onOpenCaseDialog={() => setShowCaseDialog(true)}
        onMoveToLibrary={handleMoveToLibrary}
        onSave={() => void saveNow()}
        onExport={handleExportTranscript}
        onRefreshEngine={() => void loadEngineState()}
        onStartEngine={() => void handleStartEngine()}
        onAddMedia={handleAddMedia}
        onSelectSource={setSelectedSourceId}
        onRemoveSource={handleRemoveSource}
        onRun={() => void handleRun()}
        onCancel={() => void handleCancel()}
        onSettingsChange={(updater) =>
          updateDocument((previous) => {
            const nextSettings = updater(previous.settings);
            const modelChanged = nextSettings.model !== previous.settings.model;
            return {
              ...previous,
              settings: modelChanged
                ? {
                    ...nextSettings,
                    precision: derivePrecisionFromModelKey(nextSettings.model),
                  }
                : nextSettings,
            };
          })
        }
        onMediaSelectionChange={handleMediaSelectionChange}
        onTranscriptChange={(text) =>
          updateDocument((previous) => ({
            ...previous,
            transcriptText: text,
          }))
        }
      />

      <CaseSelectionDialog
        isOpen={showCaseDialog}
        onClose={() => setShowCaseDialog(false)}
        onSelectCase={handleAssignCase}
        title="Assign to case"
        subtitle="Link this transcription workspace to a case folder"
        confirmLabel="Assign case"
        emptyStateHint="Create a case below or start one from the archive"
      />
    </>
  );
}
