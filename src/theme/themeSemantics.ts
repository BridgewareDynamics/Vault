import type { Theme } from '../types';

export type EdgeAppearanceTheme = 'pastel' | 'dark';

/** True when the active palette is the light (pastel) variant. */
export function isPastelPalette(theme: Theme | EdgeAppearanceTheme): boolean {
  return theme === 'pastel';
}

/** Light (pastel) vs dark (brideware-purple) app theme. */
export function isLightTheme(theme: Theme): boolean {
  return isPastelPalette(theme);
}

/** Map edge / block color APIs that use a pastel vs dark palette key. */
export function toEdgeAppearanceTheme(theme: Theme): EdgeAppearanceTheme {
  return isLightTheme(theme) ? 'pastel' : 'dark';
}

export interface ThemeTextRoles {
  /** Primary headings (h1–h3). */
  heading: string;
  /** Default readable body copy. */
  body: string;
  /** Secondary / de-emphasized copy. */
  muted: string;
  /** Accent labels and highlights. */
  primary: string;
}

export function getThemeTextRoles(theme: Theme): ThemeTextRoles {
  const light = isLightTheme(theme);
  return {
    heading: light ? 'text-gray-900' : 'text-white',
    body: light ? 'text-gray-800' : 'text-gray-100',
    muted: light ? 'text-gray-700' : 'text-gray-300',
    primary: light ? 'text-purple-700' : 'text-cyan-200',
  };
}
