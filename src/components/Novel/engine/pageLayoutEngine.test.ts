import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  measureHtmlOverflow,
  mergeHtmlFragments,
  plainTextToEditorHtml,
  legacyPageMeasureOptions,
} from './pageLayoutEngine';

describe('pageLayoutEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns no overflow for short content', () => {
    const result = measureHtmlOverflow('<p>Hello world</p>', {
      contentWidthPx: 284,
      contentHeightPx: 384,
      fontFamily: 'Georgia, serif',
      fontSize: 12,
    });
    expect(result.isOverflowing).toBe(false);
    expect(result.overflowHtml).toBe('');
  });

  it('splits overflowing content and keeps the beginning on the current page', () => {
    const longText = Array.from({ length: 120 }, (_, index) => `word${index}`).join(' ');
    const html = plainTextToEditorHtml(longText);
    const options = {
      contentWidthPx: 220,
      contentHeightPx: 120,
      fontFamily: 'Georgia, serif',
      fontSize: 12,
    };

    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function scrollHeightMock() {
      const element = this as HTMLElement;
      const textLength = element.textContent?.length ?? 0;
      return textLength > 80 ? 400 : 80;
    });
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function clientHeightMock() {
      const element = this as HTMLElement;
      const style = element.style.height;
      if (style.endsWith('px')) {
        return Number.parseFloat(style);
      }
      return 120;
    });

    const result = measureHtmlOverflow(html, options);

    expect(result.isOverflowing).toBe(true);
    expect(result.keptHtml.length).toBeGreaterThan(0);
    expect(result.overflowHtml.length).toBeGreaterThan(0);
    expect(result.overflowHtml).toContain('word');
  });

  it('merges overflow fragments onto the next page text', () => {
    const merged = mergeHtmlFragments('<div>Alpha</div>', '<div>Beta</div>');
    expect(merged).toContain('Alpha');
    expect(merged).toContain('Beta');
  });

  it('supports legacy measure option conversion', () => {
    const options = legacyPageMeasureOptions(340, 440, 'Georgia, serif', 12, 28);
    expect(options.contentWidthPx).toBe(284);
    expect(options.contentHeightPx).toBe(384);
  });
});
