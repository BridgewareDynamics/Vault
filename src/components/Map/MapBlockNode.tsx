import { memo, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Maximize2, FileText, File, Film, Trash2, Pencil, Plus, PaintBucket } from 'lucide-react';
import { MapBlock, MapBranchSide, MapCanvasSide } from '../../types';
import { formatChronologyLabel } from '../../utils/mapChronology';
import type { MapHandleSide } from '../../utils/mapEdgeRouting';
import {
  getMapBlockSurfaceStyle,
  mixHexColors,
  resolveMapBlockColor,
  withHexAlpha,
} from './mapBlockColors';

type BranchButton = {
  branchSide: MapBranchSide;
  buttonSide: MapCanvasSide;
};

export type MapBlockNodeData = {
  block: MapBlock;
  theme: 'pastel' | 'dark';
  onExpand: (blockId: string) => void;
  onPreview: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onEdit: (blockId: string) => void;
  onEditColor: (blockId: string) => void;
  onCreateBranch: (blockId: string, side: MapBranchSide, sourceSide: MapCanvasSide) => void;
  branchButtons: BranchButton[];
  occupiedSides: MapHandleSide[];
};

type MapBlockFlowNode = Node<MapBlockNodeData, 'mapBlock'>;

const HANDLE_CLASS =
  '!w-2.5 !h-2.5 !border-2 !border-white/80 !bg-cyber-purple-400';
const HIDDEN_HANDLE_CLASS = '!w-3 !h-3 !border-0 !bg-transparent !opacity-0';

const SIDES: { position: Position; side: 'top' | 'right' | 'bottom' | 'left' }[] = [
  { position: Position.Top, side: 'top' },
  { position: Position.Right, side: 'right' },
  { position: Position.Bottom, side: 'bottom' },
  { position: Position.Left, side: 'left' },
];

function MapBlockNodeComponent({ data, selected }: NodeProps<MapBlockFlowNode>) {
  const {
    block,
    theme,
    onExpand,
    onPreview,
    onDelete,
    onEdit,
    onEditColor,
    onCreateBranch,
    branchButtons,
    occupiedSides,
  } = data;
  const isPastel = theme === 'pastel';
  const isBranch = block.kind === 'branch';
  const [thumb, setThumb] = useState<string | null>(null);
  const resolvedColors = resolveMapBlockColor({
    surfaceColor: block.surfaceColor,
    borderColor: block.borderColor,
    legacyColor: block.color,
  });

  const imageAtt = block.attachments.find((a) => a.type === 'image');
  const pdfCount = block.attachments.filter((a) => a.type === 'pdf').length;
  const notePreview = block.notesHtml
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const hasNotes = notePreview.length > 0;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!imageAtt?.vaultPath || !window.electronAPI?.getFileThumbnail) return;
      try {
        const url = await window.electronAPI.getFileThumbnail(imageAtt.vaultPath);
        if (!cancelled) setThumb(url);
      } catch {
        if (!cancelled) setThumb(null);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [imageAtt?.vaultPath]);

  const borderClass = selected
    ? isBranch
      ? isPastel
        ? 'border-amber-400 ring-2 ring-amber-200'
        : 'border-amber-300 ring-2 ring-amber-400/30'
      : isPastel
        ? 'border-purple-400 ring-2 ring-purple-200'
        : 'border-cyber-cyan-400 ring-2 ring-cyber-cyan-400/40'
    : isBranch
      ? isPastel
        ? 'border-amber-200/80'
        : 'border-amber-500/40'
      : isPastel
        ? 'border-pink-200/50'
        : 'border-cyber-purple-500/50';

  const backgroundClass = isBranch
    ? isPastel
      ? 'bg-amber-50/95'
      : 'bg-amber-950/35'
    : isPastel
      ? 'bg-white/90'
      : 'bg-gray-900/95';
  const customSurfaceStyle = getMapBlockSurfaceStyle(
    {
      surfaceColor: block.surfaceColor,
      borderColor: block.borderColor,
      legacyColor: block.color,
    },
    {
      theme: isPastel ? 'pastel' : 'dark',
      selected,
    }
  );
  const accentColor = resolvedColors.accentColor
    ? isPastel
      ? resolvedColors.accentColor
      : mixHexColors(resolvedColors.accentColor, '#FFFFFF', 0.22)
    : undefined;
  const titleColor =
    resolvedColors.surfaceColor || resolvedColors.borderColor ? (isPastel ? '#1F2937' : '#FFFFFF') : undefined;
  const bodyColor =
    resolvedColors.surfaceColor || resolvedColors.borderColor ? (isPastel ? '#4B5563' : '#E5E7EB') : undefined;
  const mutedColor =
    resolvedColors.surfaceColor || resolvedColors.borderColor ? (isPastel ? '#6B7280' : '#CBD5E1') : undefined;
  const actionSurface = resolvedColors.accentColor
    ? {
        background: isPastel
          ? withHexAlpha(mixHexColors(resolvedColors.accentColor, '#FFFFFF', 0.88), 0.92)
          : withHexAlpha(mixHexColors(resolvedColors.accentColor, '#0F172A', 0.6), 0.92),
        borderColor: withHexAlpha(resolvedColors.accentColor, isPastel ? 0.2 : 0.32),
        boxShadow: `0 10px 24px -18px ${withHexAlpha(resolvedColors.accentColor, 0.95)}`,
      }
    : undefined;
  const mediaSurfaceStyle = resolvedColors.surfaceColor
    ? {
        backgroundImage: `linear-gradient(135deg, ${withHexAlpha(mixHexColors(resolvedColors.surfaceColor, '#FFFFFF', isPastel ? 0.74 : 0.18), isPastel ? 0.85 : 0.22)} 0%, ${withHexAlpha(mixHexColors(resolvedColors.surfaceColor, '#111827', isPastel ? 0.44 : 0.62), isPastel ? 0.24 : 0.45)} 100%)`,
      }
    : undefined;

  const cornerBtn = `nodrag nopan absolute w-6 h-6 flex items-center justify-center rounded-md z-20 ${
    isPastel ? 'bg-white/90 text-purple-500 hover:bg-purple-100' : 'bg-gray-800/90 text-cyber-cyan-400 hover:bg-gray-700'
  } border border-white/20 shadow-sm`;
  const branchButtonClass = `nodrag nopan absolute top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full border shadow-md transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 ${
    isPastel
      ? 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
      : 'bg-gray-900 text-amber-300 border-amber-500/50 hover:bg-amber-500/10'
  }`;
  const subtitle = isBranch
    ? `${block.branchSide === 'left' ? 'Left' : 'Right'} branch note`
    : formatChronologyLabel(block.chronology!);
  const attachmentSummary = `${block.attachments.length} file${block.attachments.length === 1 ? '' : 's'}`;
  const branchTitleClass = isPastel ? 'text-amber-600' : 'text-amber-300';
  const visibleSideSet = new Set(occupiedSides);
  const buttonSideClass: Record<MapCanvasSide, string> = {
    top: 'left-1/2 top-auto bottom-auto -top-4 -translate-x-1/2 !translate-y-0',
    right: '-right-4',
    bottom: 'left-1/2 top-auto -bottom-4 -translate-x-1/2 !translate-y-0',
    left: '-left-4',
  };

  return (
    <div
      className={`group relative rounded-2xl border-2 overflow-visible backdrop-blur-md shadow-lg ${borderClass} ${
        backgroundClass
      }`}
      style={{
        width: block.size.width,
        height: block.size.height,
        ...customSurfaceStyle,
      }}
    >
      {SIDES.map(({ position, side }) => (
        <span key={side}>
          <Handle
            type="source"
            position={position}
            id={`source-${side}`}
            className={visibleSideSet.has(side) ? HANDLE_CLASS : HIDDEN_HANDLE_CLASS}
          />
          <Handle
            type="target"
            position={position}
            id={`target-${side}`}
            className={visibleSideSet.has(side) ? `${HANDLE_CLASS} !bg-cyber-cyan-400` : HIDDEN_HANDLE_CLASS}
          />
        </span>
      ))}

      {branchButtons.map(({ branchSide, buttonSide }) => (
        <button
          key={`${branchSide}-${buttonSide}`}
          type="button"
          className={`${branchButtonClass} ${buttonSideClass[buttonSide]}`}
          style={accentColor ? { ...actionSurface, color: accentColor } : actionSurface}
          onClick={(event) => {
            event.stopPropagation();
            onCreateBranch(block.id, branchSide, buttonSide);
          }}
          aria-label={`Create ${branchSide} branch`}
          data-branch-button-side={buttonSide}
          data-branch-side={branchSide}
          title={`Create ${branchSide} branch`}
        >
          <Plus className="w-4 h-4 mx-auto" />
        </button>
      ))}

      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
        const isDeleteCorner = corner === 'br';
        const isEditCorner = corner === 'tr';
        const isColorCorner = corner === 'bl';
        return (
          <button
            key={corner}
            type="button"
            className={`${cornerBtn} ${
              isDeleteCorner
                ? isPastel
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-red-400 hover:bg-red-500/20'
                : isEditCorner
                  ? isPastel
                    ? 'text-amber-600 hover:bg-amber-50'
                    : 'text-amber-300 hover:bg-amber-500/20'
                : ''
            } ${
              corner === 'tl'
                ? 'top-1 left-1'
                : corner === 'tr'
                  ? 'top-1 right-1'
                  : corner === 'bl'
                    ? 'bottom-1 left-1'
                    : 'bottom-1 right-1'
            }`}
            style={
              isColorCorner && accentColor ? { ...actionSurface, color: accentColor } : actionSurface
            }
            onClick={(e) => {
              e.stopPropagation();
              if (isDeleteCorner) {
                onDelete(block.id);
                return;
              }
              if (isEditCorner) {
                onEdit(block.id);
                return;
              }
              if (isColorCorner) {
                onEditColor(block.id);
                return;
              }
              onExpand(block.id);
            }}
            aria-label={
              isDeleteCorner
                ? 'Delete block'
                : isEditCorner
                  ? 'Edit block'
                  : isColorCorner
                    ? 'Open color studio'
                    : 'Expand block'
            }
          >
            {isDeleteCorner ? (
              <Trash2 className="w-3 h-3" />
            ) : isEditCorner ? (
              <Pencil className="w-3 h-3" />
            ) : isColorCorner ? (
              <PaintBucket className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>
        );
      })}

      <button
        type="button"
        className="nodrag nopan w-full h-full flex flex-col p-3 pt-8 pb-8 text-left rounded-2xl overflow-hidden"
        onClick={() => onPreview(block.id)}
      >
        <span
          className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
            isBranch ? branchTitleClass : isPastel ? 'text-purple-500' : 'text-cyber-cyan-400'
          }`}
          style={accentColor ? { color: accentColor } : undefined}
        >
          {subtitle}
        </span>
        {block.title && (
          <span
            className={`text-sm font-bold truncate mb-1 ${isPastel ? 'text-gray-800' : 'text-white'}`}
            style={titleColor ? { color: titleColor } : undefined}
          >
            {block.title}
          </span>
        )}
        {isBranch ? (
          <>
            <div className="mb-2 flex-1 min-h-0">
              {hasNotes ? (
                <span
                  className={`block text-[10px] leading-4 ${isPastel ? 'text-gray-600' : 'text-amber-100/90'}`}
                  style={{
                    color: bodyColor,
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {notePreview}
                </span>
              ) : (
                <span
                  className={`text-[10px] italic ${isPastel ? 'text-gray-400' : 'text-amber-100/60'}`}
                  style={mutedColor ? { color: mutedColor } : undefined}
                >
                  Add notes, files, and observations
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span
                className={isPastel ? 'text-gray-500' : 'text-amber-100/75'}
                style={mutedColor ? { color: mutedColor } : undefined}
              >
                {attachmentSummary}
              </span>
              {block.attachments.some((attachment) => attachment.type === 'video') ? (
                <Film
                  className={`w-3.5 h-3.5 ${isPastel ? 'text-amber-500' : 'text-amber-300'}`}
                  style={accentColor ? { color: accentColor } : undefined}
                />
              ) : pdfCount > 0 ? (
                <FileText
                  className={`w-3.5 h-3.5 ${isPastel ? 'text-amber-500' : 'text-amber-300'}`}
                  style={accentColor ? { color: accentColor } : undefined}
                />
              ) : (
                <File
                  className={`w-3.5 h-3.5 ${isPastel ? 'text-amber-500' : 'text-amber-300'}`}
                  style={accentColor ? { color: accentColor } : undefined}
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-2 min-h-[2.5rem]">
              {hasNotes ? (
                <span
                  className={`block text-[10px] leading-4 ${isPastel ? 'text-gray-600' : 'text-gray-300'}`}
                  style={{
                    color: bodyColor,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {notePreview}
                </span>
              ) : (
                <span
                  className={`text-[10px] italic ${isPastel ? 'text-gray-400' : 'text-gray-500'}`}
                  style={mutedColor ? { color: mutedColor } : undefined}
                >
                  No notes yet
                </span>
              )}
            </div>
            <div className="mb-2 flex items-center justify-between text-[10px]">
              <span
                className={isPastel ? 'text-gray-500' : 'text-gray-400'}
                style={mutedColor ? { color: mutedColor } : undefined}
              >
                {attachmentSummary}
              </span>
              {pdfCount > 0 && (
                <span
                  className={isPastel ? 'text-purple-500' : 'text-cyber-cyan-400'}
                  style={accentColor ? { color: accentColor } : undefined}
                >
                  {pdfCount} pdf
                </span>
              )}
            </div>
            <div
              className="flex-1 min-h-0 rounded-lg overflow-hidden bg-black/10 flex items-center justify-center"
              style={mediaSurfaceStyle}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div
                  className={`flex flex-col items-center gap-1 ${isPastel ? 'text-gray-400' : 'text-gray-500'}`}
                  style={mutedColor ? { color: mutedColor } : undefined}
                >
                  {pdfCount > 0 ? <FileText className="w-8 h-8" /> : <File className="w-8 h-8" />}
                  {block.attachments.length > 0 && <span className="text-xs">Preview</span>}
                  {block.attachments.some((a) => a.type === 'video') && <Film className="w-4 h-4" />}
                </div>
              )}
            </div>
          </>
        )}
      </button>
    </div>
  );
}

export const MapBlockNode = memo(MapBlockNodeComponent);
