import { describe, expect, it } from 'vitest';
import {
  buildSoftBorderGradient,
  extractGradientColors,
  softenRgba,
} from './extractGradientColors';

describe('extractGradientColors', () => {
  it('extracts rgba stops from a linear gradient', () => {
    const gradient =
      'linear-gradient(45deg, rgba(168, 85, 247, 0.95), rgba(236, 72, 153, 0.85), rgba(34, 211, 238, 0.95))';
    expect(extractGradientColors(gradient)).toEqual([
      'rgba(168, 85, 247, 0.95)',
      'rgba(236, 72, 153, 0.85)',
      'rgba(34, 211, 238, 0.95)',
    ]);
  });

  it('falls back when no rgba colors are found', () => {
    expect(extractGradientColors('linear-gradient(red, blue)')).toHaveLength(2);
  });
});

describe('softenRgba', () => {
  it('scales alpha channel', () => {
    expect(softenRgba('rgba(168, 85, 247, 0.95)', 0.5)).toBe('rgba(168, 85, 247, 0.475)');
  });
});

describe('buildSoftBorderGradient', () => {
  it('builds a softened multi-stop gradient', () => {
    const result = buildSoftBorderGradient([
      'rgba(168, 85, 247, 0.95)',
      'rgba(34, 211, 238, 0.95)',
    ]);
    expect(result).toContain('linear-gradient(135deg');
    expect(result).toContain('rgba(168, 85, 247');
  });
});
