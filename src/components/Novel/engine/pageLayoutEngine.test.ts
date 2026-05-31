import { describe, expect, it, vi } from 'vitest';
import { measureHtmlOverflow } from './pageLayoutEngine';

describe('pageLayoutEngine', () => {
  it('returns no overflow for short content', () => {
    const result = measureHtmlOverflow('<p>Hello world</p>', {
      width: 340,
      height: 440,
      fontFamily: 'Georgia, serif',
      fontSize: 12,
      padding: 28,
    });
    expect(result.isOverflowing).toBe(false);
    expect(result.overflowHtml).toBe('');
  });
});
