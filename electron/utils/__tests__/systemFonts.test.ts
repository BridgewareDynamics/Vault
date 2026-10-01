import { describe, expect, it } from 'vitest';
import { cleanWindowsRegistryFontName } from '../windowsFontNames';

describe('cleanWindowsRegistryFontName', () => {
  it('strips Windows registry type suffixes', () => {
    expect(cleanWindowsRegistryFontName('Arial (TrueType)')).toBe('Arial');
    expect(cleanWindowsRegistryFontName('Segoe UI Semibold (OpenType)')).toBe('Segoe UI Semibold');
  });

  it('ignores raw filename registry keys', () => {
    expect(cleanWindowsRegistryFontName('arial.ttf')).toBeNull();
    expect(cleanWindowsRegistryFontName('MyFont.otf')).toBeNull();
  });

  it('ignores empty and PS metadata names', () => {
    expect(cleanWindowsRegistryFontName('')).toBeNull();
    expect(cleanWindowsRegistryFontName('PSPath')).toBeNull();
  });
});
