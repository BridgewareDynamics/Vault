import { describe, expect, it } from 'vitest';
import {
  getThemeTextRoles,
  isLightTheme,
  isPastelPalette,
  toEdgeAppearanceTheme,
} from './themeSemantics';

describe('themeSemantics', () => {
  it('treats pastel as the light theme', () => {
    expect(isLightTheme('pastel')).toBe(true);
    expect(isLightTheme('brideware-purple')).toBe(false);
  });

  it('returns light heading colors for pastel', () => {
    const roles = getThemeTextRoles('pastel');
    expect(roles.heading).toContain('gray-900');
    expect(roles.body).toContain('gray-800');
  });

  it('returns light-on-dark heading colors for brideware-purple', () => {
    const roles = getThemeTextRoles('brideware-purple');
    expect(roles.heading).toBe('text-white');
    expect(roles.body).toContain('gray-100');
  });

  it('maps app themes to edge appearance palette keys', () => {
    expect(toEdgeAppearanceTheme('pastel')).toBe('pastel');
    expect(toEdgeAppearanceTheme('brideware-purple')).toBe('dark');
  });

  it('detects pastel for app and edge palette keys', () => {
    expect(isPastelPalette('pastel')).toBe(true);
    expect(isPastelPalette('dark')).toBe(false);
    expect(isPastelPalette('brideware-purple')).toBe(false);
  });
});
