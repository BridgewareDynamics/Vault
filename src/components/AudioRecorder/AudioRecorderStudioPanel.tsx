import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  FolderOpen,
  Mic,
  Minus,
  Pause,
  Play,
  RefreshCw,
  Save,
  Square,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { CaseSelectionDialog } from '../Archive/CaseSelectionDialog';
import { useAudioRecorderStudio } from '../../contexts/AudioRecorderContext';
import { useVaultActiveCase } from '../../contexts/VaultActiveCaseContext';
import { useSettingsContext } from '../../utils/settingsContext';
import { getModuleMenuTheme } from '../../theme/moduleMenuTheme';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';
import { AudioLevelMeter } from './AudioLevelMeter';
import { StudioSlider } from './StudioSlider';

function StudioStatusPill({
  isRecording,
  isPaused,
  isPastel,
}: {
  isRecording: boolean;
  isPaused: boolean;
  isPastel: boolean;
}) {
  if (!isRecording && !isPaused) {
    return (
      <span
        className={`inline-flex min-w-[5.5rem] items-center justify-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider opacity-0`}
        aria-hidden
      >
        Idle
      </span>
    );
  }

  return (
    <span
      className={`inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
        isRecording
          ? isPastel
            ? 'bg-rose-100 text-rose-800'
            : 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30'
          : isPastel
            ? 'bg-amber-100 text-amber-800'
            : 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30'
      }`}
    >
      {isRecording && (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            isPastel ? 'bg-rose-500' : 'bg-rose-400'
          } animate-pulse`}
        />
      )}
      {isRecording ? 'Recording' : 'Paused'}
    </span>
  );
}

export function AudioRecorderStudioPanel() {
  const studio = useAudioRecorderStudio();
  const { activeCase } = useVaultActiveCase();
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);
  const t = getModuleMenuTheme(theme);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const { recorder, isPanelOpen, showCaseDialog, setShowCaseDialog } = studio;
  const isRecording = recorder.status === 'recording';
  const isPaused = recorder.status === 'paused';
  const controlsLocked = isRecording || isPaused;
  const alertMessage = recorder.error || studio.devicesError;

  useEffect(() => {
    if (!recorder.recordedBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(recorder.recordedBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recorder.recordedBlob]);

  const valueTone = isPastel ? 'text-purple-700' : 'text-cyan-200';

  return createPortal(
    <AnimatePresence>
      {isPanelOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Minimize recording studio"
            onClick={studio.minimizeStudio}
          />

          <div
            className={`relative z-10 flex w-full max-w-[min(100%,80rem)] flex-col items-center gap-4 p-1 lg:flex-row lg:items-start lg:justify-center ${
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
              className={`flex max-h-[min(85vh,760px)] w-full max-w-3xl shrink-0 flex-col overflow-hidden rounded-[32px] border shadow-2xl ${t.dialogShellLarge}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`shrink-0 border-b px-6 py-5 ${t.dialogHeader}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`shrink-0 rounded-2xl p-3 ${t.button}`}>
                      <Mic className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs uppercase tracking-[0.28em] ${valueTone}`}>Vault Capture</p>
                      <h2
                        id="audio-recorder-title"
                        className={`truncate text-xl font-bold ${isPastel ? 'text-gray-900' : 'text-white'}`}
                      >
                        Recording Studio
                      </h2>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <StudioStatusPill
                      isRecording={isRecording}
                      isPaused={isPaused}
                      isPastel={isPastel}
                    />
                    <button
                      type="button"
                      onClick={studio.minimizeStudio}
                      className={`rounded-xl border p-2.5 ${t.dialogCancel}`}
                      aria-label="Minimize"
                      title="Minimize"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={studio.closeStudio}
                      className={`rounded-xl border p-2.5 ${t.dialogCancel}`}
                      aria-label="Close studio"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {alertMessage && (
                <div
                  className={`shrink-0 border-b px-6 py-2.5 text-sm ${
                    isPastel
                      ? 'border-rose-200/80 bg-rose-50 text-rose-800'
                      : 'border-rose-500/20 bg-rose-950/40 text-rose-100'
                  }`}
                  role="alert"
                >
                  {alertMessage}
                </div>
              )}

              <div className="vault-studio-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
                <div className={`rounded-[26px] border p-5 ${t.dialogInset}`}>
                  <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Live meter</p>
                  <div className="mt-4 flex min-h-[4.5rem] items-center justify-center">
                    <AudioLevelMeter
                      level={recorder.level}
                      isActive={isRecording || isPaused || studio.isSessionActive}
                      activeClassName={isPastel ? 'bg-purple-500' : 'bg-cyber-cyan-400'}
                      idleClassName={isPastel ? 'bg-purple-200/60' : 'bg-white/15'}
                    />
                  </div>
                  <p
                    className={`mt-3 text-center font-mono text-4xl font-bold tabular-nums leading-none ${
                      isPastel ? 'text-gray-900' : 'text-white'
                    }`}
                  >
                    {recorder.durationLabel}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className={`rounded-[22px] border p-4 ${t.compactInsetSurface}`}>
                    <StudioSlider
                      id="input-gain"
                      label="Input gain"
                      value={studio.inputOptions.inputGainPercent}
                      min={0}
                      max={200}
                      step={5}
                      unit="%"
                      disabled={controlsLocked}
                      hint="Boost or attenuate the mic before it is recorded."
                      valueClassName={valueTone}
                      onChange={(value) =>
                        studio.setInputOptions((prev) => ({ ...prev, inputGainPercent: value }))
                      }
                    />
                  </div>

                  <div className={`rounded-[22px] border p-4 ${t.compactInsetSurface}`}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <Volume2 className="h-4 w-4" />
                        Headphone monitor
                      </label>
                      <button
                        type="button"
                        disabled={controlsLocked}
                        onClick={() =>
                          studio.setInputOptions((prev) => ({
                            ...prev,
                            monitorEnabled: !prev.monitorEnabled,
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          studio.inputOptions.monitorEnabled ? t.button : t.secondaryButton
                        }`}
                      >
                        {studio.inputOptions.monitorEnabled ? 'On' : 'Off'}
                      </button>
                    </div>
                    <StudioSlider
                      id="monitor-volume"
                      label="Monitor level"
                      value={studio.inputOptions.monitorVolumePercent}
                      min={0}
                      max={100}
                      step={5}
                      unit="%"
                      disabled={controlsLocked || !studio.inputOptions.monitorEnabled}
                      hint="Hear yourself while recording (use headphones to avoid feedback)."
                      valueClassName={valueTone}
                      onChange={(value) =>
                        studio.setInputOptions((prev) => ({ ...prev, monitorVolumePercent: value }))
                      }
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-sm font-semibold ${t.secondaryButton}`}
                  aria-expanded={showAdvanced}
                >
                  Input & device settings
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    showAdvanced ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="grid gap-4 pb-1 lg:grid-cols-2">
                      <div className={`rounded-[22px] border p-4 ${t.compactInsetSurface}`}>
                        <label htmlFor="audio-input-device" className="text-sm font-semibold">
                          Microphone
                        </label>
                        <div className="mt-2 flex gap-2">
                          <select
                            id="audio-input-device"
                            value={studio.selectedDeviceId}
                            onChange={(event) => studio.setSelectedDeviceId(event.target.value)}
                            disabled={studio.devicesLoading || controlsLocked}
                            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 ${t.titleInput}`}
                          >
                            {studio.devices.map((device) => (
                              <option key={device.deviceId} value={device.deviceId}>
                                {device.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void studio.refreshDevices()}
                            className={`shrink-0 rounded-xl border p-2.5 ${t.secondaryButton}`}
                            aria-label="Refresh devices"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 space-y-2">
                          {(
                            [
                              ['echoCancellation', 'Echo cancellation'],
                              ['noiseSuppression', 'Noise suppression'],
                              ['autoGainControl', 'Auto gain (OS)'],
                            ] as const
                          ).map(([key, label]) => (
                            <label
                              key={key}
                              className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                                studio.inputOptions[key] ? t.softInsetSurface : t.secondaryButton
                              } ${controlsLocked ? 'opacity-60' : ''}`}
                            >
                              <span>{label}</span>
                              <input
                                type="checkbox"
                                checked={studio.inputOptions[key]}
                                disabled={controlsLocked}
                                onChange={(event) =>
                                  studio.setInputOptions((prev) => ({
                                    ...prev,
                                    [key]: event.target.checked,
                                  }))
                                }
                                className="h-4 w-4 rounded accent-purple-500"
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className={`space-y-4 rounded-[22px] border p-4 ${t.compactInsetSurface}`}>
                        <div>
                          <p className="text-sm font-semibold">Encode quality</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(['standard', 'high'] as const).map((value) => (
                              <button
                                key={value}
                                type="button"
                                disabled={controlsLocked}
                                onClick={() => studio.setQuality(value)}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                                  studio.quality === value ? t.button : t.secondaryButton
                                }`}
                              >
                                {value === 'standard' ? 'Standard · 96 kbps' : 'High · 192 kbps'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold">Save location</p>
                          <p className={`mt-1 text-sm ${t.mutedText}`}>
                            {studio.selectedCasePath
                              ? studio.selectedCaseName ||
                                studio.selectedCasePath.split(/[/\\]/).pop()
                              : 'Choose a Vault case folder'}
                          </p>
                          {activeCase && studio.selectedCasePath === activeCase.path && (
                            <p
                              className={`mt-1 text-xs ${isPastel ? 'text-emerald-700' : 'text-emerald-300'}`}
                            >
                              Using your current workspace case
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowCaseDialog(true)}
                            className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${t.secondaryButton}`}
                          >
                            <FolderOpen className="h-4 w-4" />
                            {studio.selectedCasePath ? 'Change case' : 'Select case'}
                          </button>
                        </div>

                        <div>
                          <label htmlFor="recording-file-name" className="text-sm font-semibold">
                            File name
                          </label>
                          <input
                            id="recording-file-name"
                            type="text"
                            value={studio.fileName}
                            onChange={(event) => studio.setFileName(event.target.value)}
                            placeholder={studio.effectiveFileName}
                            className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 ${t.titleInput}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-[22px] border p-4 transition-opacity duration-200 ${
                    previewUrl ? 'opacity-100' : 'pointer-events-none opacity-0'
                  } ${t.dialogPreviewPanel}`}
                  aria-hidden={!previewUrl}
                >
                  <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Preview</p>
                  {previewUrl ? (
                    <audio
                      ref={previewRef}
                      src={previewUrl}
                      controls
                      className="mt-3 w-full [&::-webkit-media-controls-panel]:bg-transparent"
                    />
                  ) : (
                    <div className="mt-3 h-12" />
                  )}
                </div>
              </div>

              <div
                className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-6 py-5 ${t.dialogFooter}`}
              >
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
                  disabled={!studio.canSave}
                  onClick={() => void studio.handleSave()}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${t.button}`}
                >
                  <Save className="h-4 w-4" />
                  {studio.saving ? 'Saving…' : 'Save to case'}
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
                const match = casePath.split(/[/\\]/).filter(Boolean).pop();
                studio.setSelectedCase(casePath, match ?? 'Case');
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
