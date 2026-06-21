import { Theme } from '../../types';
import { getModuleMenuTheme } from '../../theme/moduleMenuTheme';
import { getThemeTextRoles, isLightTheme } from '../../theme/themeSemantics';

/** File Converter module theme — shares menu tokens with Map and Transcript. */
export function useFileConverterTheme(theme: Theme) {
  const isPastel = isLightTheme(theme);
  const text = getThemeTextRoles(theme);
  const menu = getModuleMenuTheme(theme);

  return {
    isPastel,
    ...text,
    ...menu,
    dropZone: isPastel
      ? 'border-dashed border-purple-300/55 bg-white/70 hover:border-purple-400/70 hover:bg-white/90'
      : 'border-dashed border-cyber-cyan-400/30 bg-black/25 hover:border-cyber-cyan-400/50 hover:bg-black/35',
    dropZoneActive: isPastel
      ? 'border-purple-400 bg-purple-50/90'
      : 'border-cyber-cyan-400/60 bg-cyber-cyan-500/10',
    progressTrack: isPastel ? 'bg-purple-100/80' : 'bg-black/40',
  };
}
