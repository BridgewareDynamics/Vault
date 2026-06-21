import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAudioInputDevices } from '../hooks/useAudioInputDevices';
import { useMediaAudioRecorder } from '../hooks/useMediaAudioRecorder';
import { useToast } from '../components/Toast/ToastContext';
import { useVaultActiveCase } from './VaultActiveCaseContext';
import { getUserFriendlyError } from '../utils/errorMessages';
import {
  AudioRecorderQuality,
  AudioStudioInputOptions,
  DEFAULT_AUDIO_STUDIO_INPUT,
  buildDefaultRecordingFileName,
  mimeTypeToExtension,
} from '../utils/audioRecorder';
import {
  AudioRecorderContext,
  AudioRecorderContextValue,
  StudioPanelMode,
} from './AudioRecorderContext';

export function AudioRecorderProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { activeCase } = useVaultActiveCase();

  const [panelMode, setPanelMode] = useState<StudioPanelMode>('closed');
  const [inputOptions, setInputOptionsState] = useState<AudioStudioInputOptions>(DEFAULT_AUDIO_STUDIO_INPUT);
  const [quality, setQuality] = useState<AudioRecorderQuality>('standard');
  const [selectedCasePath, setSelectedCasePath] = useState<string | null>(null);
  const [selectedCaseName, setSelectedCaseName] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [fileName, setFileName] = useState('');
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSessionActive = panelMode !== 'closed';
  const isPanelOpen = panelMode === 'open';
  const isMinimized = panelMode === 'minimized';

  const { devices, loading: devicesLoading, error: devicesError, refresh } = useAudioInputDevices(
    isSessionActive
  );

  const resolvedDeviceId = selectedDeviceId.trim() || null;

  const recorder = useMediaAudioRecorder({
    deviceId: resolvedDeviceId,
    quality,
    inputOptions,
    sessionActive: isSessionActive,
    onResolvedDeviceId: setSelectedDeviceId,
  });

  const setInputOptions = useCallback(
    (updater: (prev: AudioStudioInputOptions) => AudioStudioInputOptions) => {
      setInputOptionsState((prev) => updater(prev));
    },
    []
  );

  const setSelectedCase = useCallback((path: string | null, name: string | null) => {
    setSelectedCasePath(path);
    setSelectedCaseName(name);
  }, []);

  const openStudio = useCallback(() => setPanelMode('open'), []);
  const minimizeStudio = useCallback(() => setPanelMode('minimized'), []);
  const expandStudio = useCallback(() => setPanelMode('open'), []);

  const closeStudio = useCallback(() => {
    if (recorder.isLive) {
      const confirmed = window.confirm('Stop the active recording and close the studio?');
      if (!confirmed) {
        return;
      }
      recorder.stopRecording();
    }
    recorder.resetRecording();
    setPanelMode('closed');
    setShowCaseDialog(false);
    setFileName('');
  }, [recorder]);

  useEffect(() => {
    const handleOpen = () => openStudio();
    window.addEventListener('open-audio-recorder', handleOpen);
    return () => window.removeEventListener('open-audio-recorder', handleOpen);
  }, [openStudio]);

  useEffect(() => {
    if (!isSessionActive) {
      return;
    }
    if (activeCase) {
      setSelectedCasePath(activeCase.path);
      setSelectedCaseName(activeCase.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeCase is intentionally tracked by its path/name fields rather than object identity
  }, [isSessionActive, activeCase?.path, activeCase?.name]);

  useEffect(() => {
    if (!isSessionActive || devicesLoading || devices.length === 0) {
      return;
    }

    const knownIds = devices.map((device) => device.deviceId).filter(Boolean);
    if (knownIds.length === 0) {
      return;
    }

    if (resolvedDeviceId && knownIds.includes(resolvedDeviceId)) {
      return;
    }

    setSelectedDeviceId(knownIds[0]);
  }, [isSessionActive, devices, devicesLoading, resolvedDeviceId]);

  const effectiveFileName = useMemo(() => {
    const trimmed = fileName.trim();
    if (trimmed) {
      const ext = mimeTypeToExtension(recorder.mimeType);
      return trimmed.includes('.') ? trimmed : `${trimmed}.${ext}`;
    }
    return buildDefaultRecordingFileName(recorder.mimeType || 'audio/webm');
  }, [fileName, recorder.mimeType]);

  const canSave =
    Boolean(selectedCasePath) &&
    Boolean(recorder.recordedBlob) &&
    recorder.status === 'stopped' &&
    !saving;

  const handleSave = useCallback(async () => {
    if (!selectedCasePath || !recorder.recordedBlob || !window.electronAPI?.saveAudioRecordingToCase) {
      toast.error('Select a case and record audio before saving.');
      return;
    }

    setSaving(true);
    try {
      const buffer = await recorder.recordedBlob.arrayBuffer();
      const savedPath = await window.electronAPI.saveAudioRecordingToCase(
        selectedCasePath,
        effectiveFileName,
        buffer,
        recorder.mimeType
      );
      toast.success(
        `Saved "${savedPath.split(/[/\\]/).pop()}" to ${selectedCaseName ?? 'case'}`
      );
      window.dispatchEvent(
        new CustomEvent('vault-audio-recording-saved', {
          detail: { casePath: selectedCasePath, filePath: savedPath },
        })
      );
      recorder.resetRecording();
      setFileName('');
      setPanelMode('closed');
      setShowCaseDialog(false);
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'saving recording' }));
    } finally {
      setSaving(false);
    }
  }, [
    selectedCasePath,
    recorder,
    effectiveFileName,
    selectedCaseName,
    toast,
  ]);

  const handleStopFromDock = useCallback(() => {
    recorder.stopRecording();
    setPanelMode('open');
  }, [recorder]);

  const value = useMemo(
    (): AudioRecorderContextValue => ({
      panelMode,
      isPanelOpen,
      isMinimized,
      isSessionActive,
      openStudio,
      minimizeStudio,
      expandStudio,
      closeStudio,
      inputOptions,
      setInputOptions,
      quality,
      setQuality,
      selectedCasePath,
      selectedCaseName,
      setSelectedCase,
      fileName,
      setFileName,
      showCaseDialog,
      setShowCaseDialog,
      devices,
      devicesLoading,
      devicesError,
      refreshDevices: refresh,
      selectedDeviceId,
      setSelectedDeviceId,
      recorder,
      saving,
      handleSave,
      handleStopFromDock,
      effectiveFileName,
      canSave,
    }),
    [
      panelMode,
      isPanelOpen,
      isMinimized,
      isSessionActive,
      openStudio,
      minimizeStudio,
      expandStudio,
      closeStudio,
      inputOptions,
      setInputOptions,
      quality,
      selectedCasePath,
      selectedCaseName,
      setSelectedCase,
      fileName,
      showCaseDialog,
      devices,
      devicesLoading,
      devicesError,
      refresh,
      selectedDeviceId,
      recorder,
      saving,
      handleSave,
      handleStopFromDock,
      effectiveFileName,
      canSave,
    ]
  );

  return <AudioRecorderContext.Provider value={value}>{children}</AudioRecorderContext.Provider>;
}
