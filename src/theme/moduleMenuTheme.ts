import type { Theme } from '../types';
import { isLightTheme } from './themeSemantics';

/**
 * Shared landing / library / toolbar menu styling for Vault modules (Map, Transcript, etc.).
 * Pastel and dark palettes use high-contrast text on opaque panels (sectionLabel, body, mutedText).
 */
export const moduleMenuPastel = {
  bg: 'bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50',
  card: 'bg-white/80 border-pink-200/40 text-gray-800',
  cardHover: 'hover:border-purple-300/60',
  button: 'bg-gradient-to-r from-purple-400 to-pink-400 text-white',
  panel:
    'border-purple-200/40 bg-white/90 text-gray-900 shadow-[0_24px_80px_rgba(216,180,254,0.18)]',
  panelGradient: 'from-white/60 via-transparent to-purple-100/40',
  sectionLabel: 'font-semibold text-purple-800',
  mutedText: 'text-gray-700',
  secondaryButton:
    'border-purple-200/60 bg-white/80 text-gray-700 hover:border-purple-300 hover:bg-white',
  insetSurface: 'border-purple-200/35 bg-white/92 text-gray-900',
  softInsetSurface: 'border-purple-200/30 bg-white/88 text-gray-800',
  compactInsetSurface: 'border-purple-200/28 bg-white/90 text-gray-800',
  heroGlowPrimary: 'bg-fuchsia-200/50',
  heroGlowSecondary: 'bg-cyan-200/45',
  heroGlowGradient: 'from-fuchsia-200/50 via-purple-200/30 to-cyan-200/40',
  headerBorder: 'border-white/10',
  callout: 'border-purple-200/50 bg-purple-50/80',
  calloutLabel: 'text-purple-700',
  featurePill: 'border-purple-200/60 bg-purple-50/80 text-purple-700',
  eyebrowBadge: 'border-purple-200/60 bg-white/70 text-purple-600',
  highlightRow: 'bg-white/90 text-gray-800',
  highlightDot: 'bg-purple-400',
  cardHoverOverlay:
    'bg-gradient-to-br from-white/40 via-purple-100/30 to-cyan-100/30',
  heroHeading: 'text-gray-900',
  titleInput:
    'border-purple-200/60 bg-white text-gray-800 focus:border-purple-300 focus:ring-2 focus:ring-purple-200/60',
  editorHeader: 'border-white/10 bg-white/70 backdrop-blur-xl',
  inputPlaceholder: 'placeholder:text-gray-400',
  dangerIconBtn: 'bg-red-50 text-red-500 hover:bg-red-100',
  statBox: 'bg-white/85',
  metaBox: 'bg-white/82',
  badgeCase: 'border-emerald-200/60 bg-emerald-50/90 text-emerald-700',
  badgeVault: 'border-cyan-200/60 bg-cyan-50/90 text-cyan-700',
  badgeNeutral: 'border-purple-200/60 bg-white/80 text-gray-700',
  dialogShell: 'border-purple-200/60 bg-gradient-to-br from-white to-pink-50/80',
  dialogShellLarge:
    'border-pink-200/60 bg-gradient-to-br from-white via-pink-50/90 to-slate-50',
  dialogHeader: 'border-pink-200/40',
  dialogHeaderTint: 'border-pink-200/30 bg-pink-50/30',
  dialogFooter: 'border-pink-200/40 bg-pink-50/30',
  dialogInset: 'border-purple-200/50 bg-white/80',
  dialogIconBox: 'border-pink-200/50 bg-white text-purple-500',
  dialogCancel: 'border-purple-200/60 bg-white text-gray-700',
  dialogSecondaryAction:
    'border-purple-200/60 bg-white text-gray-700 hover:border-purple-300',
  dialogClearAction: 'border-pink-200/60 text-gray-600 hover:bg-pink-50',
  dialogPreviewPanel:
    'border-pink-200/40 bg-gradient-to-br from-pink-50/80 via-white to-purple-50/70',
  promptIdle:
    'border-purple-200/50 bg-white/82 text-gray-800 hover:border-purple-300 hover:bg-white',
  toolbar: {
    shell: 'bg-white/88 border-pink-200/50 text-gray-800 shadow-2xl',
    header: 'border-pink-200/30 bg-pink-50/60',
    section: 'border-purple-200/50 bg-white/75',
    accentBox: 'border-purple-200/60 bg-purple-50/90 text-gray-800',
    iconBtn:
      'border-purple-200/60 bg-white/90 text-purple-600 hover:bg-purple-50',
    studioShell: 'border-purple-200/60 bg-white/88',
    studioHeader: 'border-purple-200/50 bg-pink-50/70 text-gray-800',
    closeBtn: 'border-purple-200/60 bg-white/90 text-gray-600 hover:bg-white',
    selected: 'border-purple-400 bg-purple-50/90 text-gray-900 font-semibold',
    unselected:
      'border-purple-200/60 bg-white/85 text-gray-700 hover:bg-white',
    toolBtnHover: 'hover:bg-white hover:border-purple-300/70',
  },
} as const;

export const moduleMenuDark = {
  bg: 'bg-gradient-to-br from-gray-950 via-purple-950/50 to-gray-950',
  card: 'bg-gray-900/90 border-cyber-purple-500/50 text-white',
  cardHover: 'hover:border-cyber-cyan-400/60',
  button: 'bg-gradient-to-r from-cyber-purple-600 to-cyber-cyan-600 text-white',
  /** Matches Transcript landing / library panels */
  panel:
    'border-cyber-purple-500/25 bg-gray-950/90 text-white shadow-[0_24px_80px_rgba(15,23,42,0.65)]',
  panelGradient: 'from-cyber-purple-500/10 via-transparent to-cyber-cyan-500/10',
  sectionLabel: 'font-semibold text-cyan-200',
  mutedText: 'text-gray-200',
  secondaryButton:
    'border-white/10 bg-white/5 text-gray-200 hover:border-cyber-cyan-400/50 hover:bg-white/10',
  insetSurface: 'border-white/10 bg-gray-900/75 text-gray-100',
  softInsetSurface: 'border-white/10 bg-gray-900/60 text-gray-100',
  compactInsetSurface: 'border-white/10 bg-gray-900/65 text-gray-100',
  heroGlowPrimary: 'bg-cyber-purple-500/20',
  heroGlowSecondary: 'bg-cyber-cyan-500/15',
  heroGlowGradient:
    'from-cyber-purple-500/25 via-fuchsia-500/10 to-cyber-cyan-500/20',
  headerBorder: 'border-white/10',
  callout: 'border-cyber-cyan-400/20 bg-cyber-cyan-500/10',
  calloutLabel: 'text-cyber-cyan-300',
  featurePill: 'border-cyber-cyan-400/25 bg-cyber-cyan-500/10 text-cyber-cyan-300',
  eyebrowBadge: 'border-cyber-cyan-400/20 bg-black/20 text-cyber-cyan-300',
  highlightRow: 'bg-black/40 text-gray-100',
  highlightDot: 'bg-cyber-cyan-400',
  cardHoverOverlay:
    'bg-gradient-to-br from-cyber-purple-500/10 via-transparent to-cyber-cyan-500/10',
  heroHeading: 'text-white',
  titleInput:
    'border-white/10 bg-black/20 text-white focus:border-cyber-cyan-400/50 focus:ring-2 focus:ring-cyber-cyan-400/20',
  editorHeader: 'border-white/10 bg-black/25 backdrop-blur-xl',
  inputPlaceholder: 'placeholder:text-gray-500',
  dangerIconBtn: 'bg-red-500/10 text-red-300 hover:bg-red-500/20',
  statBox: 'bg-black/25',
  metaBox: 'bg-black/20',
  badgeCase: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
  badgeVault: 'border-cyber-cyan-400/25 bg-cyber-cyan-500/10 text-cyber-cyan-300',
  badgeNeutral: 'border-white/10 bg-black/20 text-gray-200',
  dialogShell:
    'border-cyber-purple-500/40 bg-gradient-to-br from-gray-900 to-gray-950',
  dialogShellLarge:
    'border-cyber-purple-500/40 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-950',
  dialogHeader: 'border-white/10',
  dialogHeaderTint: 'border-white/10 bg-black/20',
  dialogFooter: 'border-white/10 bg-black/20',
  dialogInset: 'border-white/10 bg-black/20',
  dialogIconBox:
    'border-cyber-purple-500/30 bg-cyber-purple-500/10 text-cyber-cyan-400',
  dialogCancel: 'border-white/10 bg-white/5 text-gray-200',
  dialogSecondaryAction:
    'border-white/10 bg-white/5 text-gray-200 hover:border-cyber-cyan-400/40',
  dialogClearAction: 'border-white/10 text-gray-400 hover:bg-white/10',
  dialogPreviewPanel:
    'border-cyber-purple-500/25 bg-gradient-to-br from-cyber-purple-500/10 via-black/20 to-cyber-cyan-500/10',
  promptIdle:
    'border-white/10 bg-white/5 text-gray-200 hover:border-cyber-cyan-400/40 hover:bg-white/10',
  toolbar: {
    shell:
      'bg-gray-900/88 border-cyber-purple-500/40 text-white shadow-[0_20px_60px_rgba(15,23,42,0.55)]',
    header: 'border-white/10 bg-black/30',
    section: 'border-white/10 bg-black/20',
    accentBox: 'border-white/10 bg-black/25 text-cyber-cyan-300',
    iconBtn:
      'border-white/10 bg-black/25 text-cyber-cyan-300 hover:bg-white/10',
    studioShell: 'border-cyber-purple-500/35 bg-gray-950/88',
    studioHeader: 'border-white/10 bg-black/25 text-white',
    closeBtn: 'border-white/10 bg-black/25 text-gray-300 hover:bg-white/10',
    selected: 'border-cyber-cyan-400/60 bg-cyber-cyan-500/10 text-white',
    unselected: 'border-white/10 bg-white/5 text-gray-200 hover:border-cyber-cyan-400/40 hover:bg-white/10',
    toolBtnHover: 'hover:border-cyber-cyan-400/50 hover:bg-white/10',
  },
} as const;

export type ModuleMenuThemeTokens = typeof moduleMenuPastel | typeof moduleMenuDark;

export function getModuleMenuTheme(theme: Theme): ModuleMenuThemeTokens {
  return isLightTheme(theme) ? moduleMenuPastel : moduleMenuDark;
}
