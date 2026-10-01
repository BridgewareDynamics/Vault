export interface PageMeasureOptions {
  contentWidthPx: number;
  contentHeightPx: number;
  fontFamily: string;
  fontSize: number;
}

export interface OverflowSplitResult {
  keptHtml: string;
  overflowHtml: string;
  isOverflowing: boolean;
}

export interface PaginatePageInput {
  html: string;
  contentWidthPx: number;
  contentHeightPx: number;
  fontFamily: string;
  fontSize: number;
}

const EMPTY_EDITOR_HTML = '<p><br></p>';
const BLOCK_MARGIN = '0.65em';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function plainTextToEditorHtml(text: string): string {
  if (!text.trim()) {
    return EMPTY_EDITOR_HTML;
  }

  const lines = text.split('\n');
  return lines
    .map((line) => {
      const trimmed = line.trim();
      return trimmed ? `<div>${escapeHtml(trimmed)}</div>` : '<div><br></div>';
    })
    .join('');
}

function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const el = document.createElement('div');
  el.innerHTML = html || EMPTY_EDITOR_HTML;
  return el.textContent ?? '';
}

function normalizeEditorHtml(html: string): string {
  const trimmed = html?.trim();
  if (!trimmed || trimmed === '<br>' || trimmed === '<p><br></p>' || trimmed === '<div><br></div>') {
    return EMPTY_EDITOR_HTML;
  }
  return trimmed;
}

function applyBlockSpacing(element: HTMLElement) {
  element.querySelectorAll('p, div').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.marginBottom = BLOCK_MARGIN;
    node.style.marginTop = '0';
  });
  const blocks = element.querySelectorAll('p, div');
  if (blocks.length > 0) {
    (blocks[blocks.length - 1] as HTMLElement).style.marginBottom = '0';
  }
}

function createMeasureElement(options: PageMeasureOptions): HTMLDivElement {
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.visibility = 'hidden';
  el.style.pointerEvents = 'none';
  el.style.left = '-99999px';
  el.style.top = '0';
  el.style.width = `${Math.max(40, options.contentWidthPx)}px`;
  el.style.height = `${Math.max(40, options.contentHeightPx)}px`;
  el.style.maxHeight = `${Math.max(40, options.contentHeightPx)}px`;
  el.style.overflow = 'hidden';
  el.style.fontFamily = options.fontFamily;
  el.style.fontSize = `${options.fontSize}pt`;
  el.style.lineHeight = '1.65';
  el.style.boxSizing = 'border-box';
  el.style.wordBreak = 'break-word';
  document.body.appendChild(el);
  return el;
}

function setMeasureHtml(measureEl: HTMLDivElement, html: string) {
  measureEl.innerHTML = normalizeEditorHtml(html);
  applyBlockSpacing(measureEl);
}

function contentOverflows(measureEl: HTMLDivElement): boolean {
  return measureEl.scrollHeight > measureEl.clientHeight + 1;
}

function splitPlainTextToFit(plain: string, measureEl: HTMLDivElement): { keptPlain: string; overflowPlain: string } {
  if (!plain.trim()) {
    return { keptPlain: '', overflowPlain: '' };
  }

  let low = 0;
  let high = plain.length;
  let bestFit = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    setMeasureHtml(measureEl, plainTextToEditorHtml(plain.slice(0, mid)));
    if (!contentOverflows(measureEl)) {
      bestFit = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  let keptPlain = plain.slice(0, bestFit);
  let overflowPlain = plain.slice(bestFit);

  if (overflowPlain && keptPlain && !/\s$/.test(keptPlain)) {
    const lastSpace = keptPlain.lastIndexOf(' ');
    if (lastSpace > 0) {
      const wordBoundaryPlain = plain.slice(0, lastSpace);
      setMeasureHtml(measureEl, plainTextToEditorHtml(wordBoundaryPlain));
      if (!contentOverflows(measureEl)) {
        keptPlain = wordBoundaryPlain;
        overflowPlain = plain.slice(lastSpace + 1);
      }
    }
  }

  return {
    keptPlain: keptPlain.trimEnd(),
    overflowPlain: overflowPlain.trimStart(),
  };
}

export function computeEditorContentHeightPx(
  metrics: { contentHeightPx: number; scale: number },
  showPageNumbers: boolean
): number {
  const pageNumberReserve = showPageNumbers ? Math.max(16, Math.round(18 * metrics.scale + 8)) : 0;
  return Math.max(40, metrics.contentHeightPx - pageNumberReserve);
}

export function paginatePageInput(input: PaginatePageInput): OverflowSplitResult {
  if (typeof document === 'undefined') {
    return { keptHtml: normalizeEditorHtml(input.html), overflowHtml: '', isOverflowing: false };
  }

  const options: PageMeasureOptions = {
    contentWidthPx: input.contentWidthPx,
    contentHeightPx: input.contentHeightPx,
    fontFamily: input.fontFamily,
    fontSize: input.fontSize,
  };

  return measureHtmlOverflow(input.html, options);
}

export function measureHtmlOverflow(
  html: string,
  options: PageMeasureOptions
): OverflowSplitResult {
  if (typeof document === 'undefined') {
    return { keptHtml: normalizeEditorHtml(html), overflowHtml: '', isOverflowing: false };
  }

  const normalizedHtml = normalizeEditorHtml(html);
  const measureEl = createMeasureElement(options);

  try {
    setMeasureHtml(measureEl, normalizedHtml);
    if (!contentOverflows(measureEl)) {
      return { keptHtml: normalizedHtml, overflowHtml: '', isOverflowing: false };
    }

    const plain = htmlToPlainText(normalizedHtml);
    if (!plain.trim()) {
      return { keptHtml: normalizedHtml, overflowHtml: '', isOverflowing: false };
    }

    const { keptPlain, overflowPlain } = splitPlainTextToFit(plain, measureEl);
    if (!overflowPlain) {
      return { keptHtml: normalizedHtml, overflowHtml: '', isOverflowing: false };
    }

    return {
      keptHtml: plainTextToEditorHtml(keptPlain),
      overflowHtml: plainTextToEditorHtml(overflowPlain),
      isOverflowing: true,
    };
  } finally {
    document.body.removeChild(measureEl);
  }
}

export function mergeHtmlFragments(a: string, b: string): string {
  const left = htmlToPlainText(a).trimEnd();
  const right = htmlToPlainText(b).trimStart();

  if (!left) {
    return plainTextToEditorHtml(right);
  }
  if (!right) {
    return plainTextToEditorHtml(left);
  }

  return plainTextToEditorHtml(`${left} ${right}`);
}

/** @deprecated Use contentWidthPx/contentHeightPx via computeEditorContentHeightPx */
export function legacyPageMeasureOptions(
  width: number,
  height: number,
  fontFamily: string,
  fontSize: number,
  padding: number
): PageMeasureOptions {
  return {
    contentWidthPx: Math.max(40, width - padding * 2),
    contentHeightPx: Math.max(40, height - padding * 2),
    fontFamily,
    fontSize,
  };
}
