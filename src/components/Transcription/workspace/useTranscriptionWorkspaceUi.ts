import { Theme } from '../../../types';
import { useTranscriptionTheme } from '../transcriptionTheme';

export function useTranscriptionWorkspaceUi(theme: Theme) {
  const t = useTranscriptionTheme(theme);

  const panel = t.isPastel
    ? 'border-purple-200/40 bg-white/75 text-gray-800 shadow-[0_20px_60px_rgba(216,180,254,0.14)] backdrop-blur-md'
    : 'border-cyber-purple-500/25 bg-gray-950/70 text-white shadow-[0_20px_60px_rgba(15,23,42,0.55)] backdrop-blur-md';

  const surface = t.isPastel
    ? 'border-purple-200/35 bg-white/80'
    : 'border-white/10 bg-black/25';

  const inset = t.isPastel ? 'bg-white/88' : 'bg-black/30';

  const input = t.isPastel
    ? 'border-purple-200/60 bg-white text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/60'
    : 'border-white/10 bg-black/30 text-white placeholder:text-gray-500 focus:border-cyber-cyan-400/50 focus:ring-2 focus:ring-cyber-cyan-400/20';

  const tabActive = t.isPastel
    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
    : 'bg-gradient-to-r from-cyber-purple-600 to-cyber-cyan-600 text-white shadow-md';

  const tabIdle = t.isPastel
    ? 'border border-purple-200/50 bg-white/70 text-gray-600 hover:bg-white'
    : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10';

  return {
    t,
    panel,
    surface,
    inset,
    input,
    tabActive,
    tabIdle,
    checkbox: t.isPastel ? 'accent-purple-500' : 'accent-cyber-cyan-400',
  };
}

export type TranscriptionWorkspaceUi = ReturnType<typeof useTranscriptionWorkspaceUi>;
