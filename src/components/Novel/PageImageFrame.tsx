import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AlignHorizontalSpaceAround, Crop, Layers, Square, Trash2 } from 'lucide-react';
import type { NovelPageImage } from '../../types';
import { clampPageImage, getImageFrameStyle, getImageObjectStyle, getElementVisualScale } from './novelPageImageUtils';

interface PageImageFrameProps {
  image: NovelPageImage;
  previewUrl: string | null;
  selected: boolean;
  contentWidthPx: number;
  contentHeightPx: number;
  spreadDragActive?: boolean;
  onSelect: (imageId: string) => void;
  onMove: (imageId: string, x: number, y: number) => void;
  onSpreadDragStart?: (
    image: NovelPageImage,
    clientX: number,
    clientY: number,
    frameElement: HTMLElement
  ) => void;
  onWrapModeChange: (imageId: string, wrapMode: NovelPageImage['wrapMode']) => void;
  onDelete: (imageId: string) => void;
  onCrop: (imageId: string) => void;
}

const WRAP_OPTIONS: Array<{
  mode: NovelPageImage['wrapMode'];
  label: string;
  icon: typeof Square;
}> = [
  { mode: 'square', label: 'Wrap text', icon: Square },
  { mode: 'inline', label: 'Inline', icon: AlignHorizontalSpaceAround },
  { mode: 'behind', label: 'Behind text', icon: Layers },
];

export const PageImageFrame = memo(function PageImageFrame({
  image,
  previewUrl,
  selected,
  contentWidthPx,
  contentHeightPx,
  spreadDragActive = false,
  onSelect,
  onMove,
  onSpreadDragStart,
  onWrapModeChange,
  onDelete,
  onCrop,
}: PageImageFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || isDragging || spreadDragActive) return;
    frame.style.transform = '';
    frame.style.left = `${image.x}px`;
    frame.style.top = `${image.y}px`;
  }, [image.x, image.y, isDragging, spreadDragActive]);

  const commitPosition = useCallback(
    (x: number, y: number) => {
      const clamped = clampPageImage({ ...image, x, y }, contentWidthPx, contentHeightPx);
      onMove(image.id, clamped.x, clamped.y);
    },
    [contentHeightPx, contentWidthPx, image, onMove]
  );

  const handlePointerDown = (event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest('[data-image-control]')) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(image.id);

    if (onSpreadDragStart && frameRef.current) {
      frameRef.current.setPointerCapture(event.pointerId);
      onSpreadDragStart(image, event.clientX, event.clientY, frameRef.current);
      return;
    }

    frameRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      origX: image.x,
      origY: image.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame) return;

    const scaleParent = (frame.offsetParent instanceof HTMLElement ? frame.offsetParent : frame);
    const scale = getElementVisualScale(scaleParent);
    const dx = (event.clientX - drag.startX) / scale;
    const dy = (event.clientY - drag.startY) / scale;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      frame.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame) return;

    const scaleParent = (frame.offsetParent instanceof HTMLElement ? frame.offsetParent : frame);
    const scale = getElementVisualScale(scaleParent);
    const dx = (event.clientX - drag.startX) / scale;
    const dy = (event.clientY - drag.startY) / scale;
    dragRef.current = null;
    setIsDragging(false);
    frame.style.transform = '';
    commitPosition(drag.origX + dx, drag.origY + dy);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const frameStyle = getImageFrameStyle(image);
  const objectStyle = getImageObjectStyle(image.crop);
  const passThrough = image.wrapMode === 'behind' && !selected && !isDragging && !spreadDragActive;

  if (spreadDragActive) {
    return (
      <div
        aria-hidden
        className="pointer-events-none rounded-md border-2 border-dashed border-purple-400/50 bg-purple-400/10"
        style={{
          ...frameStyle,
          left: image.x,
          top: image.y,
          width: image.width,
          height: image.height,
        }}
      />
    );
  }

  return (
    <div
      ref={frameRef}
      className={`group/image pointer-events-auto touch-none select-none ${
        selected ? 'ring-2 ring-purple-400/90 ring-offset-1 ring-offset-transparent' : ''
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${passThrough ? '!pointer-events-none' : ''}`}
      style={{
        ...frameStyle,
        willChange: isDragging ? 'transform' : undefined,
        transition: isDragging ? 'none' : 'box-shadow 150ms ease',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="relative h-full w-full overflow-hidden rounded-md bg-stone-200/20 shadow-md">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full"
            style={objectStyle}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-500/10 text-xs text-stone-400">
            Loading…
          </div>
        )}

        <button
          type="button"
          data-image-control
          className={`absolute -left-1 -top-1 z-10 rounded-full border border-white/80 bg-red-600 p-1 text-white shadow-lg transition-opacity hover:bg-red-500 ${
            selected ? 'opacity-100' : 'opacity-0 group-hover/image:opacity-100'
          }`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(image.id);
          }}
          aria-label="Delete image"
          title="Delete (Del)"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          data-image-control
          className={`absolute -right-1 -top-1 z-10 rounded-full border border-white/80 bg-purple-600 p-1 text-white shadow-lg transition-opacity hover:bg-purple-500 ${
            selected ? 'opacity-100' : 'opacity-0 group-hover/image:opacity-100'
          }`}
          onClick={(event) => {
            event.stopPropagation();
            onCrop(image.id);
          }}
          aria-label="Crop image"
          title="Crop"
        >
          <Crop className="h-3.5 w-3.5" />
        </button>

        {selected && (
          <div
            data-image-control
            className="absolute -bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-black/75 px-1.5 py-1 shadow-xl backdrop-blur-sm"
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
                  onWrapModeChange(image.id, mode);
                }}
                aria-label={label}
                title={label}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
            <button
              type="button"
              className="rounded-full p-1.5 text-red-300 transition-colors hover:bg-red-500/20"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(image.id);
              }}
              aria-label="Delete image"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
