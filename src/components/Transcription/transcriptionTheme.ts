import { Theme } from '../../types';
import { getModuleMenuTheme } from '../../theme/moduleMenuTheme';
import { getThemeTextRoles, isLightTheme } from '../../theme/themeSemantics';

/** Transcript module theme — shares menu tokens with Map via `moduleMenuTheme`. */
export function useTranscriptionTheme(theme: Theme) {
  const isPastel = isLightTheme(theme);
  const text = getThemeTextRoles(theme);
  const menu = getModuleMenuTheme(theme);

  return {
    isPastel,
    ...text,
    ...menu,
  };
}
