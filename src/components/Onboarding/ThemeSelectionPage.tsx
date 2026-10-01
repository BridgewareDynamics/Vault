import { motion } from 'framer-motion';
import { memo } from 'react';
import { Palette } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { CircularCheckbox } from './CircularCheckbox';
import { Theme } from '../../types';
import { OnboardingPageShell } from './OnboardingPageShell';
import {
  OnboardingCardDetail,
  OnboardingGlassCard,
  OnboardingIconBadge,
} from './OnboardingGlassCard';
import { getOnboardingTheme } from './onboardingTheme';
import { THEME_PAGE } from './onboardingData';

interface ThemeSelectionPageProps {
  selectedTheme: Theme | null;
  onSelectTheme: (theme: Theme) => void;
  dontShowAgain: boolean;
  onToggleDontShowAgain: (checked: boolean) => void;
  theme?: Theme;
}

export const ThemeSelectionPage = memo(function ThemeSelectionPage({
  selectedTheme,
  onSelectTheme,
  dontShowAgain,
  onToggleDontShowAgain,
  theme = 'brideware-purple',
}: ThemeSelectionPageProps) {
  const t = getOnboardingTheme(theme);

  return (
    <OnboardingPageShell theme={theme}>
      <div className="grid h-full min-h-0 grid-cols-1 gap-2.5 lg:grid-cols-[1fr_1.12fr] lg:items-stretch lg:gap-4 lg:h-full">
        {/* Left — why themes matter */}
        <OnboardingGlassCard theme={theme} padding="sm" hoverLift={false} className="min-h-0 lg:h-full">
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
            <div className="flex shrink-0 items-start gap-3">
              <OnboardingIconBadge theme={theme} accent="purple">
                <Palette className="h-5 w-5 text-white" />
              </OnboardingIconBadge>
              <div className="min-w-0">
                <h2
                  className={`text-xl font-bold leading-tight sm:text-2xl ${
                    t.isPastel
                      ? t.text
                      : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent'
                  }`}
                >
                  {THEME_PAGE.headline}
                </h2>
                <p
                  className={`mt-0.5 text-[11px] font-medium sm:text-xs ${
                    t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                  }`}
                >
                  {THEME_PAGE.tagline}
                </p>
              </div>
            </div>

            <OnboardingCardDetail theme={theme} className="shrink-0">
              {THEME_PAGE.description}
            </OnboardingCardDetail>

            <div className="shrink-0 space-y-2">
              <p
                className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
                  t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                }`}
              >
                {THEME_PAGE.principlesTitle}
              </p>
              <div className="space-y-1.5">
                {THEME_PAGE.principles.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl border px-2.5 py-2 ${t.border} ${
                      t.isPastel ? 'bg-white/70' : 'bg-white/[0.03]'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className={`mt-0.5 text-[10px] leading-snug ${t.textMuted}`}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 space-y-2 border-t border-white/10 pt-3">
              <p
                className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
                  t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                }`}
              >
                {THEME_PAGE.guidanceTitle}
              </p>
              <div className="space-y-1.5">
                {THEME_PAGE.guidance.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl border px-2.5 py-2 ${t.border} ${
                      t.isPastel ? 'bg-purple-50/80' : 'bg-cyber-purple-400/[0.04]'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                        t.isPastel ? 'text-purple-800' : 'text-purple-200'
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className={`mt-0.5 text-[10px] leading-snug ${t.textMuted}`}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto shrink-0 space-y-2 border-t border-white/10 pt-3">
              <CircularCheckbox
                checked={dontShowAgain}
                onChange={onToggleDontShowAgain}
                label={THEME_PAGE.dontShowLabel}
                theme={theme}
              />
              {selectedTheme && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-[11px] font-semibold sm:text-xs ${
                    t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                  }`}
                  style={{ textShadow: `0 0 12px ${t.secondaryRgba}0.45)` }}
                >
                  ✓ {THEME_PAGE.readyMessage}
                </motion.p>
              )}
            </div>
          </div>
        </OnboardingGlassCard>

        {/* Right — two full-width theme cards stacked, each ~50% height */}
        <div className="flex min-h-[22rem] flex-col gap-2 sm:min-h-[24rem] lg:h-full lg:min-h-0">
          <p
            className={`shrink-0 text-center text-[9px] font-semibold uppercase tracking-[0.2em] lg:text-left ${
              t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
            }`}
          >
            {THEME_PAGE.selectorTitle}
          </p>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            className="min-h-0 w-full flex-1"
          >
            <ThemeSelector selectedTheme={selectedTheme} onSelectTheme={onSelectTheme} theme={theme} />
          </motion.div>
        </div>
      </div>
    </OnboardingPageShell>
  );
});
