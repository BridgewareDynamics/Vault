import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crop, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Theme } from '../../types';
import type { NovelPageImageCrop } from '../../types';
import { useNovelTheme } from './novelTheme';
import { applyCropToCanvas } from './novelPageImageUtils';

interface NovelImageCropDialogProps {
  isOpen: boolean;
  theme: Theme;
  imageUrl: string | null;
  initialCrop?: NovelPageImageCrop;
  onClose: () => void;
  onApply: (crop: NovelPageImageCrop, croppedDataUrl: string) => void;
}

const DEFAULT_CROP: NovelPageImageCrop = { x: 0, y: 0, width: 1, height: 1 };

export function NovelImageCropDialog({
  isOpen,
  theme,
  imageUrl,
  initialCrop,
  onClose,
  onApply,
}: NovelImageCropDialogProps) {
  const t = useNovelTheme(theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    mode: 'move' | 'resize';
    handle?: 'se' | 'sw' | 'ne' | 'nw';
    startX: number;
    startY: number;
    startCrop: NovelPageImageCrop;
  } | null>(null);

  const [crop, setCrop] = useState<NovelPageImageCrop>(initialCrop ?? DEFAULT_CROP);
  const [zoom, setZoom] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    if (!isOpen) return;
    setCrop(initialCrop ?? DEFAULT_CROP);
    setZoom(1);
  }, [isOpen, initialCrop, imageUrl]);

  const clampCrop = useCallback((next: NovelPageImageCrop): NovelPageImageCrop => {
    const width = Math.min(1, Math.max(0.08, next.width));
    const height = Math.min(1, Math.max(0.08, next.height));
    const x = Math.min(1 - width, Math.max(0, next.x));
    const y = Math.min(1 - height, Math.max(0, next.y));
    return { x, y, width, height };
  }, []);

  const pointerToCrop = useCallback(
    (clientX: number, clientY: number): { nx: number; ny: number } | null => {
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const nx = (clientX - rect.left) / rect.width;
      const ny = (clientY - rect.top) / rect.height;
      return {
        nx: Math.min(1, Math.max(0, nx)),
        ny: Math.min(1, Math.max(0, ny)),
      };
    },
    []
  );

  const handlePointerDown = (
    event: React.PointerEvent,
    mode: 'move' | 'resize',
    handle?: 'se' | 'sw' | 'ne' | 'nw'
  ) => {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: crop,
    };
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const point = pointerToCrop(event.clientX, event.clientY);
    const startPoint = pointerToCrop(drag.startX, drag.startY);
    if (!point || !startPoint) return;

    const dx = point.nx - startPoint.nx;
    const dy = point.ny - startPoint.ny;
    const start = drag.startCrop;

    if (drag.mode === 'move') {
      setCrop(
        clampCrop({
          ...start,
          x: start.x + dx,
          y: start.y + dy,
        })
      );
      return;
    }

    if (drag.handle === 'se') {
      setCrop(
        clampCrop({
          ...start,
          width: start.width + dx,
          height: start.height + dy,
        })
      );
    } else if (drag.handle === 'sw') {
      setCrop(
        clampCrop({
          x: start.x + dx,
          width: start.width - dx,
          y: start.y,
          height: start.height + dy,
        })
      );
    } else if (drag.handle === 'ne') {
      setCrop(
        clampCrop({
          x: start.x,
          width: start.width + dx,
          y: start.y + dy,
          height: start.height - dy,
        })
      );
    } else if (drag.handle === 'nw') {
      setCrop(
        clampCrop({
          x: start.x + dx,
          width: start.width - dx,
          y: start.y + dy,
          height: start.height - dy,
        })
      );
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleApply = () => {
    const img = imageRef.current;
    if (!img || !imageUrl) return;
    const dataUrl = applyCropToCanvas(img, naturalSize.width, naturalSize.height, crop);
    onApply(crop, dataUrl);
    onClose();
  };

  if (!isOpen || !imageUrl) return null;

  const cropStyle = {
    left: `${crop.x * 100}%`,
    top: `${crop.y * 100}%`,
    width: `${crop.width * 100}%`,
    height: `${crop.height * 100}%`,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="novel-crop-dialog-title"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-2xl overflow-hidden rounded-2xl border-2 shadow-2xl ${t.body} ${t.dialogShell}`}
        >
          <div className={`flex items-center justify-between gap-4 border-b px-5 py-4 ${t.dialogHeader}`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-xl border p-2 ${t.dialogIconBox}`}>
                <Crop className="h-5 w-5" />
              </div>
              <div>
                <h2 id="novel-crop-dialog-title" className="text-lg font-bold">
                  Crop image
                </h2>
                <p className={`text-sm ${t.muted}`}>Drag the frame or corners to adjust</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div
              ref={containerRef}
              className="relative mx-auto overflow-hidden rounded-xl bg-black/40"
              style={{
                width: '100%',
                maxWidth: 640,
                aspectRatio: `${naturalSize.width} / ${naturalSize.height}`,
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt=""
                className="h-full w-full select-none object-contain"
                draggable={false}
                onLoad={(event) => {
                  const target = event.currentTarget;
                  setNaturalSize({ width: target.naturalWidth, height: target.naturalHeight });
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-black/45" />
              <div
                className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                style={cropStyle}
              >
                <div
                  className="absolute inset-0 cursor-move"
                  onPointerDown={(event) => handlePointerDown(event, 'move')}
                />
                {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => (
                  <div
                    key={handle}
                    className={`absolute h-3.5 w-3.5 rounded-full border-2 border-white bg-purple-500 ${
                      handle === 'nw'
                        ? '-left-1.5 -top-1.5 cursor-nwse-resize'
                        : handle === 'ne'
                          ? '-right-1.5 -top-1.5 cursor-nesw-resize'
                          : handle === 'sw'
                            ? '-bottom-1.5 -left-1.5 cursor-nesw-resize'
                            : '-bottom-1.5 -right-1.5 cursor-nwse-resize'
                    }`}
                    onPointerDown={(event) => handlePointerDown(event, 'resize', handle)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                className={`rounded-lg border p-2 ${t.badgeNeutral}`}
                onClick={() => setZoom((value) => Math.max(0.75, value - 0.1))}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className={`text-sm ${t.muted}`}>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                className={`rounded-lg border p-2 ${t.badgeNeutral}`}
                onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={`flex gap-3 border-t px-5 py-4 ${t.dialogFooter}`}>
            <button type="button" onClick={onClose} className={`flex-1 rounded-xl border px-4 py-2.5 ${t.dialogCancel}`}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white ${t.button}`}
            >
              <Check className="h-4 w-4" />
              Apply crop
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
