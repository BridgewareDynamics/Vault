import type { NovelPageImage } from '../../types';
import { getImageFlowStyles } from './novelPageImageUtils';

const SPACER_SELECTOR = '[data-novel-image-spacer]';
const LEGACY_FIGURE_SELECTOR = '[data-novel-image-id]';

/** Strip wrap spacers before saving editor HTML. */
export function getEditorTextHtml(editor: HTMLElement): string {
  const clone = editor.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(SPACER_SELECTOR).forEach((node) => node.remove());
  clone.querySelectorAll(LEGACY_FIGURE_SELECTOR).forEach((node) => node.remove());
  clone.querySelectorAll('[data-novel-image-band]').forEach((node) => node.remove());
  return clone.innerHTML;
}

function applySpacerStyles(
  spacer: HTMLElement,
  image: NovelPageImage,
  contentWidthPx: number
): void {
  const flow = getImageFlowStyles(image, contentWidthPx);
  spacer.style.boxSizing = 'border-box';
  spacer.style.pointerEvents = 'none';
  spacer.style.visibility = 'hidden';
  spacer.style.userSelect = 'none';
  spacer.style.display = flow.display === 'none' ? 'none' : String(flow.display ?? 'block');
  spacer.style.float = (flow.float as string | undefined) ?? 'none';
  spacer.style.clear = (flow.clear as string | undefined) ?? 'none';
  spacer.style.width = `${image.width}px`;
  spacer.style.height = `${image.height}px`;
  spacer.style.marginTop = `${Math.max(0, Number(flow.marginTop ?? 0))}px`;
  spacer.style.marginLeft = `${Math.max(0, Number(flow.marginLeft ?? 0))}px`;
  spacer.style.marginRight = `${Math.max(0, Number(flow.marginRight ?? 0))}px`;
  spacer.style.marginBottom = `${Math.max(0, Number(flow.marginBottom ?? 10))}px`;
  spacer.style.shapeOutside = (flow.shapeOutside as string | undefined) ?? 'none';
  spacer.style.shapeMargin = image.wrapMode === 'square' ? '10px' : '0';
}

/**
 * Invisible float spacers inside the editor so text wraps around images that are
 * rendered as absolutely positioned frames in PageImageLayer.
 */
export function syncEditorImageSpacers(
  editor: HTMLElement,
  images: NovelPageImage[],
  contentWidthPx: number
): void {
  const wrapImages = images.filter(
    (image) => image.wrapMode === 'square' || image.wrapMode === 'inline'
  );
  const wrapIds = new Set(wrapImages.map((image) => image.id));

  editor.querySelectorAll(LEGACY_FIGURE_SELECTOR).forEach((node) => node.remove());
  editor.querySelectorAll('[data-novel-image-band]').forEach((node) => node.remove());

  editor.querySelectorAll(SPACER_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const id = node.dataset.novelImageSpacer;
    if (!id || !wrapIds.has(id)) {
      node.remove();
    }
  });

  const sorted = [...wrapImages].sort((a, b) => a.y - b.y || a.x - b.x);
  for (const image of sorted) {
    let spacer = editor.querySelector<HTMLElement>(
      `${SPACER_SELECTOR}[data-novel-image-spacer="${image.id}"]`
    );
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.contentEditable = 'false';
      spacer.dataset.novelImageSpacer = image.id;
      spacer.setAttribute('aria-hidden', 'true');
      editor.insertBefore(spacer, editor.firstChild);
    }
    applySpacerStyles(spacer, image, contentWidthPx);
  }
}

export function removeEditorImageSpacer(editor: HTMLElement, imageId: string): void {
  editor.querySelector(`${SPACER_SELECTOR}[data-novel-image-spacer="${imageId}"]`)?.remove();
  editor.querySelector(`${LEGACY_FIGURE_SELECTOR}[data-novel-image-id="${imageId}"]`)?.remove();
}
