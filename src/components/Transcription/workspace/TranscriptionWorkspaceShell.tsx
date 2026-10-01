import { useState } from 'react';
import {
  ArrowLeft,
  AudioLines,
  ChevronDown,
  ChevronUp,
  Cpu,
  Download,
  FolderOpen,
  Home,
  Loader2,
  Mic2,
  Play,
  RefreshCw,
  Save,
  Settings2,
  Square,
  Trash2,
  Video,
  Zap,
} from 'lucide-react';
import type {
  TranscriptionDocument,
  TranscriptionEngineModel,
  TranscriptionEngineStatus,
  TranscriptionSource,
} from '../../../types';
import type { TranscriptionWorkspaceUi } from './useTranscriptionWorkspaceUi';
import {
  TranscriptionMediaSkimmer,
  type TranscriptionMediaSkimmerSelection,
} from './TranscriptionMediaSkimmer';
import { formatMediaTimestamp } from '../../../utils/transcriptionSegmentDefaults';
import {
  groupTranscriptionModelsByFamily,
  type TranscriptionModelFamily,
} from '../../../utils/transcriptionModelCatalog';
import { TranscriptionModelAttribution } from '../TranscriptionModelAttribution';
import type { ModuleChromeProps } from '../../../types/detachableModules';
import { ModuleChromeButtons } from '../../Shared/ModuleChromeButtons';

type WorkspaceTab = 'pipeline' | 'engine' | 'settings';

export interface TranscriptionWorkspaceShellProps extends ModuleChromeProps {
  ui: TranscriptionWorkspaceUi;
  document: TranscriptionDocument;
  titleDraft: string;
  dirty: boolean;
  saving: boolean;
  running: boolean;
  linkedCaseName: string | null;
  engineStatus: TranscriptionEngineStatus | null;
  loadingEngineState: boolean;
  displayModels: TranscriptionEngineModel[];
  deviceOptions: Array<{ value: 'cpu' | 'cuda'; label: string }>;
  selectedSource: TranscriptionSource | null;
  currentModel: TranscriptionEngineModel | null;
  onBack: () => void;
  onHome: () => void;
  onTitleChange: (value: string) => void;
  onTitleCommit: () => void;
  onTitleEscape: () => void;
  onOpenCaseDialog: () => void;
  onMoveToLibrary: () => void;
  onSave: () => void;
  onExport: () => void;
  onRefreshEngine: () => void;
  onStartEngine: () => void;
  onDownloadModel: (modelId: string) => void;
  downloadingModelId: string | null;
  onAddMedia: () => void;
  onSelectSource: (sourceId: string) => void;
  onRemoveSource: (sourceId: string) => void;
  onRun: () => void;
  onCancel: () => void;
  onSettingsChange: (
    updater: (settings: TranscriptionDocument['settings']) => TranscriptionDocument['settings']
  ) => void;
  onMediaSelectionChange: (selection: TranscriptionMediaSkimmerSelection) => void;
  onTranscriptChange: (text: string) => void;
}

function ModelFamilyRow({
  ui,
  family,
  engineRunning,
  downloading,
  onDownload,
}: {
  ui: TranscriptionWorkspaceUi;
  family: TranscriptionModelFamily;
  engineRunning: boolean;
  downloading: boolean;
  onDownload: () => void;
}) {
  const canDownload = family.installable && !family.ready && engineRunning && !downloading;
  const statusLabel = family.ready
    ? family.bundled
      ? 'Bundled'
      : 'Installed'
    : family.installable
      ? 'Not installed'
      : 'Unavailable';

  return (
    <div className={`rounded-lg border px-2 py-1.5 ${ui.inset}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold">{family.name}</p>
          <p className={`text-[10px] ${ui.t.muted}`}>{family.precisions.join(' · ')}</p>
          <p className={`mt-0.5 truncate text-[10px] ${ui.t.muted}`}>{family.modelId}</p>
        </div>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
            family.ready
              ? 'text-emerald-400'
              : family.installable
                ? ui.t.isPastel
                  ? 'text-amber-700'
                  : 'text-amber-300'
                : ui.t.muted
          }`}
        >
          {statusLabel}
        </span>
      </div>
      {family.ready && family.storagePath ? (
        <p className={`mt-1 break-all text-[10px] ${ui.t.muted}`}>{family.storagePath}</p>
      ) : null}
      {family.installable && !family.ready ? (
        <button
          type="button"
          onClick={onDownload}
          disabled={!canDownload}
          className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${ui.surface}`}
          aria-label={`Download ${family.name}`}
        >
          {downloading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Download className="h-3 w-3" />
          )}
          {downloading ? 'Downloading…' : 'Download model'}
        </button>
      ) : null}
      {!engineRunning && family.installable && !family.ready ? (
        <p className={`mt-1 text-[10px] ${ui.t.muted}`}>Start the engine before downloading.</p>
      ) : null}
    </div>
  );
}

function StatusChip({
  ui,
  label,
  value,
  tone = 'neutral',
}: {
  ui: TranscriptionWorkspaceUi;
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'neutral';
}) {
  const toneClass =
    tone === 'good'
      ? ui.t.isPastel
        ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700'
        : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
      : tone === 'warn'
        ? ui.t.isPastel
          ? 'border-amber-200/70 bg-amber-50 text-amber-700'
          : 'border-amber-400/30 bg-amber-500/10 text-amber-300'
        : `${ui.surface} ${ui.t.muted}`;

  return (
    <div className={`rounded-xl border px-2.5 py-2 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-0.5 truncate text-xs font-bold text-inherit">{value}</p>
    </div>
  );
}

export function TranscriptionWorkspaceShell({
  ui,
  document,
  titleDraft,
  dirty,
  saving,
  running,
  linkedCaseName,
  engineStatus,
  loadingEngineState,
  displayModels,
  deviceOptions,
  selectedSource,
  currentModel,
  onBack,
  onHome,
  hostMode,
  onPopOut,
  onReattach,
  popOutDisabled,
  isPastel,
  onTitleChange,
  onTitleCommit,
  onTitleEscape,
  onOpenCaseDialog,
  onMoveToLibrary,
  onSave,
  onExport,
  onRefreshEngine,
  onStartEngine,
  onDownloadModel,
  downloadingModelId,
  onAddMedia,
  onSelectSource,
  onRemoveSource,
  onRun,
  onCancel,
  onSettingsChange,
  onMediaSelectionChange,
  onTranscriptChange,
}: TranscriptionWorkspaceShellProps) {
  const selectedMediaPath = selectedSource?.storedPath ?? selectedSource?.originalPath ?? null;
  const mediaSelection = document.settings.mediaSelection;
  const clipDurationSeconds =
    mediaSelection && selectedSource && mediaSelection.sourceId === selectedSource.id
      ? Math.max(0, mediaSelection.endSeconds - mediaSelection.startSeconds)
      : null;
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('pipeline');
  const [showEngineDetails, setShowEngineDetails] = useState(false);

  const modelFamilies = groupTranscriptionModelsByFamily(displayModels);
  const readyFamilies = modelFamilies.filter((family) => family.ready);
  const progressPct = Math.max(0, Math.min(100, document.progress.percentage || 0));

  const tabs: { id: WorkspaceTab; label: string; icon: typeof Zap }[] = [
    { id: 'pipeline', label: 'Pipeline', icon: Zap },
    { id: 'engine', label: 'Engine', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  return (
    <div className={`flex h-screen flex-col overflow-hidden ${ui.t.bg}`}>
      <header className={`shrink-0 border-b px-4 py-3 md:px-5 ${ui.panel}`}>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button type="button" onClick={onBack} className={`rounded-xl border p-2.5 ${ui.surface}`} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={onHome} className={`rounded-xl border p-2.5 ${ui.surface}`} aria-label="Home">
            <Home className="h-4 w-4" />
          </button>
          <ModuleChromeButtons
            featureLabel="Transcript"
            hostMode={hostMode}
            onPopOut={onPopOut}
            onReattach={onReattach}
            popOutDisabled={popOutDisabled}
            isPastel={isPastel}
          />

          <div className="min-w-[200px] flex-1">
            <input
              type="text"
              value={titleDraft}
              onChange={(event) => onTitleChange(event.target.value)}
              onBlur={onTitleCommit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
                if (event.key === 'Escape') onTitleEscape();
              }}
              className={`w-full rounded-xl border px-3 py-2 text-lg font-bold outline-none ${ui.input}`}
              aria-label="Transcript title"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
              <span
                className={`rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wide ${
                  dirty
                    ? ui.t.isPastel
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                    : ui.t.isPastel
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {dirty ? 'Unsaved' : 'Saved'}
              </span>
              <span className={ui.t.muted}>{document.status}</span>
              {document.progress.statusMessage ? (
                <span className={`truncate ${ui.t.muted}`}>{document.progress.statusMessage}</span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onOpenCaseDialog} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${ui.surface}`}>
              <span className="inline-flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" />
                {document.casePath ? linkedCaseName || 'Case' : 'Assign case'}
              </span>
            </button>
            {document.casePath ? (
              <button type="button" onClick={onMoveToLibrary} className={`hidden rounded-xl border px-3 py-2 text-xs font-semibold sm:inline-flex ${ui.surface}`}>
                To library
              </button>
            ) : null}
            <button type="button" onClick={onSave} disabled={saving} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${ui.surface}`}>
              <span className="inline-flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving…' : 'Save'}
              </span>
            </button>
            <button
              type="button"
              onClick={onExport}
              disabled={!document.transcriptText}
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                document.transcriptText ? ui.t.button : `${ui.surface} opacity-50`
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(300px,340px)_minmax(0,1fr)]">
        <aside className={`flex min-h-0 flex-col border-b xl:border-b-0 xl:border-r ${ui.panel}`}>
          <div className="shrink-0 border-b border-white/10 p-3">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${ui.t.primary}`}>Command center</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
                    activeTab === id ? ui.tabActive : ui.tabIdle
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {activeTab === 'pipeline' && (
              <div className="space-y-3">
                <div className={`rounded-2xl border p-3 ${ui.surface}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className={`text-[10px] uppercase tracking-[0.2em] ${ui.t.primary}`}>Run</p>
                      <p className="mt-1 text-sm font-bold">
                        {currentModel?.name ?? document.settings.model.split(' - ')[0]}
                      </p>
                    </div>
                    {running ? (
                      <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300"
                      >
                        <Square className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onRun}
                        disabled={!selectedSource}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                          selectedSource ? ui.t.button : `${ui.surface} opacity-50`
                        }`}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Transcribe
                      </button>
                    )}
                  </div>
                  <div className="mt-3 rounded-full bg-black/20 p-0.5">
                    <div className={`h-2 rounded-full ${ui.t.button}`} style={{ width: `${Math.max(4, progressPct)}%` }} />
                  </div>
                  <p className={`mt-2 text-xs ${ui.t.muted}`}>
                    {document.progress.statusMessage || 'Ready'} · {progressPct}%
                  </p>
                </div>

                <div className={`rounded-2xl border p-3 ${ui.surface}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">Media sources</p>
                    <button type="button" onClick={onAddMedia} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${ui.t.button}`}>
                      Add
                    </button>
                  </div>
                  <div className="max-h-[min(280px,40vh)] space-y-2 overflow-y-auto pr-0.5">
                    {document.sources.length === 0 ? (
                      <p className={`rounded-xl border px-3 py-3 text-xs ${ui.inset}`}>Add audio or video to begin.</p>
                    ) : (
                      document.sources.map((source) => {
                        const selected = selectedSource?.id === source.id;
                        return (
                          <div
                            key={source.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelectSource(source.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onSelectSource(source.id);
                              }
                            }}
                            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                              selected ? ui.t.button : ui.inset
                            }`}
                          >
                            <div className={`rounded-lg p-1.5 ${selected ? 'bg-white/15' : ui.t.button}`}>
                              {source.mediaType === 'video' ? (
                                <Video className="h-3.5 w-3.5 text-white" />
                              ) : (
                                <AudioLines className="h-3.5 w-3.5 text-white" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold">{source.fileName}</p>
                              <p className={`text-[10px] ${selected ? 'text-white/75' : ui.t.muted}`}>
                                {source.origin === 'vault' ? 'Vault' : 'Local'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onRemoveSource(source.id);
                              }}
                              className="rounded-lg p-1.5 hover:bg-white/10"
                              aria-label={`Remove ${source.fileName}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'engine' && (
              <div className="space-y-3">
                <div className={`rounded-2xl border p-3 ${ui.surface}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-[10px] uppercase tracking-[0.2em] ${ui.t.primary}`}>Runtime</p>
                      <p className="mt-1 text-sm font-bold">Parakeet engine</p>
                    </div>
                    <button
                      type="button"
                      onClick={onRefreshEngine}
                      className={`rounded-lg border p-2 ${ui.inset}`}
                      aria-label="Refresh engine state"
                    >
                      {loadingEngineState ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <StatusChip
                      ui={ui}
                      label="Process"
                      value={engineStatus?.running ? 'Running' : 'Stopped'}
                      tone={engineStatus?.running ? 'good' : 'neutral'}
                    />
                    <StatusChip
                      ui={ui}
                      label="Compute"
                      value={(engineStatus?.deviceDefault || 'cpu').toUpperCase()}
                    />
                    <StatusChip
                      ui={ui}
                      label="CUDA"
                      value={
                        engineStatus?.cudaBuilt
                          ? engineStatus.cudaAvailable
                            ? 'Active'
                            : 'Idle'
                          : 'CPU build'
                      }
                      tone={engineStatus?.cudaAvailable ? 'good' : 'warn'}
                    />
                    <StatusChip
                      ui={ui}
                      label="Default model"
                      value={engineStatus?.defaultModelReady ? 'Ready' : 'Missing'}
                      tone={engineStatus?.defaultModelReady ? 'good' : 'warn'}
                    />
                  </div>

                  {!engineStatus?.running ? (
                    <button
                      type="button"
                      onClick={onStartEngine}
                      className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${ui.t.button}`}
                    >
                      <Mic2 className="h-4 w-4" />
                      Start engine
                    </button>
                  ) : null}

                  {engineStatus?.error ? (
                    <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {engineStatus.error}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setShowEngineDetails((value) => !value)}
                    className={`mt-3 inline-flex w-full items-center justify-center gap-1 text-xs font-semibold ${ui.t.primary}`}
                  >
                    {showEngineDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {showEngineDetails ? 'Hide details' : 'Show details'}
                  </button>

                  {showEngineDetails ? (
                    <div className={`mt-2 space-y-1.5 rounded-xl border p-2.5 text-[11px] ${ui.inset}`}>
                      <p className="break-all">
                        <span className={ui.t.muted}>Python: </span>
                        {engineStatus?.pythonExecutable || engineStatus?.pythonCommand || '—'}
                      </p>
                      <p>
                        <span className={ui.t.muted}>Runtime: </span>
                        {engineStatus?.runtimeMode || '—'}
                      </p>
                      <p className="break-all">
                        <span className={ui.t.muted}>Models: </span>
                        {engineStatus?.bundledModelsDirectory || '—'}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div
                  className={`rounded-2xl border p-3 ${ui.surface}`}
                  aria-label="Transcript model library"
                >
                  <p className={`text-[10px] uppercase tracking-[0.2em] ${ui.t.primary}`}>Model library</p>
                  <p className={`mt-1 text-xs ${ui.t.muted}`}>
                    Download models to your Vault profile for offline transcript work. Files are saved
                    under your user data folder.
                  </p>
                  {engineStatus?.userModelsDirectory ? (
                    <p className={`mt-1 break-all text-[10px] ${ui.t.muted}`}>
                      {engineStatus.userModelsDirectory}
                    </p>
                  ) : null}
                  <div className="mt-2 max-h-[min(280px,36vh)] space-y-1.5 overflow-y-auto pr-0.5">
                    {modelFamilies.length === 0 ? (
                      <p className={`rounded-lg px-2 py-2 text-xs ${ui.inset}`}>
                        Start the engine to inspect available models.
                      </p>
                    ) : (
                      modelFamilies.map((family) => (
                        <ModelFamilyRow
                          key={family.modelId}
                          ui={ui}
                          family={family}
                          engineRunning={!!engineStatus?.running}
                          downloading={downloadingModelId === family.modelId}
                          onDownload={() => onDownloadModel(family.modelId)}
                        />
                      ))
                    )}
                  </div>
                  {readyFamilies.length > 0 ? (
                    <p className={`mt-2 text-[10px] ${ui.t.muted}`}>
                      {readyFamilies.length} of {modelFamilies.length} model families ready locally.
                    </p>
                  ) : null}
                </div>

                <TranscriptionModelAttribution
                  mutedClassName={ui.t.muted}
                  primaryClassName={ui.t.primary}
                  surfaceClassName={ui.surface}
                  activeModelId={currentModel?.modelId ?? null}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className={`space-y-3 rounded-2xl border p-3 ${ui.surface}`}>
                <p className={`text-[10px] uppercase tracking-[0.2em] ${ui.t.primary}`}>Transcript settings</p>

                <TranscriptionMediaSkimmer
                  ui={ui}
                  mediaPath={selectedMediaPath}
                  mediaType={selectedSource?.mediaType ?? 'audio'}
                  sourceId={selectedSource?.id ?? null}
                  savedSelection={mediaSelection}
                  onSelectionChange={onMediaSelectionChange}
                />

                <label className="block text-xs font-semibold">
                  Model
                  <select
                    value={document.settings.model}
                    onChange={(event) =>
                      onSettingsChange((settings) => ({
                        ...settings,
                        model: event.target.value,
                      }))
                    }
                    className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ${ui.input}`}
                  >
                    {displayModels.map((model) => (
                      <option key={model.key} value={model.key}>
                        {model.key}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-semibold">
                    Device
                    <select
                      value={document.settings.device}
                      onChange={(event) =>
                        onSettingsChange((settings) => ({
                          ...settings,
                          device: event.target.value as 'cpu' | 'cuda',
                        }))
                      }
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ${ui.input}`}
                    >
                      {deviceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold">
                    Output
                    <select
                      value={document.settings.outputFormat}
                      onChange={(event) =>
                        onSettingsChange((settings) => ({
                          ...settings,
                          outputFormat: event.target.value as 'txt' | 'srt' | 'vtt' | 'json',
                        }))
                      }
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ${ui.input}`}
                    >
                      <option value="txt">TXT</option>
                      <option value="srt">SRT</option>
                      <option value="vtt">VTT</option>
                      <option value="json">JSON</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold">
                    Segment len
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={document.settings.segmentLength}
                      onChange={(event) =>
                        onSettingsChange((settings) => ({
                          ...settings,
                          segmentLength: Number(event.target.value) || 90,
                        }))
                      }
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ${ui.input}`}
                    />
                    {clipDurationSeconds !== null ? (
                      <span className={`mt-0.5 block text-[10px] font-normal ${ui.t.muted}`}>
                        Auto from {formatMediaTimestamp(clipDurationSeconds)} clip
                      </span>
                    ) : null}
                  </label>
                  <label className="block text-xs font-semibold">
                    Segment dur
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={document.settings.segmentDuration}
                      onChange={(event) =>
                        onSettingsChange((settings) => ({
                          ...settings,
                          segmentDuration: Number(event.target.value) || 10,
                        }))
                      }
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ${ui.input}`}
                    />
                    {clipDurationSeconds !== null ? (
                      <span className={`mt-0.5 block text-[10px] font-normal ${ui.t.muted}`}>
                        Subtitle grouping for selected range
                      </span>
                    ) : null}
                  </label>
                </div>

                <div className={`grid gap-2 rounded-xl border p-2.5 text-xs ${ui.inset}`}>
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={document.settings.includeTimestamps}
                      onChange={(event) =>
                        onSettingsChange((settings) => ({
                          ...settings,
                          includeTimestamps: event.target.checked,
                        }))
                      }
                      className={ui.checkbox}
                    />
                    Timestamps
                  </label>
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={document.settings.curateText}
                      onChange={(event) =>
                        onSettingsChange((settings) => ({
                          ...settings,
                          curateText: event.target.checked,
                        }))
                      }
                      className={ui.checkbox}
                    />
                    Curate text
                  </label>
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={document.settings.batchRecursive}
                      onChange={(event) =>
                        onSettingsChange((settings) => ({
                          ...settings,
                          batchRecursive: event.target.checked,
                        }))
                      }
                      className={ui.checkbox}
                    />
                    Recursive scan hint
                  </label>
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col p-3 md:p-4">
          <div className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border ${ui.panel}`}>
            <div className={`shrink-0 border-b px-4 py-3 ${ui.surface}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`rounded-xl p-2 ${ui.t.button}`}>
                    <AudioLines className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Transcript studio</p>
                    <p className={`text-xs ${ui.t.muted}`}>
                      {selectedSource
                        ? `Source · ${selectedSource.fileName}`
                        : 'Select a source to transcribe'}
                      {currentModel ? ` · ${currentModel.precision}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${ui.surface}`}>
                  {document.segments.length} segments
                </span>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
              <div className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r border-white/10">
                <textarea
                  value={document.transcriptText}
                  onChange={(event) => onTranscriptChange(event.target.value)}
                  className={`min-h-0 flex-1 resize-none border-0 bg-transparent px-4 py-4 text-sm leading-7 outline-none focus:ring-0 ${ui.input} border-none`}
                  placeholder="Transcript output appears here after a successful run. You can edit it directly."
                  aria-label="Transcript text"
                />
              </div>

              <div className="flex min-h-0 flex-col">
                <div className={`shrink-0 border-b px-3 py-2 ${ui.surface}`}>
                  <p className={`text-[10px] uppercase tracking-[0.2em] ${ui.t.primary}`}>Segments</p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  {document.segments.length === 0 ? (
                    <p className={`m-1 rounded-xl border px-3 py-4 text-center text-xs ${ui.inset}`}>
                      Timestamp segments will appear here after you transcribe.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {document.segments.map((segment, index) => (
                        <article
                          key={`${segment.start}-${segment.end}-${index}`}
                          className={`rounded-xl border px-3 py-2.5 ${ui.inset}`}
                        >
                          <p className={`text-[10px] font-bold uppercase tracking-wide ${ui.t.primary}`}>
                            {segment.start.toFixed(2)}s – {segment.end.toFixed(2)}s
                          </p>
                          <p className="mt-1 text-xs leading-5">{segment.text}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
