import type { NovelPageImage } from '../../types';
import { PageImageFrame } from './PageImageFrame';

interface PageImageLayerProps {
  images: NovelPageImage[];
  previewUrls: Record<string, string | null>;
  selectedImageId: string | null;
  spreadDragImageId?: string | null;
  contentWidthPx: number;
  contentHeightPx: number;
  /** Behind = under text; front = above text, draggable. */
  placement: 'behind' | 'front';
  onSelectImage: (imageId: string | null) => void;
  onMoveImage: (imageId: string, x: number, y: number) => void;
  onSpreadDragStart?: (
    image: NovelPageImage,
    clientX: number,
    clientY: number,
    frameElement: HTMLElement
  ) => void;
  onWrapModeChange: (imageId: string, wrapMode: NovelPageImage['wrapMode']) => void;
  onDeleteImage: (imageId: string) => void;
  onCropImage: (imageId: string) => void;
}

export function PageImageLayer({
  images,
  previewUrls,
  selectedImageId,
  spreadDragImageId = null,
  contentWidthPx,
  contentHeightPx,
  placement,
  onSelectImage,
  onMoveImage,
  onSpreadDragStart,
  onWrapModeChange,
  onDeleteImage,
  onCropImage,
}: PageImageLayerProps) {
  const layerImages = images.filter((image) =>
    placement === 'behind' ? image.wrapMode === 'behind' : image.wrapMode !== 'behind'
  );

  if (layerImages.length === 0) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${placement === 'behind' ? 'z-0' : 'z-[2]'}`}
    >
      {layerImages.map((image) => (
        <PageImageFrame
          key={image.id}
          image={image}
          previewUrl={previewUrls[image.assetPath] ?? null}
          selected={selectedImageId === image.id}
          spreadDragActive={spreadDragImageId === image.id}
          contentWidthPx={contentWidthPx}
          contentHeightPx={contentHeightPx}
          onSelect={onSelectImage}
          onMove={onMoveImage}
          onSpreadDragStart={image.wrapMode === 'behind' ? onSpreadDragStart : undefined}
          onWrapModeChange={onWrapModeChange}
          onDelete={onDeleteImage}
          onCrop={onCropImage}
        />
      ))}
    </div>
  );
}
