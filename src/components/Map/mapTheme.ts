import { Theme } from '../../types';

export function useMapTheme(theme: Theme) {
  const isPastel = theme === 'pastel';
  return {
    isPastel,
    bg: isPastel
      ? 'bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50'
      : 'bg-gradient-to-br from-gray-950 via-purple-950/50 to-gray-950',
    card: isPastel
      ? 'bg-white/80 border-pink-200/40 text-gray-800'
      : 'bg-gray-900/90 border-cyber-purple-500/50 text-white',
    cardHover: isPastel
      ? 'hover:border-purple-300/60'
      : 'hover:border-cyber-cyan-400/60',
    primary: isPastel ? 'text-purple-500' : 'text-cyber-cyan-400',
    button: isPastel
      ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
      : 'bg-gradient-to-r from-cyber-purple-600 to-cyber-cyan-600 text-white',
    gridColor: isPastel ? 'rgba(216, 180, 254, 0.15)' : 'rgba(139, 92, 246, 0.12)',
    muted: isPastel ? 'text-gray-500' : 'text-gray-400',
  };
}
