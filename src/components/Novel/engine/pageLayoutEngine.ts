const WORD_BOUNDARY = /\s+/;

export interface PageMeasureOptions {
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  padding: number;
}

export interface OverflowSplitResult {
  keptHtml: string;
  overflowHtml: string;
  isOverflowing: boolean;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function createMeasureElement(options: PageMeasureOptions): HTMLDivElement {
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.visibility = 'hidden';
  el.style.pointerEvents = 'none';
  el.style.width = `${options.width - options.padding * 2}px`;
  el.style.fontFamily = options.fontFamily;
  el.style.fontSize = `${options.fontSize}pt`;
  el.style.lineHeight = '1.65';
  el.style.overflow = 'hidden';
  document.body.appendChild(el);
  return el;
}

export function measureHtmlOverflow(
  html: string,
  options: PageMeasureOptions
): OverflowSplitResult {
  if (typeof document === 'undefined') {
    return { keptHtml: html, overflowHtml: '', isOverflowing: false };
  }

  const measureEl = createMeasureElement(options);
  measureEl.innerHTML = html || '<p>&nbsp;</p>';
  const maxHeight = options.height - options.padding * 2;
  const isOverflowing = measureEl.scrollHeight > maxHeight + 1;

  if (!isOverflowing) {
    document.body.removeChild(measureEl);
    return { keptHtml: html, overflowHtml: '', isOverflowing: false };
  }

  const plain = stripHtml(html);
  const words = plain.split(WORD_BOUNDARY).filter(Boolean);
  let low = 0;
  let high = words.length;
  let bestFit = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const testText = words.slice(0, mid).join(' ');
    measureEl.innerHTML = testText ? `<p>${testText}</p>` : '<p>&nbsp;</p>';
    if (measureEl.scrollHeight <= maxHeight) {
      bestFit = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const keptText = words.slice(0, bestFit).join(' ');
  const overflowText = words.slice(bestFit).join(' ');
  document.body.removeChild(measureEl);

  return {
    keptHtml: keptText ? `<p>${keptText}</p>` : '',
    overflowHtml: overflowText ? `<p>${overflowText}</p>` : '',
    isOverflowing: Boolean(overflowText),
  };
}

export function mergeHtmlFragments(a: string, b: string): string {
  const strip = (s: string) => s.replace(/^<p>|<\/p>$/g, '').trim();
  const partA = strip(a);
  const partB = strip(b);
  if (!partA) return b || '';
  if (!partB) return a || '';
  return `<p>${partA} ${partB}</p>`;
}
