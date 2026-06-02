import type { NovelPageImage } from '../../types';
import { getImageFlowStyles } from './novelPageImageUtils';

const SPACER_SELECTOR = '[data-novel-image-spacer]';
const LEGACY_FIGURE_SELECTOR = '[data-novel-image-id]';
const CHROME_SELECTOR = `${SPACER_SELECTOR}, ${LEGACY_FIGURE_SELECTOR}, [data-novel-image-band]`;

/** Strip wrap spacers before saving editor HTML. */
export function getEditorTextHtml(editor: HTMLElement): string {
  const clone = editor.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(SPACER_SELECTOR).forEach((node) => node.remove());
  clone.querySelectorAll(LEGACY_FIGURE_SELECTOR).forEach((node) => node.remove());
  clone.querySelectorAll('[data-novel-image-band]').forEach((node) => node.remove());
  return clone.innerHTML;
}

function isEditorChromeNode(node: ChildNode): boolean {
  return node instanceof HTMLElement && Boolean(node.matches(CHROME_SELECTOR));
}

function getUserContentChildren(editor: HTMLElement): HTMLElement[] {
  return Array.from(editor.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && !isEditorChromeNode(child)
  );
}

function findLastUserContentChild(editor: HTMLElement): HTMLElement | null {
  const children = getUserContentChildren(editor);
  return children.length > 0 ? children[children.length - 1] : null;
}

function ensureLeadingParagraph(editor: HTMLElement): void {
  if (findLastUserContentChild(editor)) return;
  const paragraph = document.createElement('p');
  paragraph.innerHTML = '<br>';
  const firstChrome = editor.querySelector(SPACER_SELECTOR);
  editor.insertBefore(paragraph, firstChrome ?? editor.firstChild);
}

/**
 * First in-flow block that extends below targetY — spacer goes immediately before it so
 * earlier blocks can hold text above the image.
 */
export function findSpacerInsertBefore(editor: HTMLElement, targetY: number): HTMLElement | null {
  for (const child of getUserContentChildren(editor)) {
    if (child.offsetTop + child.offsetHeight > targetY) {
      return child;
    }
  }
  return null;
}

export function computeSpacerPlacement(
  editor: HTMLElement,
  targetY: number
): { insertBefore: ChildNode | null; marginTop: number } {
  const insertBefore = findSpacerInsertBefore(editor, targetY);
  if (insertBefore) {
    return {
      insertBefore,
      marginTop: Math.max(0, targetY - insertBefore.offsetTop),
    };
  }

  const lastUser = findLastUserContentChild(editor);
  if (lastUser) {
    const afterY = lastUser.offsetTop + lastUser.offsetHeight;
    return {
      insertBefore: lastUser.nextSibling,
      marginTop: Math.max(0, targetY - afterY),
    };
  }

  ensureLeadingParagraph(editor);
  const lead = findLastUserContentChild(editor);
  if (lead) {
    const afterY = lead.offsetTop + lead.offsetHeight;
    return {
      insertBefore: lead.nextSibling,
      marginTop: Math.max(0, targetY - afterY),
    };
  }

  return { insertBefore: editor.firstChild, marginTop: targetY };
}

function moveSpacerBefore(
  spacer: HTMLElement,
  editor: HTMLElement,
  insertBefore: ChildNode | null
): void {
  if (insertBefore) {
    if (spacer.nextSibling !== insertBefore) {
      editor.insertBefore(spacer, insertBefore);
    }
    return;
  }

  if (spacer.parentNode !== editor || spacer !== editor.lastChild) {
    editor.appendChild(spacer);
  }
}

function applySpacerStyles(
  spacer: HTMLElement,
  image: NovelPageImage,
  contentWidthPx: number,
  marginTopPx: number
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
  spacer.style.marginTop = `${Math.max(0, marginTopPx)}px`;
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
    }

    const { insertBefore, marginTop } = computeSpacerPlacement(editor, image.y);
    moveSpacerBefore(spacer, editor, insertBefore);
    applySpacerStyles(spacer, image, contentWidthPx, marginTop);
  }
}

export function removeEditorImageSpacer(editor: HTMLElement, imageId: string): void {
  editor.querySelector(`${SPACER_SELECTOR}[data-novel-image-spacer="${imageId}"]`)?.remove();
  editor.querySelector(`${LEGACY_FIGURE_SELECTOR}[data-novel-image-id="${imageId}"]`)?.remove();
}
