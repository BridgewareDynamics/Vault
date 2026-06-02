import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';

export interface OnboardingThemeTokens {
  isPastel: boolean;
  primaryRgba: string;
  secondaryRgba: string;
  cardBg: string;
  cardSurface: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  sheenFrom: string;
  sheenTo: string;
  glow: string;
}

export function getOnboardingTheme(theme: Theme): OnboardingThemeTokens {
  const isPastel = isLightTheme(theme);
  return {
    isPastel,
    primaryRgba: isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ',
    secondaryRgba: isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ',
    cardBg: isPastel
      ? 'from-slate-100/95 via-white/90 to-pink-50/90'
      : 'from-gray-950/95 via-gray-900/92 to-slate-950/95',
    cardSurface: isPastel ? 'bg-white/88' : 'bg-gray-950/82',
    border: isPastel ? 'border-purple-200/35' : 'border-white/10',
    borderStrong: isPastel ? 'border-purple-300/45' : 'border-cyber-purple-400/25',
    text: isPastel ? 'text-gray-800' : 'text-gray-100',
    textMuted: isPastel ? 'text-gray-600' : 'text-gray-400',
    sheenFrom: isPastel ? 'rgba(216, 180, 254, 0.22)' : 'rgba(139, 92, 246, 0.28)',
    sheenTo: isPastel ? 'rgba(165, 180, 252, 0.18)' : 'rgba(34, 211, 238, 0.22)',
    glow: isPastel ? '0 0 24px rgba(216, 180, 254, 0.22)' : '0 0 28px rgba(139, 92, 246, 0.28)',
  };
}

export type OnboardingAccent = 'purple' | 'cyan' | 'emerald' | 'amber';

export function getAccentGradients(theme: Theme, accent: OnboardingAccent) {
  const isPastel = isLightTheme(theme);
  const map = {
    purple: { solid: 'from-purple-600 to-cyan-600', pastel: 'from-purple-300 to-pink-300' },
    cyan: { solid: 'from-cyan-500 to-blue-600', pastel: 'from-cyan-200 to-blue-200' },
    emerald: { solid: 'from-emerald-500 to-teal-500', pastel: 'from-emerald-200 to-teal-200' },
    amber: { solid: 'from-amber-500 to-rose-500', pastel: 'from-amber-200 to-rose-200' },
  } as const;
  return isPastel ? map[accent].pastel : map[accent].solid;
}
