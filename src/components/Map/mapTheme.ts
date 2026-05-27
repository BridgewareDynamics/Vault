import { Theme } from '../../types';
import { getModuleMenuTheme } from '../../theme/moduleMenuTheme';
import { getThemeTextRoles, isLightTheme } from '../../theme/themeSemantics';

/** Map module theme — menu surfaces align with Transcript via `moduleMenuTheme`. */
export function useMapTheme(theme: Theme) {
  const isPastel = isLightTheme(theme);
  const text = getThemeTextRoles(theme);
  const menu = getModuleMenuTheme(theme);

  return {
    isPastel,
    ...text,
    ...menu,
    gridColor: isPastel ? 'rgba(216, 180, 254, 0.15)' : 'rgba(139, 92, 246, 0.12)',
    heroGlow: menu.heroGlowGradient,
    ambientGlowPrimary: menu.heroGlowPrimary,
    ambientGlowSecondary: menu.heroGlowSecondary,
  };
}
