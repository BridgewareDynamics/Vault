import { Theme } from '../../types';
import { getModuleMenuTheme } from '../../theme/moduleMenuTheme';
import { getThemeTextRoles, isLightTheme } from '../../theme/themeSemantics';

export function useNovelTheme(theme: Theme) {
  const isPastel = isLightTheme(theme);
  const text = getThemeTextRoles(theme);
  const menu = getModuleMenuTheme(theme);

  return {
    isPastel,
    ...text,
    ...menu,
    stageBackground: isPastel
      ? 'bg-gradient-to-br from-stone-100 via-amber-50/80 to-rose-50/60'
      : 'bg-gradient-to-br from-[#0c0a09] via-[#121018] to-[#0a0f14]',
    stageVignette: isPastel
      ? 'radial-gradient(ellipse at center, transparent 40%, rgba(120, 90, 60, 0.08) 100%)'
      : 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.45) 100%)',
    bookDeskShadow: isPastel ? 'rgba(80, 60, 40, 0.22)' : 'rgba(0, 0, 0, 0.55)',
    pagePaper: isPastel ? 'bg-[#f8f4ec] text-stone-900' : 'bg-[#1c1917] text-stone-100',
    pageBorder: isPastel ? 'border-stone-300/50' : 'border-amber-500/15',
    pageTexture: isPastel
      ? 'repeating-linear-gradient(0deg, rgba(0,0,0,0.015) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(0,0,0,0.01) 0 1px, transparent 1px 5px)'
      : 'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 4px)',
    pageDropShadow: isPastel
      ? '0 1px 0 rgba(255,255,255,0.8) inset, 0 8px 24px rgba(60, 45, 30, 0.12), 0 2px 6px rgba(60, 45, 30, 0.08)'
      : '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
    pageCastShadow: isPastel ? 'rgba(60, 45, 30, 0.25)' : 'rgba(0,0,0,0.5)',
    pageEdgeShadowLeft: isPastel
      ? 'linear-gradient(to left, rgba(0,0,0,0.06), transparent)'
      : 'linear-gradient(to left, rgba(0,0,0,0.35), transparent)',
    pageEdgeShadowRight: isPastel
      ? 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)'
      : 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)',
    coverSpineGradient: isPastel
      ? 'linear-gradient(to left, rgba(0,0,0,0.12), transparent)'
      : 'linear-gradient(to left, rgba(0,0,0,0.45), transparent)',
    pageNumber: isPastel ? 'text-stone-500/80' : 'text-stone-400/70',
    spineShadow: isPastel
      ? 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0.02) 35%, rgba(0,0,0,0.02) 65%, rgba(0,0,0,0.1))'
      : 'linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.5))',
    spineSurface: isPastel
      ? 'linear-gradient(180deg, rgba(255,255,255,0.5), rgba(0,0,0,0.04) 50%, rgba(255,255,255,0.3))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.35) 50%, rgba(255,255,255,0.04))',
    sizeBadge: isPastel
      ? 'border-amber-200/60 bg-white/70 text-stone-600'
      : 'border-amber-500/20 bg-white/5 text-stone-300',
    heroGlow: menu.heroGlowGradient,
  };
}
