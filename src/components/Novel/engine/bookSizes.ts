/** Real-world trim sizes for print books. Each page = full trim width × height. */

export interface BookSizePreset {
  id: string;
  name: string;
  category: 'fiction' | 'international' | 'specialty';
  description: string;
  /** Single page width in millimeters (trim). */
  pageWidthMm: number;
  /** Single page height in millimeters (trim). */
  pageHeightMm: number;
  /** Recommended inner margin in millimeters. */
  marginMm: number;
  /** Typical use case label. */
  typicalUse: string;
}

const MM_PER_INCH = 25.4;
const CSS_DPI = 96;

export const DEFAULT_BOOK_SIZE_ID = 'us-trade';

export const BOOK_SIZE_PRESETS: BookSizePreset[] = [
  {
    id: 'us-trade',
    name: 'US Trade Paperback',
    category: 'fiction',
    description: '6 × 9 in — the industry default for fiction and general non-fiction.',
    pageWidthMm: 152.4,
    pageHeightMm: 228.6,
    marginMm: 19,
    typicalUse: 'Novels, memoirs, general non-fiction',
  },
  {
    id: 'digest',
    name: 'Digest',
    category: 'fiction',
    description: '5.5 × 8.5 in — compact trade format.',
    pageWidthMm: 139.7,
    pageHeightMm: 215.9,
    marginMm: 18,
    typicalUse: 'Literary fiction, smaller print runs',
  },
  {
    id: 'mass-market',
    name: 'Mass Market',
    category: 'fiction',
    description: '4.25 × 6.87 in — pocket paperback.',
    pageWidthMm: 108,
    pageHeightMm: 174,
    marginMm: 12,
    typicalUse: 'Genre fiction, airport reads',
  },
  {
    id: 'royal',
    name: 'Royal',
    category: 'international',
    description: '6.69 × 9.61 in — common UK fiction trim.',
    pageWidthMm: 170,
    pageHeightMm: 244,
    marginMm: 20,
    typicalUse: 'UK fiction, literary titles',
  },
  {
    id: 'a5',
    name: 'A5',
    category: 'international',
    description: '148 × 210 mm — ISO standard, widely used in Europe.',
    pageWidthMm: 148,
    pageHeightMm: 210,
    marginMm: 18,
    typicalUse: 'European paperbacks, manuals',
  },
  {
    id: 'crown-quarto',
    name: 'Crown Quarto',
    category: 'international',
    description: '7.44 × 9.68 in — UK non-fiction standard.',
    pageWidthMm: 189,
    pageHeightMm: 246,
    marginMm: 20,
    typicalUse: 'Non-fiction, illustrated text',
  },
  {
    id: 'textbook-7x10',
    name: 'Textbook',
    category: 'specialty',
    description: '7 × 10 in — academic and reference layout.',
    pageWidthMm: 177.8,
    pageHeightMm: 254,
    marginMm: 22,
    typicalUse: 'Textbooks, workbooks, case files',
  },
  {
    id: 'letter',
    name: 'US Letter',
    category: 'specialty',
    description: '8.5 × 11 in — document and report format.',
    pageWidthMm: 215.9,
    pageHeightMm: 279.4,
    marginMm: 25,
    typicalUse: 'Reports, legal briefs, binders',
  },
  {
    id: 'square-8',
    name: 'Square 8″',
    category: 'specialty',
    description: '8 × 8 in — square photo and art book format.',
    pageWidthMm: 203.2,
    pageHeightMm: 203.2,
    marginMm: 15,
    typicalUse: 'Photo books, art portfolios',
  },
];

const presetById = new Map(BOOK_SIZE_PRESETS.map((preset) => [preset.id, preset]));

export function getBookSizePreset(id: string | undefined | null): BookSizePreset {
  if (id && presetById.has(id)) {
    return presetById.get(id)!;
  }
  return presetById.get(DEFAULT_BOOK_SIZE_ID)!;
}

export function mmToPx(mm: number): number {
  return (mm / MM_PER_INCH) * CSS_DPI;
}

export function inchesLabel(mm: number): string {
  const inches = Math.round((mm / MM_PER_INCH) * 100) / 100;
  return Number.isInteger(inches) ? `${inches.toFixed(0)}″` : `${inches.toFixed(2)}″`;
}

export function formatBookDimensions(preset: BookSizePreset): string {
  return `${inchesLabel(preset.pageWidthMm)} × ${inchesLabel(preset.pageHeightMm)} · ${Math.round(preset.pageWidthMm)} × ${Math.round(preset.pageHeightMm)} mm`;
}

export interface BookDisplayMetrics {
  preset: BookSizePreset;
  scale: number;
  pageWidthPx: number;
  pageHeightPx: number;
  marginPx: number;
  spineWidthPx: number;
  contentWidthPx: number;
  contentHeightPx: number;
}

export function computeBookDisplayMetrics(
  bookSizeId: string | undefined | null,
  marginMm: number | undefined | null,
  containerWidth: number,
  containerHeight: number,
  maxScale = 1.15
): BookDisplayMetrics {
  const preset = getBookSizePreset(bookSizeId);
  const margin = marginMm ?? preset.marginMm;
  const basePageWidth = mmToPx(preset.pageWidthMm);
  const basePageHeight = mmToPx(preset.pageHeightMm);
  const spineWidth = 16;
  const spreadWidth = basePageWidth * 2 + spineWidth;
  const padding = 64;

  const scaleW = (containerWidth - padding) / spreadWidth;
  const scaleH = (containerHeight - padding) / basePageHeight;
  const scale = Math.max(0.35, Math.min(maxScale, scaleW, scaleH));

  const pageWidthPx = Math.round(basePageWidth * scale);
  const pageHeightPx = Math.round(basePageHeight * scale);
  const marginPx = Math.round(mmToPx(margin) * scale);
  const spineWidthPx = Math.round(spineWidth * scale);

  return {
    preset,
    scale,
    pageWidthPx,
    pageHeightPx,
    marginPx,
    spineWidthPx,
    contentWidthPx: Math.max(40, pageWidthPx - marginPx * 2),
    contentHeightPx: Math.max(40, pageHeightPx - marginPx * 2),
  };
}

export function normalizeNovelBookSettings(settings: {
  bookSizeId?: string;
  marginMm?: number;
  [key: string]: unknown;
}): { bookSizeId: string; marginMm: number } {
  const bookSizeId = settings.bookSizeId && presetById.has(settings.bookSizeId)
    ? settings.bookSizeId
    : DEFAULT_BOOK_SIZE_ID;
  const preset = getBookSizePreset(bookSizeId);
  return {
    bookSizeId,
    marginMm: typeof settings.marginMm === 'number' ? settings.marginMm : preset.marginMm,
  };
}
