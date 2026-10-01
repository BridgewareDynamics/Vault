import type { CSSProperties } from 'react';
import type { NovelPage, NovelPageImage, NovelPageImageCrop } from '../../types';

export const DEFAULT_PAGE_IMAGE_WIDTH = 140;
export const DEFAULT_PAGE_IMAGE_HEIGHT = 105;

export function createPageImage(
  assetPath: string,
  x: number,
  y: number,
  contentWidthPx: number,
  contentHeightPx: number
): NovelPageImage {
  const width = Math.min(DEFAULT_PAGE_IMAGE_WIDTH, Math.max(80, contentWidthPx * 0.42));
  const height = Math.round(width * (DEFAULT_PAGE_IMAGE_HEIGHT / DEFAULT_PAGE_IMAGE_WIDTH));
  return {
    id: crypto.randomUUID(),
    assetPath,
    x: clamp(x, 0, Math.max(0, contentWidthPx - width)),
    y: clamp(y, 0, Math.max(0, contentHeightPx - height)),
    width,
    height,
    wrapMode: 'square',
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampPageImage(
  image: NovelPageImage,
  contentWidthPx: number,
  contentHeightPx: number
): NovelPageImage {
  const width = clamp(image.width, 40, contentWidthPx);
  const height = clamp(image.height, 40, contentHeightPx);
  return {
    ...image,
    width,
    height,
    x: clamp(image.x, 0, Math.max(0, contentWidthPx - width)),
    y: clamp(image.y, 0, Math.max(0, contentHeightPx - height)),
  };
}

export function getImageFlowStyles(
  image: NovelPageImage,
  contentWidthPx: number
): CSSProperties {
  const floatSide = image.x + image.width / 2 < contentWidthPx / 2 ? 'left' : 'right';

  if (image.wrapMode === 'inline') {
    return {
      display: 'block',
      width: image.width,
      height: image.height,
      marginTop: Math.max(0, image.y),
      marginLeft: Math.max(0, image.x),
      marginRight: 0,
      marginBottom: 8,
      clear: 'both',
      float: 'none',
      shapeOutside: 'none',
    };
  }

  if (image.wrapMode === 'square') {
    const marginLeft = floatSide === 'left' ? Math.max(0, image.x) : 0;
    const marginRight =
      floatSide === 'right' ? Math.max(0, contentWidthPx - image.x - image.width) : 12;
    return {
      float: floatSide,
      width: image.width,
      height: image.height,
      marginTop: Math.max(0, image.y),
      marginLeft,
      marginRight,
      marginBottom: 10,
      shapeOutside: 'margin-box',
    };
  }

  return { display: 'none' };
}

/** @deprecated Use getImageFlowStyles */
export function getImageSpacerStyle(
  image: NovelPageImage,
  contentWidthPx: number
): CSSProperties {
  return getImageFlowStyles(image, contentWidthPx);
}

export function getImageObjectStyleCssText(crop?: NovelPageImageCrop): Record<string, string> {
  const style = getImageObjectStyle(crop);
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue;
    const prop = key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
    result[prop] = String(value);
  }
  return result;
}

export function getImageFrameStyle(image: NovelPageImage): CSSProperties {
  if (image.wrapMode === 'behind') {
    return {
      position: 'absolute',
      left: image.x,
      top: image.y,
      width: image.width,
      height: image.height,
      zIndex: 0,
    };
  }

  return {
    position: 'absolute',
    left: image.x,
    top: image.y,
    width: image.width,
    height: image.height,
    zIndex: 20,
  };
}

export function getImageObjectStyle(crop?: NovelPageImageCrop): CSSProperties {
  if (!crop) {
    return { width: '100%', height: '100%', objectFit: 'cover' };
  }
  const scaleX = 100 / crop.width;
  const scaleY = 100 / crop.height;
  return {
    width: `${scaleX * 100}%`,
    height: `${scaleY * 100}%`,
    maxWidth: 'none',
    objectFit: 'cover',
    objectPosition: `${(crop.x + crop.width / 2) * 100}% ${(crop.y + crop.height / 2) * 100}%`,
    marginLeft: `${-crop.x * scaleX * 100}%`,
    marginTop: `${-crop.y * scaleY * 100}%`,
  };
}

export function applyCropToCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  crop: NovelPageImageCrop
): string {
  const canvas = document.createElement('canvas');
  const sx = Math.round(crop.x * sourceWidth);
  const sy = Math.round(crop.y * sourceHeight);
  const sw = Math.max(1, Math.round(crop.width * sourceWidth));
  const sh = Math.max(1, Math.round(crop.height * sourceHeight));
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas unavailable');
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL('image/jpeg', 0.92);
}

export function stripInlineImagesFromHtml(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<img\b[^>]*>/gi, '');
  }
  const el = document.createElement('div');
  el.innerHTML = html;
  el.querySelectorAll('img').forEach((node) => node.remove());
  return el.innerHTML;
}

export function extractInlineImagesFromHtml(
  html: string,
  contentWidthPx: number,
  contentHeightPx: number
): { cleanHtml: string; images: NovelPageImage[] } {
  if (typeof document === 'undefined') {
    return { cleanHtml: stripInlineImagesFromHtml(html), images: [] };
  }

  const el = document.createElement('div');
  el.innerHTML = html;
  const images: NovelPageImage[] = [];
  let offsetY = 0;

  el.querySelectorAll('img').forEach((node) => {
    if (!(node instanceof HTMLImageElement)) return;
    const assetPath = node.getAttribute('data-novel-asset') ?? '';
    if (!assetPath) {
      node.remove();
      return;
    }

    const width = node.width || parseInt(node.style.width, 10) || DEFAULT_PAGE_IMAGE_WIDTH;
    const height = node.height || Math.round(width * 0.75) || DEFAULT_PAGE_IMAGE_HEIGHT;
    images.push(
      clampPageImage(
        {
          id: crypto.randomUUID(),
          assetPath,
          x: 0,
          y: offsetY,
          width,
          height,
          wrapMode: node.style.float === 'none' ? 'inline' : 'square',
        },
        contentWidthPx,
        contentHeightPx
      )
    );
    offsetY += height + 8;
    node.remove();
  });

  return { cleanHtml: el.innerHTML, images };
}

export function normalizePageImages(page: NovelPage, contentWidthPx: number, contentHeightPx: number): NovelPage {
  const { cleanHtml, images: extracted } = extractInlineImagesFromHtml(
    page.contentHtml,
    contentWidthPx,
    contentHeightPx
  );
  const merged = [...(page.images ?? []), ...extracted].map((image) =>
    clampPageImage(image, contentWidthPx, contentHeightPx)
  );
  return {
    ...page,
    contentHtml: cleanHtml,
    images: merged,
  };
}

export function parseDroppedImageFiles(dataTransfer: DataTransfer): string[] {
  const paths: string[] = [];
  if (dataTransfer.files?.length) {
    for (const file of Array.from(dataTransfer.files)) {
      const electronPath = (file as File & { path?: string }).path;
      if (electronPath) {
        paths.push(electronPath);
      }
    }
  }
  return paths;
}

export function hitTestPageFlowAtPoint(
  pageFlows: Map<string, HTMLElement>,
  clientX: number,
  clientY: number
): string | null {
  for (const [pageId, element] of pageFlows) {
    const rect = element.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return pageId;
    }
  }
  return null;
}

export function getElementVisualScale(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  const layoutWidth = element.offsetWidth;
  if (!layoutWidth) return 1;
  return rect.width / layoutWidth;
}

export function clientPointToPageLocal(
  clientX: number,
  clientY: number,
  flowRect: DOMRect,
  flowElement: HTMLElement,
  pointerOffsetScreenX: number,
  pointerOffsetScreenY: number
): { x: number; y: number } {
  const scale = getElementVisualScale(flowElement);
  const frameScreenLeft = clientX - pointerOffsetScreenX;
  const frameScreenTop = clientY - pointerOffsetScreenY;
  return {
    x: (frameScreenLeft - flowRect.left) / scale,
    y: (frameScreenTop - flowRect.top) / scale,
  };
}

export function computeSpreadDragGrabOffset(
  frameRect: DOMRect,
  clientX: number,
  clientY: number
): { offsetScreenX: number; offsetScreenY: number; visualWidth: number; visualHeight: number } {
  return {
    offsetScreenX: clientX - frameRect.left,
    offsetScreenY: clientY - frameRect.top,
    visualWidth: frameRect.width,
    visualHeight: frameRect.height,
  };
}

export function resolveInsertTargetPageId(
  activePageId: string | null,
  spreadPages: { leftPage?: NovelPage | null; rightPage?: NovelPage | null }
): string | null {
  if (activePageId) {
    const onSpread =
      spreadPages.leftPage?.id === activePageId || spreadPages.rightPage?.id === activePageId;
    if (onSpread) {
      const active =
        spreadPages.leftPage?.id === activePageId
          ? spreadPages.leftPage
          : spreadPages.rightPage;
      if (active?.type === 'content') return active.id;
    }
  }

  const fallback = spreadPages.rightPage ?? spreadPages.leftPage;
  return fallback?.type === 'content' ? fallback.id : null;
}
