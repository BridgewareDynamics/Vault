import { Theme } from '../../../types';
import { useTranscriptionTheme } from '../transcriptionTheme';

export function useTranscriptionWorkspaceUi(theme: Theme) {
  const t = useTranscriptionTheme(theme);

  const panel = `${t.panel} backdrop-blur-md`;

  const surface = t.insetSurface;

  const inset = t.isPastel ? 'bg-white/88' : 'bg-black/30';

  const input = `${t.titleInput} ${t.inputPlaceholder}`;

  const tabActive = `${t.button} shadow-md`;

  const tabIdle = t.isPastel
    ? 'border border-purple-200/50 bg-white/70 text-gray-600 hover:bg-white'
    : `${t.secondaryButton} border`;

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
