import { Theme } from '../../types';
import { getThemeTextRoles, isLightTheme } from '../../theme/themeSemantics';

export function useTranscriptionTheme(theme: Theme) {
  const isPastel = isLightTheme(theme);
  const text = getThemeTextRoles(theme);

  return {
    isPastel,
    ...text,
    bg: isPastel
      ? 'bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50'
      : 'bg-gradient-to-br from-gray-950 via-purple-950/50 to-gray-950',
    card: isPastel
      ? 'bg-white/80 border-pink-200/40 text-gray-800'
      : 'bg-gray-900/90 border-cyber-purple-500/50 text-white',
    button: isPastel
      ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
      : 'bg-gradient-to-r from-cyber-purple-600 to-cyber-cyan-600 text-white',
  };
}
