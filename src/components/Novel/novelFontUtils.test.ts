import { describe, expect, it } from 'vitest';
import {
  formatFontFamilyCss,
  getFontDisplayLabel,
  normalizeFontKey,
} from './novelFontUtils';

describe('novelFontUtils', () => {
  it('formats plain system font names for CSS', () => {
    expect(formatFontFamilyCss('Segoe UI')).toBe('"Segoe UI", sans-serif');
    expect(formatFontFamilyCss('Georgia')).toBe('Georgia, sans-serif');
  });

  it('preserves preset stacks', () => {
    expect(formatFontFamilyCss('Georgia, serif')).toBe('Georgia, serif');
  });

  it('derives display labels', () => {
    expect(getFontDisplayLabel('Georgia, serif')).toBe('Georgia');
    expect(getFontDisplayLabel('Segoe UI')).toBe('Segoe UI');
  });

  it('normalizes font keys for selection matching', () => {
    expect(normalizeFontKey('"Segoe UI", sans-serif')).toBe('segoe ui');
    expect(normalizeFontKey('Georgia, serif')).toBe('georgia');
  });
});
