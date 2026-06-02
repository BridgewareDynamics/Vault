import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FolderOpen,
  Mic,
  Pause,
  Play,
  RefreshCw,
  Save,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { CaseSelectionDialog } from '../Archive/CaseSelectionDialog';
import { useToast } from '../Toast/ToastContext';
import { useVaultActiveCase } from '../../contexts/VaultActiveCaseContext';
import { useAudioInputDevices } from '../../hooks/useAudioInputDevices';
import { useMediaAudioRecorder } from '../../hooks/useMediaAudioRecorder';
import { useSettingsContext } from '../../utils/settingsContext';
import { getModuleMenuTheme } from '../../theme/moduleMenuTheme';
import { getUserFriendlyError } from '../../utils/errorMessages';
import {
  AudioRecorderQuality,
  buildDefaultRecordingFileName,
  mimeTypeToExtension,
} from '../../utils/audioRecorder';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';
import { AudioLevelMeter } from './AudioLevelMeter';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudioRecorderModal({ isOpen, onClose }: AudioRecorderModalProps) {
  const toast = useToast();
  const { activeCase } = useVaultActiveCase();
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);
  const t = getModuleMenuTheme(theme);

  const [selectedCasePath, setSelectedCasePath] = useState<string | null>(null);
  const [selectedCaseName, setSelectedCaseName] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [quality, setQuality] = useState<AudioRecorderQuality>('standard');
  const [fileName, setFileName] = useState('');
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const previewRef = useRef<HTMLAudioElement | null>(null);

  const { devices, loading: devicesLoading, error: devicesError, refresh } = useAudioInputDevices(isOpen);

  const recorder = useMediaAudioRecorder({
    deviceId: selectedDeviceId || null,
    quality,
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) {
      setShowCaseDialog(false);
      return;
    }
    if (activeCase) {
      setSelectedCasePath(activeCase.path);
      setSelectedCaseName(activeCase.name);
    }
  }, [isOpen, activeCase?.path, activeCase?.name]);

  useEffect(() => {
    if (!isOpen || devices.length === 0 || selectedDeviceId) {
      return;
    }
    setSelectedDeviceId(devices[0].deviceId);
  }, [isOpen, devices, selectedDeviceId]);

  useEffect(() => {
    if (!recorder.recordedBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(recorder.recordedBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recorder.recordedBlob]);

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

  const handleClose = () => {
    if (recorder.status === 'recording' || recorder.status === 'paused') {
      const confirmed = window.confirm('Stop the active recording and close?');
      if (!confirmed) {
        return;
      }
      recorder.stopRecording();
    }
    recorder.resetRecording();
    onClose();
  };

  const handleSave = async () => {
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
      onClose();
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'saving recording' }));
    } finally {
      setSaving(false);
    }
  };

  const isRecording = recorder.status === 'recording';
  const isPaused = recorder.status === 'paused';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close audio recorder"
            onClick={handleClose}
          />

          <div
            className={`relative z-10 flex w-full max-w-[min(100%,72rem)] flex-col items-center gap-4 p-1 lg:flex-row lg:items-start lg:justify-center ${
              showCaseDialog ? 'lg:gap-5' : ''
            }`}
          >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="audio-recorder-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className={`w-full max-w-2xl shrink-0 overflow-hidden rounded-[32px] border shadow-2xl ${t.dialogShellLarge}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`flex items-start justify-between gap-4 border-b px-6 py-5 ${t.dialogHeader}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl p-3 ${t.button}`}>
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-[0.28em] ${isPastel ? 'text-purple-700' : 'text-cyan-200'}`}>
                    Vault Capture
                  </p>
                  <h2 id="audio-recorder-title" className={`text-xl font-bold ${isPastel ? 'text-gray-900' : 'text-white'}`}>
                    Audio Recorder
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className={`rounded-xl border p-2.5 ${t.dialogCancel}`}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className={`rounded-[26px] border p-5 ${t.dialogInset}`}>
                <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Input level</p>
                <div className="mt-4">
                  <AudioLevelMeter
                    level={recorder.level}
                    isActive={isRecording || isPaused}
                    activeClassName={isPastel ? 'bg-purple-500' : 'bg-cyber-cyan-400'}
                    idleClassName={isPastel ? 'bg-purple-200/60' : 'bg-white/15'}
                  />
                </div>
                <p className={`mt-3 text-center font-mono text-3xl font-bold tabular-nums ${isPastel ? 'text-gray-900' : 'text-white'}`}>
                  {recorder.durationLabel}
                </p>
                <p className={`mt-1 text-center text-sm ${t.mutedText}`}>
                  {isRecording
                    ? 'Recording to memory — save when finished'
                    : isPaused
                      ? 'Paused'
                      : recorder.status === 'stopped'
                        ? 'Review your take, then save to the case'
                        : 'Ready when you are'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className={`rounded-[22px] border p-4 ${t.compactInsetSurface}`}>
                  <label htmlFor="audio-input-device" className="text-sm font-semibold">
                    Microphone
                  </label>
                  <div className="mt-2 flex gap-2">
                    <select
                      id="audio-input-device"
                      value={selectedDeviceId}
                      onChange={(event) => setSelectedDeviceId(event.target.value)}
                      disabled={devicesLoading || isRecording}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${t.titleInput}`}
                    >
                      {devices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void refresh()}
                      className={`shrink-0 rounded-xl border p-2.5 ${t.secondaryButton}`}
                      aria-label="Refresh devices"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  {devicesError && <p className="mt-2 text-xs text-red-500">{devicesError}</p>}
                </div>

                <div className={`rounded-[22px] border p-4 ${t.compactInsetSurface}`}>
                  <p className="text-sm font-semibold">Quality</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['standard', 'high'] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        disabled={isRecording}
                        onClick={() => setQuality(value)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                          quality === value ? t.button : t.secondaryButton
                        }`}
                      >
                        {value === 'standard' ? 'Standard (96 kbps)' : 'High (192 kbps)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`rounded-[22px] border p-4 ${t.compactInsetSurface}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Save location</p>
                    <p className={`mt-1 text-sm ${t.mutedText}`}>
                      {selectedCasePath
                        ? selectedCaseName || selectedCasePath.split(/[/\\]/).pop()
                        : 'Choose a Vault case folder'}
                    </p>
                    {activeCase && selectedCasePath === activeCase.path && (
                      <p className={`mt-1 text-xs ${isPastel ? 'text-emerald-700' : 'text-emerald-300'}`}>
                        Using your current workspace case
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCaseDialog(true)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${t.secondaryButton}`}
                  >
                    <FolderOpen className="h-4 w-4" />
                    {selectedCasePath ? 'Change case' : 'Select case'}
                  </button>
                </div>
              </div>

              <div className={`rounded-[22px] border p-4 ${t.compactInsetSurface}`}>
                <label htmlFor="recording-file-name" className="text-sm font-semibold">
                  File name
                </label>
                <input
                  id="recording-file-name"
                  type="text"
                  value={fileName}
                  onChange={(event) => setFileName(event.target.value)}
                  placeholder={effectiveFileName}
                  className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${t.titleInput}`}
                />
              </div>

              {previewUrl && (
                <div className={`rounded-[22px] border p-4 ${t.dialogPreviewPanel}`}>
                  <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Preview</p>
                  <audio ref={previewRef} src={previewUrl} controls className="mt-3 w-full" />
                </div>
              )}

              {recorder.error && (
                <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {recorder.error}
                </p>
              )}
            </div>

            <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-6 py-5 ${t.dialogFooter}`}>
              <div className="flex flex-wrap gap-2">
                {recorder.status !== 'recording' && recorder.status !== 'paused' && (
                  <button
                    type="button"
                    onClick={() => void recorder.startRecording()}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${t.button}`}
                  >
                    <Mic className="h-4 w-4" />
                    Record
                  </button>
                )}
                {isRecording && recorder.supportsPause && (
                  <button
                    type="button"
                    onClick={recorder.pauseRecording}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${t.secondaryButton}`}
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </button>
                )}
                {isPaused && (
                  <button
                    type="button"
                    onClick={recorder.resumeRecording}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${t.button}`}
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </button>
                )}
                {(isRecording || isPaused) && (
                  <button
                    type="button"
                    onClick={recorder.stopRecording}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${t.secondaryButton}`}
                  >
                    <Square className="h-4 w-4" />
                    Stop
                  </button>
                )}
                {recorder.recordedBlob && (
                  <button
                    type="button"
                    onClick={recorder.resetRecording}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${t.dialogClearAction}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Discard
                  </button>
                )}
              </div>

              <button
                type="button"
                disabled={!canSave}
                onClick={() => void handleSave()}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${t.button}`}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save to case'}
              </button>
            </div>
          </motion.div>

          <CaseSelectionDialog
            layout="companion"
            isOpen={showCaseDialog}
            elevated
            title="Assign to case"
            subtitle="Recording saves to the case root folder"
            confirmLabel="Use this case"
            onClose={() => setShowCaseDialog(false)}
            onSelectCase={(casePath) => {
              setSelectedCasePath(casePath);
              const match = casePath.split(/[/\\]/).filter(Boolean).pop();
              setSelectedCaseName(match ?? 'Case');
              setShowCaseDialog(false);
            }}
          />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
