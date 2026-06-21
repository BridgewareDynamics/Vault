import { motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import { Theme } from '../../types';
import { getOnboardingTheme } from './onboardingTheme';
import { THEME_PAGE } from './onboardingData';
import { OnboardingChip } from './OnboardingGlassCard';

interface ThemeSelectorProps {
  selectedTheme: Theme | null;
  onSelectTheme: (theme: Theme) => void;
  theme?: Theme;
}

export function ThemeSelector({ selectedTheme, onSelectTheme, theme = 'brideware-purple' }: ThemeSelectorProps) {
  const t = getOnboardingTheme(theme);

  const themes = THEME_PAGE.options.map((option) => ({
    ...option,
    value: option.id as Theme,
    colors:
      option.id === 'brideware-purple'
        ? { primary: '#c084fc', secondary: '#22d3ee', bg: 'from-gray-950 via-purple-950/50 to-gray-950' }
        : { primary: '#d8b4fe', secondary: '#a5b4fc', bg: 'from-slate-50 via-pink-50/30 to-slate-50' },
  }));

  return (
    <div
      className="grid h-full w-full min-h-0 grid-cols-1 gap-3"
      style={{ gridTemplateRows: '1fr 1fr' }}
    >
      {themes.map((themeOption, index) => {
        const isSelected = selectedTheme === themeOption.value;
        const isDarkCard = themeOption.value === 'brideware-purple';

        return (
          <motion.button
            key={themeOption.value}
            type="button"
            onClick={() => onSelectTheme(themeOption.value)}
            className="relative block h-full w-full min-h-0 text-left"
            style={{ width: '100%' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04 + index * 0.05 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="flex h-full w-full overflow-hidden rounded-2xl p-px"
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${t.sheenFrom}, ${t.sheenTo})`
                  : `linear-gradient(135deg, ${t.primaryRgba}0.25), ${t.secondaryRgba}0.18))`,
                boxShadow: isSelected ? t.glow : 'none',
              }}
            >
              <div
                className={`relative flex h-full w-full flex-col overflow-hidden rounded-[15px] bg-gradient-to-br ${
                  isDarkCard
                    ? 'from-gray-950/95 via-gray-900/92 to-slate-950/95'
                    : 'from-white/95 via-pink-50/90 to-slate-50/95'
                }`}
              >
                {isSelected && (
                  <motion.div
                    className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyber-purple-400 to-cyber-cyan-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  >
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  </motion.div>
                )}

                <div className="relative z-10 flex h-full min-h-0 w-full flex-col gap-2.5 p-4">
                  <div className="relative min-h-[5rem] w-full flex-1 overflow-hidden rounded-xl">
                    <div className={`absolute inset-0 bg-gradient-to-br ${themeOption.colors.bg}`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, ${themeOption.colors.primary}, ${themeOption.colors.secondary})`,
                          boxShadow: `0 0 24px ${themeOption.colors.primary}66`,
                        }}
                      >
                        <Palette className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <h3
                      className={`text-base font-bold leading-tight sm:text-lg ${
                        isDarkCard
                          ? 'bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent'
                          : 'text-gray-800'
                      }`}
                    >
                      {themeOption.name}
                    </h3>
                    <p
                      className={`mt-0.5 text-[11px] font-medium leading-snug sm:text-xs ${
                        isDarkCard ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {themeOption.summary}
                    </p>
                  </div>

                  <p
                    className={`shrink-0 text-[10px] leading-snug sm:text-[11px] ${
                      isDarkCard ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {themeOption.detail}
                  </p>

                  <p
                    className={`shrink-0 text-[10px] leading-snug sm:text-[11px] ${
                      isDarkCard ? 'text-gray-500' : 'text-gray-500'
                    }`}
                  >
                    <span className="font-semibold">Best for: </span>
                    {themeOption.bestFor}
                  </p>

                  <div className="mt-auto shrink-0 space-y-1.5 pt-1">
                    <div className="flex flex-wrap gap-1">
                      {themeOption.traits.map((trait) => (
                        <OnboardingChip key={trait} theme={theme}>
                          {trait}
                        </OnboardingChip>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {themeOption.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px] ${
                            isDarkCard
                              ? 'bg-cyber-purple-400/10 text-cyber-cyan-300'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                    <p
                      className={`text-[9px] leading-snug sm:text-[10px] ${
                        isDarkCard ? 'text-gray-500' : 'text-gray-500'
                      }`}
                    >
                      <span className={`font-semibold ${isDarkCard ? 'text-cyber-cyan-400' : 'text-purple-600'}`}>
                        Choose when:{' '}
                      </span>
                      {themeOption.chooseWhen}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
