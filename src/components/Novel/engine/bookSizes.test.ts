import { describe, expect, it } from 'vitest';
import {
  BOOK_SIZE_PRESETS,
  computeBookDisplayMetrics,
  formatBookDimensions,
  getBookSizePreset,
  mmToPx,
  normalizeNovelBookSettings,
} from './bookSizes';

describe('bookSizes', () => {
  it('returns US trade as default preset', () => {
    const preset = getBookSizePreset(undefined);
    expect(preset.id).toBe('us-trade');
    expect(preset.pageWidthMm).toBeCloseTo(152.4, 1);
  });

  it('formats dimensions with inches and millimeters', () => {
    const preset = getBookSizePreset('us-trade');
    expect(formatBookDimensions(preset)).toContain('6″');
    expect(formatBookDimensions(preset)).toContain('mm');
  });

  it('scales pages to fit container', () => {
    const metrics = computeBookDisplayMetrics('mass-market', undefined, 800, 500);
    expect(metrics.pageWidthPx).toBeLessThan(mmToPx(108));
    expect(metrics.pageHeightPx).toBeLessThan(mmToPx(174));
    expect(metrics.scale).toBeLessThan(1);
  });

  it('normalizes legacy documents without book size', () => {
    expect(normalizeNovelBookSettings({})).toEqual({
      bookSizeId: 'us-trade',
      marginMm: 19,
    });
  });

  it('includes common industry trim sizes', () => {
    const ids = BOOK_SIZE_PRESETS.map((preset) => preset.id);
    expect(ids).toContain('digest');
    expect(ids).toContain('a5');
    expect(ids).toContain('letter');
  });
});
