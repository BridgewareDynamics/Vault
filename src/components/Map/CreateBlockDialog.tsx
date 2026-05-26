import { type DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Paperclip,
  Calendar,
  Type,
  FileStack,
  StickyNote,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import { MapAttachment, MapBlock, MapBranchSide, MapDateTier, Theme } from '../../types';
import { buildChronology, ChronologyInput, formatChronologyLabel } from '../../utils/mapChronology';
import { MAP_BLOCK_DEFAULT_SIZE, MAP_BRANCH_BLOCK_DEFAULT_SIZE } from '../../utils/mapLayout';
import { useMapTheme } from './mapTheme';
import { MapBlockColorPicker } from './MapBlockColorPicker';
import {
  getMapBlockSurfaceStyle,
  mixHexColors,
  normalizeMapBlockColor,
  resolveMapBlockColor,
} from './mapBlockColors';
import { randomUUID } from '../../utils/uuid';
import { LexicalEditor, LexicalEditorHandle } from '../WordEditor/LexicalEditor';
import { MapVaultLibraryPanel } from './MapVaultLibraryPanel';
import {
  createPendingMapAttachment,
  isSavedMapAttachmentCopy,
  MAP_VAULT_DRAG_MIME,
  mergePendingMapAttachments,
  PendingMapAttachment,
} from './mapAttachmentUtils';

interface CreateBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  mapFolderPath: string;
  linkedCasePath?: string | null;
  onSubmit: (block: MapBlock) => void;
  blockToEdit?: MapBlock | null;
  initialSection?: SectionId;
  branchContext?: {
    parentBlockId: string;
    parentTitle?: string;
    side: MapBranchSide;
    sourceSide: 'top' | 'right' | 'bottom' | 'left';
  } | null;
}

const TIERS: { id: MapDateTier; label: string; description: string }[] = [
  { id: 'era', label: 'Era', description: 'Broad historical era' },
  { id: 'phase', label: 'Phase', description: 'Project or research phase' },
  { id: 'year', label: 'Year', description: 'Year with optional month/day' },
  { id: 'month', label: 'Month', description: 'Specific month in a year' },
  { id: 'day', label: 'Day', description: 'Exact calendar date' },
];

type SectionId = 'timeline' | 'details' | 'files' | 'notes';

const DEFAULT_FORM = {
  tier: 'year' as MapDateTier,
  eraLabel: '',
  phaseLabel: '',
  year: new Date().getFullYear() as number | '',
  month: '' as number | '',
  day: '' as number | '',
  title: '',
  surfaceColor: '',
  borderColor: '',
  notesHtml: '',
  pendingFiles: [] as PendingMapAttachment[],
};

type DialogFormState = typeof DEFAULT_FORM;

function buildFormFromBlock(blockToEdit?: MapBlock | null): DialogFormState {
  const chronology = blockToEdit?.chronology;
  return {
    ...DEFAULT_FORM,
    tier: chronology?.tier ?? DEFAULT_FORM.tier,
    eraLabel: chronology?.eraLabel ?? DEFAULT_FORM.eraLabel,
    phaseLabel: chronology?.phaseLabel ?? DEFAULT_FORM.phaseLabel,
    year: chronology?.year ?? new Date().getFullYear(),
    month: chronology?.month ?? DEFAULT_FORM.month,
    day: chronology?.day ?? DEFAULT_FORM.day,
    title: blockToEdit?.title ?? DEFAULT_FORM.title,
    surfaceColor: blockToEdit?.surfaceColor ?? blockToEdit?.color ?? DEFAULT_FORM.surfaceColor,
    borderColor: blockToEdit?.borderColor ?? blockToEdit?.color ?? DEFAULT_FORM.borderColor,
    notesHtml: blockToEdit?.notesHtml ?? DEFAULT_FORM.notesHtml,
    pendingFiles: DEFAULT_FORM.pendingFiles,
  };
}

export function CreateBlockDialog({
  isOpen,
  onClose,
  theme,
  mapFolderPath,
  linkedCasePath,
  onSubmit,
  blockToEdit,
  initialSection,
  branchContext,
}: CreateBlockDialogProps) {
  const t = useMapTheme(theme);
  const notesRef = useRef<LexicalEditorHandle>(null);
  const [section, setSection] = useState<SectionId>('timeline');
  const [form, setForm] = useState<DialogFormState>(() => buildFormFromBlock(blockToEdit));
  const [existingAttachments, setExistingAttachments] = useState<MapAttachment[]>(
    blockToEdit?.attachments ?? []
  );
  const [editorKey, setEditorKey] = useState('new-block-editor');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCaseLibrary, setShowCaseLibrary] = useState(false);
  const [isVaultDropTarget, setIsVaultDropTarget] = useState(false);
  const isEditing = Boolean(blockToEdit);
  const isBranchMode = blockToEdit?.kind === 'branch' || Boolean(branchContext);
  const effectiveBranchContext =
    blockToEdit?.kind === 'branch'
      ? {
          parentBlockId: blockToEdit.branchParentBlockId ?? '',
          parentTitle: branchContext?.parentTitle,
          side: blockToEdit.branchSide ?? 'right',
            sourceSide: blockToEdit.branchSourceSide ?? blockToEdit.branchSide ?? 'right',
        }
      : branchContext;

  useEffect(() => {
    if (isOpen) {
      setForm(buildFormFromBlock(blockToEdit));
      setExistingAttachments(blockToEdit?.attachments ?? []);
      setSection(initialSection ?? (isBranchMode ? 'details' : 'timeline'));
      setError(null);
      setEditorKey(`${blockToEdit?.id ?? 'new'}-${Date.now()}`);
      setShowCaseLibrary(false);
      setIsVaultDropTarget(false);
    }
  }, [isOpen, blockToEdit, initialSection, isBranchMode]);

  const { tier, eraLabel, phaseLabel, year, month, day, title, surfaceColor, borderColor, pendingFiles } = form;

  const showYear = tier === 'year' || tier === 'month' || tier === 'day';
  const showMonth = (tier === 'year' && year !== '') || tier === 'month' || tier === 'day';
  const showDay = ((tier === 'year' || tier === 'month') && month !== '') || tier === 'day';

  const previewChronology = buildChronology({
    tier,
    eraLabel: tier === 'era' ? eraLabel : undefined,
    phaseLabel: tier === 'phase' ? phaseLabel : undefined,
    year: showYear && year !== '' ? Number(year) : undefined,
    month: showMonth && month !== '' ? Number(month) : undefined,
    day: showDay && day !== '' ? Number(day) : undefined,
  });

  const updateForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const validate = (): string | null => {
    if (isBranchMode) return null;
    if (tier === 'era' && !eraLabel.trim()) return 'Enter an era name';
    if (tier === 'phase' && !phaseLabel.trim()) return 'Enter a phase name';
    if ((tier === 'year' || tier === 'month' || tier === 'day') && year === '') {
      return 'Enter a year';
    }
    if (tier === 'month' && month === '') return 'Select a month';
    if (tier === 'day' && (month === '' || day === '')) return 'Enter month and day';
    return null;
  };

  const addPendingFiles = useCallback((additions: PendingMapAttachment[]) => {
    if (additions.length === 0) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      pendingFiles: mergePendingMapAttachments(prev.pendingFiles, additions),
    }));
    setError(null);
  }, []);

  const handlePickFiles = async () => {
    if (!window.electronAPI?.selectMapAttachments) return;
    const paths = await window.electronAPI.selectMapAttachments();
    if (paths.length) {
      addPendingFiles(
        paths.map((path) =>
          createPendingMapAttachment({
            sourcePath: path,
            origin: 'local',
          })
        )
      );
    }
  };

  const handleAttachVaultFile = useCallback(
    (attachment: PendingMapAttachment) => {
      addPendingFiles([attachment]);
    },
    [addPendingFiles]
  );

  const removeFile = (path: string) => {
    updateForm(
      'pendingFiles',
      pendingFiles.filter((file) => file.sourcePath !== path)
    );
  };

  const removeExistingAttachment = (attachmentId: string) => {
    setExistingAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
  };

  const handleVaultDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(MAP_VAULT_DRAG_MIME)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsVaultDropTarget(true);
  };

  const handleVaultDrop = (event: DragEvent<HTMLDivElement>) => {
    const payload = event.dataTransfer.getData(MAP_VAULT_DRAG_MIME);
    setIsVaultDropTarget(false);

    if (!payload) {
      return;
    }

    event.preventDefault();

    try {
      const attachment = JSON.parse(payload) as PendingMapAttachment;
      handleAttachVaultFile(attachment);
    } catch {
      setError('Could not attach the Vault file. Try clicking Attach instead.');
    }
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const notesHtml = notesRef.current?.getContent() ?? form.notesHtml;
      const attachments: MapAttachment[] = [];

      for (const pendingFile of pendingFiles) {
        const attachmentId = randomUUID();
        if (pendingFile.origin === 'vault') {
          attachments.push({
            id: attachmentId,
            fileName: pendingFile.fileName,
            relativePath: pendingFile.sourcePath,
            vaultPath: pendingFile.sourcePath,
            type: pendingFile.type,
          });
          continue;
        }

        if (window.electronAPI?.copyMapAttachmentToAssets) {
          const copied = await window.electronAPI.copyMapAttachmentToAssets(
            mapFolderPath,
            pendingFile.sourcePath,
            attachmentId
          );
          attachments.push({
            id: attachmentId,
            fileName: copied.fileName,
            relativePath: copied.relativePath,
            vaultPath: copied.vaultPath,
            type: copied.type,
          });
        }
      }

      const block: MapBlock = isBranchMode
        ? {
            id: blockToEdit?.id ?? randomUUID(),
            kind: 'branch',
            title: title.trim() || undefined,
            color: undefined,
            surfaceColor: normalizeMapBlockColor(surfaceColor),
            borderColor: normalizeMapBlockColor(borderColor),
            chronology: undefined,
            notesHtml,
            attachments: [...existingAttachments, ...attachments],
            position: blockToEdit?.position ?? { x: 0, y: 0 },
            size: blockToEdit?.size ?? { ...MAP_BRANCH_BLOCK_DEFAULT_SIZE },
            positionLocked: false,
            branchParentBlockId: effectiveBranchContext?.parentBlockId,
            branchSide: effectiveBranchContext?.side,
            branchSourceSide: effectiveBranchContext?.sourceSide ?? effectiveBranchContext?.side,
            branchOrder: blockToEdit?.branchOrder ?? 0,
          }
        : {
            id: blockToEdit?.id ?? randomUUID(),
            kind: 'timeline',
            title: title.trim() || undefined,
            color: undefined,
            surfaceColor: normalizeMapBlockColor(surfaceColor),
            borderColor: normalizeMapBlockColor(borderColor),
            chronology: buildChronology({
              tier,
              eraLabel: tier === 'era' ? eraLabel : undefined,
              phaseLabel: tier === 'phase' ? phaseLabel : undefined,
              year: showYear && year !== '' ? Number(year) : undefined,
              month: showMonth && month !== '' ? Number(month) : undefined,
              day: showDay && day !== '' ? Number(day) : undefined,
            } satisfies ChronologyInput),
            notesHtml,
            attachments: [...existingAttachments, ...attachments],
            position: blockToEdit?.position ?? { x: 0, y: 0 },
            size: blockToEdit?.size ?? { ...MAP_BLOCK_DEFAULT_SIZE },
            positionLocked: blockToEdit?.positionLocked,
          };

      onSubmit(block);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const sections: { id: SectionId; label: string; icon: typeof Calendar }[] = [
    ...(!isBranchMode ? ([{ id: 'timeline', label: 'Timeline', icon: Calendar }] as const) : []),
    { id: 'details', label: 'Details', icon: Type },
    { id: 'files', label: 'Files', icon: FileStack },
    { id: 'notes', label: 'Notes', icon: StickyNote },
  ];
  const branchSubtitle = effectiveBranchContext
    ? `Attached to ${effectiveBranchContext.parentTitle || 'parent block'} on the ${effectiveBranchContext.side} side`
    : 'Attached branch note';
  const dialogTitle = isEditing
    ? isBranchMode
      ? 'Edit Branch Card'
      : 'Edit Block'
    : isBranchMode
      ? 'Create Branch Card'
      : 'Create Block';
  const dialogSubtitle = isBranchMode ? branchSubtitle : formatChronologyLabel(previewChronology);
  const HeaderIcon = isBranchMode ? StickyNote : Calendar;

  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm ${
    t.isPastel
      ? 'bg-white/80 border-pink-200/50 text-gray-800 placeholder:text-gray-400'
      : 'bg-gray-950/60 border-cyber-purple-500/40 text-white placeholder:text-gray-500'
  }`;
  const previewColors = resolveMapBlockColor({
    surfaceColor,
    borderColor,
    legacyColor: blockToEdit?.color,
  });
  const previewCardStyle = getMapBlockSurfaceStyle(
    {
      surfaceColor,
      borderColor,
      legacyColor: blockToEdit?.color,
    },
    {
    theme: t.isPastel ? 'pastel' : 'dark',
    selected: true,
    }
  );
  const previewTitleStyle = previewColors.surfaceColor || previewColors.borderColor
    ? { color: t.isPastel ? '#1F2937' : '#FFFFFF' }
    : undefined;
  const previewSubtitleStyle = previewColors.surfaceColor || previewColors.borderColor
    ? { color: t.isPastel ? '#4B5563' : '#E5E7EB' }
    : undefined;
  const previewAccentStyle = previewColors.accentColor
    ? {
        color: t.isPastel
          ? previewColors.accentColor
          : mixHexColors(previewColors.accentColor, '#FFFFFF', 0.22),
      }
    : undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-block-title"
      >
        <div
          className="w-full max-w-[1800px] flex flex-col xl:flex-row items-stretch justify-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={`rounded-2xl border-2 shadow-2xl w-full max-w-3xl xl:flex-1 max-h-[92vh] flex flex-col overflow-hidden ${t.card}`}
          >
          <header
            className={`flex items-start justify-between gap-4 px-6 py-5 border-b shrink-0 ${
              t.isPastel ? 'border-pink-200/30' : 'border-white/10'
            }`}
          >
            <div>
              <h2 id="create-block-title" className="text-2xl font-bold flex items-center gap-2">
                <HeaderIcon className={`w-6 h-6 ${t.primary}`} />
                {dialogTitle}
              </h2>
              <p className={`text-sm mt-1 ${t.muted}`}>
                <span className={t.primary}>{dialogSubtitle}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <nav
            className={`flex gap-1 px-4 py-3 border-b shrink-0 overflow-x-auto ${
              t.isPastel ? 'border-pink-200/20 bg-pink-50/30' : 'border-white/5 bg-black/20'
            }`}
          >
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  section === id ? t.button : `${t.muted} hover:bg-white/5`
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === 'files' && pendingFiles.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-white/20">
                    {pendingFiles.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto px-6 py-5 min-h-[280px]">
            {!isBranchMode && section === 'timeline' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-3">Timeline tier</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TIERS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateForm('tier', opt.id)}
                        className={`text-left p-3 rounded-xl border-2 transition-all ${
                          tier === opt.id
                            ? `${t.button} border-transparent`
                            : `${t.card} ${t.cardHover}`
                        }`}
                      >
                        <span className="font-semibold block">{opt.label}</span>
                        <span className="text-xs opacity-80 block mt-0.5">{opt.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {tier === 'era' && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Era name</label>
                    <input
                      type="text"
                      placeholder="e.g. Industrial Revolution"
                      value={eraLabel}
                      onChange={(e) => updateForm('eraLabel', e.target.value)}
                      className={inputClass}
                      autoFocus
                    />
                  </div>
                )}
                {tier === 'phase' && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phase name</label>
                    <input
                      type="text"
                      placeholder="e.g. Discovery phase"
                      value={phaseLabel}
                      onChange={(e) => updateForm('phaseLabel', e.target.value)}
                      className={inputClass}
                      autoFocus
                    />
                  </div>
                )}
                {showYear && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={showMonth ? 'sm:col-span-1' : 'sm:col-span-3'}>
                      <label className="block text-sm font-medium mb-1.5">Year</label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) =>
                          updateForm('year', e.target.value ? parseInt(e.target.value, 10) : '')
                        }
                        className={inputClass}
                      />
                    </div>
                    {showMonth && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Month</label>
                        <select
                          value={month}
                          onChange={(e) =>
                            updateForm('month', e.target.value ? parseInt(e.target.value, 10) : '')
                          }
                          className={inputClass}
                        >
                          <option value="">Optional</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m}>
                              {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {showDay && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Day</label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          placeholder="Day"
                          value={day}
                          onChange={(e) =>
                            updateForm('day', e.target.value ? parseInt(e.target.value, 10) : '')
                          }
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {section === 'details' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Block title</label>
                  <input
                    type="text"
                    placeholder="Short label shown on the canvas card"
                    value={title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div
                  className={`p-4 rounded-xl border ${t.isPastel ? 'bg-purple-50/50 border-purple-200/40' : 'bg-cyber-purple-950/30 border-cyber-purple-500/30'}`}
                  style={previewCardStyle}
                >
                  <p className="text-sm font-medium mb-1" style={previewAccentStyle}>
                    Canvas preview
                  </p>
                  <p className={`text-lg font-bold ${t.primary}`} style={previewTitleStyle}>
                    {title.trim() || (isBranchMode ? 'Untitled branch note' : 'Untitled block')}
                  </p>
                  <p className={`text-sm ${t.muted}`} style={previewSubtitleStyle}>
                    {isBranchMode ? branchSubtitle : formatChronologyLabel(previewChronology)}
                  </p>
                  <p className={`text-xs mt-2 ${t.muted}`} style={previewSubtitleStyle}>
                    {existingAttachments.length + pendingFiles.length} attachment
                    {existingAttachments.length + pendingFiles.length === 1 ? '' : 's'}
                  </p>
                </div>

                <div>
                  <div className="mb-2">
                    <p className="text-sm font-semibold">Color Studio</p>
                    <p className={`text-xs mt-1 ${t.muted}`}>
                      Give this {isBranchMode ? 'branch card' : 'block'} its own glowing identity on the canvas.
                    </p>
                  </div>
                  <MapBlockColorPicker
                    theme={theme}
                    surfaceColor={previewColors.surfaceColor}
                    borderColor={previewColors.borderColor}
                    legacyColor={blockToEdit?.color}
                    onSurfaceColorChange={(nextColor) => updateForm('surfaceColor', nextColor ?? '')}
                    onBorderColorChange={(nextColor) => updateForm('borderColor', nextColor ?? '')}
                    blockLabel={title.trim() || (isBranchMode ? 'Untitled branch note' : 'Untitled block')}
                  />
                </div>
              </div>
            )}

            {section === 'files' && (
              <div className="space-y-4">
                <div
                  aria-label="Block attachment drop zone"
                  onDragOver={handleVaultDragOver}
                  onDragLeave={() => setIsVaultDropTarget(false)}
                  onDrop={handleVaultDrop}
                  className={`rounded-2xl border-2 border-dashed p-4 transition-colors ${
                    isVaultDropTarget
                      ? t.isPastel
                        ? 'border-purple-400 bg-purple-100/70'
                        : 'border-cyber-cyan-400 bg-cyber-cyan-500/10'
                      : t.isPastel
                        ? 'border-pink-200/50 bg-white/40'
                        : 'border-white/10 bg-black/20'
                  }`}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handlePickFiles}
                      className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl border ${t.card} ${t.cardHover}`}
                    >
                      <Paperclip className="w-5 h-5" />
                      Add local files
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCaseLibrary((prev) => !prev)}
                      className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl border ${t.card} ${t.cardHover}`}
                    >
                      <FolderOpen className="w-5 h-5" />
                      {showCaseLibrary ? 'Hide Vault case library' : 'Browse Vault case library'}
                    </button>
                  </div>
                  <p className={`text-xs mt-3 text-center ${t.muted}`}>
                    Use the picker or drag from the Vault case library to attach a live PDF link.
                  </p>
                </div>
                {existingAttachments.length === 0 && pendingFiles.length === 0 ? (
                  <p className={`text-sm text-center py-6 ${t.muted}`}>
                    No files attached yet. You can add them now and save them into this block.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {existingAttachments.map((attachment) => (
                      <li
                        key={attachment.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${t.card}`}
                      >
                        <FileStack className={`w-5 h-5 shrink-0 ${t.primary}`} />
                        <div className="flex-1 min-w-0">
                          <span className="block truncate text-sm">{attachment.fileName}</span>
                          <span className={`block text-[11px] ${t.muted}`}>
                            {isSavedMapAttachmentCopy(attachment) ? 'Saved in block' : 'Linked to Vault file'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingAttachment(attachment.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                          aria-label="Remove saved attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                    {pendingFiles.map((file) => (
                      <li
                        key={`${file.origin}:${file.sourcePath}`}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${t.card}`}
                      >
                        <FileStack className={`w-5 h-5 shrink-0 ${t.primary}`} />
                        <div className="flex-1 min-w-0">
                          <span className="block truncate text-sm">{file.fileName}</span>
                          <span className={`block text-[11px] ${t.muted}`}>
                            {file.origin === 'vault'
                              ? 'Vault link will be added on save'
                              : 'Will be copied into block on save'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.sourcePath)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                          aria-label="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {section === 'notes' && (
              <div className="space-y-3">
                <p className={`text-sm ${t.muted}`}>
                  Research notes are saved with this block and editable anytime from expand view.
                </p>
                <div
                  className={`min-h-[220px] rounded-xl border overflow-hidden ${
                    t.isPastel
                      ? 'bg-white border-pink-200/50'
                      : 'bg-gray-950 border-cyber-purple-500/40'
                  }`}
                >
                  <LexicalEditor
                    key={editorKey}
                    ref={notesRef}
                    initialContent={form.notesHtml}
                    onContentChange={(html) => updateForm('notesHtml', html)}
                    placeholder="Type your research notes, citations, observations..."
                    className="min-h-[200px] px-4 py-3 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <footer
            className={`shrink-0 px-6 py-4 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between ${
              t.isPastel ? 'border-pink-200/30 bg-pink-50/20' : 'border-white/10 bg-black/30'
            }`}
          >
            {error && (
              <p className="text-sm text-red-400 flex-1" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-3 sm:ml-auto w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 sm:flex-none px-5 py-3 rounded-xl border font-medium ${t.card}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold ${t.button} disabled:opacity-50`}
              >
                {saving
                  ? isEditing
                    ? 'Saving changes...'
                    : isBranchMode
                      ? 'Adding branch card...'
                      : 'Adding to canvas...'
                  : isEditing
                    ? 'Save Changes'
                    : isBranchMode
                      ? 'Create Branch Card'
                      : 'Create Block'}
              </button>
            </div>
          </footer>
          </motion.div>

          <MapVaultLibraryPanel
            isOpen={section === 'files' && showCaseLibrary}
            linkedCasePath={linkedCasePath}
            theme={theme}
            onClose={() => setShowCaseLibrary(false)}
            onAttachFile={handleAttachVaultFile}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
