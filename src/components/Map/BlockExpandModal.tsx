import { useRef, useState, useCallback, useEffect, useMemo, type CSSProperties, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  ExternalLink,
  StickyNote,
  Paperclip,
  Calendar,
  GitBranch,
  Film,
  ImageIcon,
  File,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { MapBlock, MapAttachment, ArchiveFile, Theme } from '../../types';
import { LexicalEditor, LexicalEditorHandle } from '../WordEditor/LexicalEditor';
import { ArchiveFileViewer } from '../Archive/ArchiveFileViewer';
import { formatChronologyLabel } from '../../utils/mapChronology';
import { useMapTheme } from './mapTheme';
import { getEffectiveBlockAttachments, isMapAttachmentDrag, parseDropPendingAttachments, PendingMapAttachment } from './mapAttachmentUtils';
import {
  getMapBlockSurfaceStyle,
  mixHexColors,
  resolveMapBlockColor,
  withHexAlpha,
} from './mapBlockColors';

interface BlockExpandModalProps {
  isOpen: boolean;
  block: MapBlock | null;
  allBlocks?: MapBlock[];
  theme: Theme;
  onClose: () => void;
  onNotesChange: (blockId: string, notesHtml: string) => void;
  onAttachEvidence?: (blockId: string, additions: PendingMapAttachment[]) => void;
  onRemoveEvidence?: (blockId: string, attachmentId: string) => void;
}

function stripNotesHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function getAttachmentTypeLabel(type: MapAttachment['type']): string {
  switch (type) {
    case 'pdf':
      return 'PDF document';
    case 'image':
      return 'Image';
    case 'video':
      return 'Video';
    default:
      return 'File';
  }
}

function AttachmentTypeIcon({
  type,
  className,
}: {
  type: MapAttachment['type'];
  className?: string;
}) {
  switch (type) {
    case 'pdf':
      return <FileText className={className} />;
    case 'image':
      return <ImageIcon className={className} />;
    case 'video':
      return <Film className={className} />;
    default:
      return <File className={className} />;
  }
}

function AttachmentCard({
  attachment,
  isPastel,
  accentColor,
  onOpen,
  onRemove,
}: {
  attachment: MapAttachment;
  isPastel: boolean;
  accentColor?: string;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (attachment.type !== 'image' || !attachment.vaultPath || !window.electronAPI?.getFileThumbnail) {
        return;
      }
      try {
        const url = await window.electronAPI.getFileThumbnail(attachment.vaultPath);
        if (!cancelled) setThumb(url);
      } catch {
        if (!cancelled) setThumb(null);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [attachment.type, attachment.vaultPath]);

  const cardBorder = isPastel ? 'border-pink-200/50' : 'border-cyber-purple-500/35';
  const cardBg = isPastel ? 'bg-white/90' : 'bg-gray-950/70';
  const hoverGlow = accentColor
    ? { boxShadow: `0 14px 36px -20px ${withHexAlpha(accentColor, 0.65)}` }
    : undefined;

  return (
    <motion.div
      layout
      className={`group relative w-full rounded-xl border overflow-hidden transition-colors ${cardBorder} ${cardBg}`}
      style={hoverGlow}
    >
      {onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${attachment.fileName}`}
          className={`absolute top-2 left-2 z-10 rounded-full p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${
            isPastel
              ? 'bg-white/95 text-red-500 hover:bg-red-50'
              : 'bg-gray-900/90 text-red-400 hover:bg-red-500/20'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      <motion.button
        type="button"
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onOpen}
        className="w-full text-left hover:border-opacity-100"
      >
      <div
        className={`relative h-28 flex items-center justify-center overflow-hidden ${
          isPastel ? 'bg-gradient-to-br from-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-900 to-purple-950/60'
        }`}
      >
        {thumb ? (
          <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        ) : (
          <div
            className={`flex flex-col items-center gap-1.5 ${isPastel ? 'text-purple-400' : 'text-cyber-cyan-400/80'}`}
            style={accentColor ? { color: accentColor } : undefined}
          >
            <AttachmentTypeIcon type={attachment.type} className="w-9 h-9 opacity-90" />
            <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70">
              {attachment.type}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span
          className={`absolute top-2 right-2 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${
            isPastel ? 'bg-white/95 text-purple-600' : 'bg-gray-900/90 text-cyber-cyan-300'
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </div>
      <div className="p-3 space-y-1">
        <p
          className={`text-sm font-semibold leading-snug break-words line-clamp-2 ${
            isPastel ? 'text-gray-800' : 'text-white'
          }`}
        >
          {attachment.fileName}
        </p>
        <p className={`text-[11px] ${isPastel ? 'text-gray-500' : 'text-gray-400'}`}>
          {getAttachmentTypeLabel(attachment.type)}
        </p>
      </div>
      </motion.button>
    </motion.div>
  );
}

export function BlockExpandModal({
  isOpen,
  block,
  allBlocks = [],
  theme,
  onClose,
  onNotesChange,
  onAttachEvidence,
  onRemoveEvidence,
}: BlockExpandModalProps) {
  const t = useMapTheme(theme);
  const editorRef = useRef<LexicalEditorHandle>(null);
  const [viewerFile, setViewerFile] = useState<ArchiveFile | null>(null);
  const [isEvidenceDropTarget, setIsEvidenceDropTarget] = useState(false);

  const openAttachment = useCallback((vaultPath: string, fileName: string, type: ArchiveFile['type']) => {
    const file: ArchiveFile = {
      name: fileName,
      path: vaultPath,
      size: 0,
      modified: Date.now(),
      type,
    };
    setViewerFile(file);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !viewerFile) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, viewerFile]);

  const evidenceAttachments = useMemo(() => {
    if (!block) {
      return [];
    }
    return getEffectiveBlockAttachments(block, allBlocks);
  }, [allBlocks, block]);

  const stats = useMemo(() => {
    if (!block) return { words: 0, chars: 0, attachments: 0 };
    const plain = stripNotesHtml(block.notesHtml);
    return {
      words: countWords(plain),
      chars: plain.length,
      attachments: evidenceAttachments.length,
    };
  }, [block, evidenceAttachments.length]);

  const handleEvidenceDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!onAttachEvidence || !block || !isMapAttachmentDrag(event.dataTransfer)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'copy';
      setIsEvidenceDropTarget(true);
    },
    [block, onAttachEvidence]
  );

  const handleEvidenceDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    const related = event.relatedTarget;
    if (related instanceof Element && event.currentTarget.contains(related)) {
      return;
    }
    setIsEvidenceDropTarget(false);
  }, []);

  const handleEvidenceDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      setIsEvidenceDropTarget(false);
      if (!onAttachEvidence || !block || !isMapAttachmentDrag(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const additions = parseDropPendingAttachments(event.dataTransfer);
      if (additions.length > 0) {
        onAttachEvidence(block.id, additions);
      }
    },
    [block, onAttachEvidence]
  );

  if (!block) return null;

  const isBranch = block.kind === 'branch';
  const resolvedColors = resolveMapBlockColor({
    surfaceColor: block.surfaceColor,
    borderColor: block.borderColor,
    legacyColor: block.color,
  });
  const headerStyle = getMapBlockSurfaceStyle(
    {
      surfaceColor: block.surfaceColor,
      borderColor: block.borderColor,
      legacyColor: block.color,
    },
    {
      theme: t.isPastel ? 'pastel' : 'dark',
      selected: true,
    }
  );
  const accentColor = resolvedColors.accentColor
    ? t.isPastel
      ? resolvedColors.accentColor
      : mixHexColors(resolvedColors.accentColor, '#FFFFFF', 0.22)
    : undefined;
  const accentStyle = accentColor ? { color: accentColor } : undefined;
  const titleStyle =
    resolvedColors.surfaceColor || resolvedColors.borderColor
      ? { color: t.isPastel ? '#111827' : '#FFFFFF' }
      : undefined;
  const subtitleStyle =
    resolvedColors.surfaceColor || resolvedColors.borderColor
      ? { color: t.isPastel ? '#4B5563' : '#E5E7EB' }
      : undefined;
  const panelShell = t.isPastel
    ? 'border-pink-200/50 bg-gradient-to-b from-white/95 to-slate-50/95'
    : 'border-cyber-purple-500/40 bg-gradient-to-b from-gray-950/98 via-gray-950/96 to-purple-950/40';
  const sectionLabel = t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400';
  const editorFrame = t.isPastel
    ? 'bg-white border-pink-200/40 shadow-inner shadow-purple-100/30'
    : 'bg-gray-950/80 border-cyber-purple-500/35 shadow-inner shadow-black/40';
  const metaChip = t.isPastel
    ? 'bg-white/70 border-pink-200/50 text-gray-600'
    : 'bg-gray-900/70 border-cyber-purple-500/35 text-gray-300';
  const kindBadge = isBranch
    ? t.isPastel
      ? 'bg-amber-100/90 text-amber-800 border-amber-200/80'
      : 'bg-amber-500/15 text-amber-200 border-amber-400/35'
    : t.isPastel
      ? 'bg-purple-100/90 text-purple-700 border-purple-200/80'
      : 'bg-cyber-purple-500/15 text-cyber-cyan-200 border-cyber-cyan-400/30';
  const heroAccentLine: CSSProperties | undefined = accentColor
    ? {
        background: `linear-gradient(90deg, transparent, ${withHexAlpha(accentColor, 0.85)}, transparent)`,
      }
    : undefined;
  const displayTitle = block.title || (isBranch ? 'Branch note' : 'Timeline block');
  const contextLabel = isBranch
    ? `${block.branchSide === 'left' ? 'Left' : 'Right'} branch`
    : block.chronology
      ? formatChronologyLabel(block.chronology)
      : 'Timeline';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="block-expand-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 md:p-6"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/75 backdrop-blur-md" aria-hidden />

            <motion.div
              key={block.id}
              role="dialog"
              aria-modal="true"
              aria-labelledby="block-expand-title"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              onDragOver={handleEvidenceDragOver}
              onDragLeave={handleEvidenceDragLeave}
              onDrop={handleEvidenceDrop}
              className={`relative z-10 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border-2 shadow-2xl ${panelShell}`}
            >
              <header
                className="relative shrink-0 border-b border-white/10 overflow-hidden"
                style={headerStyle}
              >
                <div
                  className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full blur-3xl opacity-40"
                  style={
                    accentColor
                      ? { background: withHexAlpha(accentColor, 0.35) }
                      : undefined
                  }
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, ${
                      t.isPastel ? '#7C3AED' : '#22D3EE'
                    } 1px, transparent 0)`,
                    backgroundSize: '18px 18px',
                  }}
                />

                <div className="relative flex items-start justify-between gap-4 p-5 sm:p-6">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${kindBadge}`}
                      >
                        {isBranch ? (
                          <GitBranch className="w-3.5 h-3.5" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5" />
                        )}
                        {isBranch ? 'Branch' : 'Timeline'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${metaChip}`}
                        style={accentStyle}
                      >
                        <Sparkles className="w-3 h-3 opacity-70" />
                        {contextLabel}
                      </span>
                    </div>

                    <div>
                      <h2
                        id="block-expand-title"
                        className="text-2xl sm:text-3xl font-bold leading-tight break-words"
                        style={titleStyle}
                      >
                        {displayTitle}
                      </h2>
                      <p className={`mt-1 text-sm ${t.muted}`} style={subtitleStyle}>
                        Research dossier · expand view
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${metaChip}`}>
                        {stats.attachments} attachment{stats.attachments === 1 ? '' : 's'}
                      </span>
                      <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${metaChip}`}>
                        {stats.words} word{stats.words === 1 ? '' : 's'}
                      </span>
                      {stats.chars > 0 && (
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${metaChip}`}>
                          {stats.chars.toLocaleString()} characters
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close expanded block"
                    className={`shrink-0 rounded-xl border p-2.5 transition-colors ${
                      t.isPastel
                        ? 'border-white/60 bg-white/80 text-gray-600 hover:bg-white hover:text-gray-900'
                        : 'border-white/10 bg-black/30 text-gray-300 hover:bg-black/50 hover:text-white'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="h-px w-full opacity-80" style={heroAccentLine} />
              </header>

              <div className="flex flex-1 min-h-0 flex-col xl:flex-row">
                <section className="flex min-h-0 flex-[1.65] flex-col border-b xl:border-b-0 xl:border-r border-white/10">
                  <div className="flex items-center gap-2 px-5 pt-4 pb-2 sm:px-6">
                    <StickyNote className={`w-4 h-4 ${sectionLabel}`} style={accentStyle} />
                    <h3 className={`text-sm font-semibold tracking-wide uppercase ${sectionLabel}`} style={accentStyle}>
                      Research notes
                    </h3>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
                    <div className={`rounded-2xl border min-h-[min(420px,50vh)] p-1 ${editorFrame}`}>
                      <LexicalEditor
                        ref={editorRef}
                        initialContent={block.notesHtml}
                        onContentChange={(html) => onNotesChange(block.id, html)}
                        placeholder="Capture observations, citations, and narrative threads for this block..."
                        className="min-h-[min(400px,48vh)] text-sm sm:text-[15px] leading-relaxed px-3 py-2"
                      />
                    </div>
                  </div>
                </section>

                <aside className="flex min-h-0 flex-1 flex-col xl:max-w-[22rem]">
                  <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-2 sm:px-6">
                    <div className="flex items-center gap-2">
                      <Paperclip className={`w-4 h-4 ${sectionLabel}`} style={accentStyle} />
                      <h3
                        className={`text-sm font-semibold tracking-wide uppercase ${sectionLabel}`}
                        style={accentStyle}
                      >
                        Evidence
                      </h3>
                    </div>
                    <span className={`text-xs font-medium ${t.muted}`}>{stats.attachments} total</span>
                  </div>

                  <div
                    className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6"
                    onDragOver={handleEvidenceDragOver}
                    onDragLeave={handleEvidenceDragLeave}
                    onDrop={handleEvidenceDrop}
                  >
                    {evidenceAttachments.length === 0 ? (
                      <div
                        className={`flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition-colors ${
                          isEvidenceDropTarget
                            ? t.isPastel
                              ? 'border-purple-400 bg-purple-50/80 text-purple-700'
                              : 'border-cyber-cyan-400 bg-cyber-cyan-500/10 text-cyber-cyan-200'
                            : t.isPastel
                              ? 'border-pink-200/70 bg-white/50 text-gray-500'
                              : 'border-cyber-purple-500/30 bg-gray-950/40 text-gray-400'
                        }`}
                      >
                        <Paperclip className={`mb-3 h-10 w-10 opacity-40 ${sectionLabel}`} />
                        <p className="text-sm font-medium">Drop files here to attach evidence</p>
                        <p className={`mt-1 max-w-[14rem] text-xs leading-relaxed ${t.muted}`}>
                          {isBranch
                            ? 'Files dropped here are shared with the connected timeline block.'
                            : 'Drag files from File Explorer, or use Add local files in the block editor.'}
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 rounded-2xl transition-colors ${
                          isEvidenceDropTarget
                            ? t.isPastel
                              ? 'ring-2 ring-purple-300 ring-offset-2 ring-offset-white/80'
                              : 'ring-2 ring-cyber-cyan-400/50 ring-offset-2 ring-offset-gray-950'
                            : ''
                        }`}
                      >
                        {evidenceAttachments.map((att) => (
                          <AttachmentCard
                            key={att.id}
                            attachment={att}
                            isPastel={t.isPastel}
                            accentColor={accentColor}
                            onOpen={() => openAttachment(att.vaultPath, att.fileName, att.type)}
                            onRemove={
                              onRemoveEvidence && block
                                ? () => onRemoveEvidence(block.id, att.id)
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </aside>
              </div>

              <footer
                className={`shrink-0 border-t px-5 py-2.5 text-center text-[11px] ${
                  t.isPastel ? 'border-pink-200/40 text-gray-400' : 'border-white/10 text-gray-500'
                }`}
              >
                Press <kbd className="font-mono opacity-80">Esc</kbd> to close · Notes save automatically
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewerFile && (
        <ArchiveFileViewer
          file={viewerFile}
          files={[viewerFile]}
          onClose={() => setViewerFile(null)}
          overlayZIndex={100}
        />
      )}
    </>
  );
}
