import { AlignHorizontalSpaceAround, Crop, Layers, Square, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { NovelPageImage } from '../../types';

interface PageImageControlBarProps {
  image: NovelPageImage;
  anchorRect: DOMRect;
  onWrapModeChange: (wrapMode: NovelPageImage['wrapMode']) => void;
  onCrop: () => void;
  onDelete: () => void;
}

const WRAP_OPTIONS: Array<{
  mode: NovelPageImage['wrapMode'];
  label: string;
  icon: typeof Square;
}> = [
  { mode: 'square', label: 'Wrap text around', icon: Square },
  { mode: 'inline', label: 'Above / below', icon: AlignHorizontalSpaceAround },
  { mode: 'behind', label: 'Behind text', icon: Layers },
];

export function PageImageControlBar({
  image,
  anchorRect,
  onWrapModeChange,
  onCrop,
  onDelete,
}: PageImageControlBarProps) {
  return createPortal(
    <div
      className="pointer-events-auto fixed z-[9998] flex items-center gap-1 rounded-full border border-white/15 bg-black/80 px-1.5 py-1 shadow-xl backdrop-blur-sm"
      style={{
        left: anchorRect.left + anchorRect.width / 2,
        top: anchorRect.bottom + 8,
        transform: 'translateX(-50%)',
      }}
      data-image-control
    >
      {WRAP_OPTIONS.map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          type="button"
          className={`rounded-full p-1.5 transition-colors ${
            image.wrapMode === mode ? 'bg-purple-500 text-white' : 'text-gray-200 hover:bg-white/10'
          }`}
          onClick={(event) => {
            event.stopPropagation();
            onWrapModeChange(mode);
          }}
          aria-label={label}
          title={label}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
      <button
        type="button"
        className="rounded-full p-1.5 text-purple-200 transition-colors hover:bg-purple-500/20"
        onClick={(event) => {
          event.stopPropagation();
          onCrop();
        }}
        aria-label="Crop image"
        title="Crop"
      >
        <Crop className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="rounded-full p-1.5 text-red-300 transition-colors hover:bg-red-500/20"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        aria-label="Delete image"
        title="Delete (Del)"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>,
    document.body
  );
}
