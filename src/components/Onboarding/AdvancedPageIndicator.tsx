import { motion } from 'framer-motion';
import { Theme } from '../../types';
import { getOnboardingTheme } from './onboardingTheme';
import { ONBOARDING_PAGES } from './onboardingPages';

interface AdvancedPageIndicatorProps {
  currentPage: number;
  totalPages: number;
  theme?: Theme;
  onPageSelect?: (page: number) => void;
}

export function AdvancedPageIndicator({
  currentPage,
  totalPages,
  theme = 'brideware-purple',
  onPageSelect,
}: AdvancedPageIndicatorProps) {
  const t = getOnboardingTheme(theme);
  const progress = ((currentPage + 1) / totalPages) * 100;

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-1.5 px-1">
      <div className="relative w-full max-w-xl">
        <div
          className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2"
          style={{
            background: t.isPastel
              ? 'linear-gradient(90deg, rgba(216,180,254,0.12), rgba(165,180,252,0.28), rgba(216,180,254,0.12))'
              : 'linear-gradient(90deg, rgba(139,92,246,0.1), rgba(34,211,238,0.28), rgba(139,92,246,0.1))',
          }}
        />
        <div className="relative flex items-center justify-between">
          {Array.from({ length: totalPages }, (_, i) => {
            const meta = ONBOARDING_PAGES[i];
            const Icon = meta?.icon;
            const isActive = i === currentPage;
            const isComplete = i < currentPage;

            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => onPageSelect?.(i)}
                disabled={!onPageSelect}
                className={`group relative flex flex-1 flex-col items-center gap-1 outline-none ${
                  onPageSelect ? 'cursor-pointer' : 'cursor-default'
                }`}
                whileHover={onPageSelect ? { y: -1 } : undefined}
                whileTap={onPageSelect ? { scale: 0.97 } : undefined}
                aria-label={`Go to ${meta?.title ?? `page ${i + 1}`}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div
                  className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border sm:h-9 sm:w-9 ${
                    isActive
                      ? t.isPastel
                        ? 'border-purple-400/55 bg-white/92'
                        : 'border-cyber-purple-400/45 bg-gray-950/88'
                      : isComplete
                        ? t.isPastel
                          ? 'border-purple-300/40 bg-purple-50/85'
                          : 'border-cyber-purple-400/28 bg-gray-950/65'
                        : t.isPastel
                          ? 'border-purple-200/30 bg-white/65'
                          : 'border-white/10 bg-gray-950/45'
                  }`}
                  style={{
                    boxShadow: isActive
                      ? `0 0 16px ${t.primaryRgba}0.45), inset 0 1px 0 rgba(255,255,255,${t.isPastel ? '0.55' : '0.1'})`
                      : isComplete
                        ? `0 0 8px ${t.primaryRgba}0.2)`
                        : undefined,
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                  {Icon && (
                    <Icon
                      className={`relative z-10 h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                        isActive
                          ? t.isPastel
                            ? 'text-purple-600'
                            : 'text-cyber-cyan-300'
                          : isComplete
                            ? t.isPastel
                              ? 'text-purple-500'
                              : 'text-cyber-purple-300'
                            : t.isPastel
                              ? 'text-gray-400'
                              : 'text-gray-500'
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`hidden lg:block text-[9px] font-semibold uppercase tracking-[0.14em] ${
                    isActive ? (t.isPastel ? 'text-purple-700' : 'text-white') : t.textMuted
                  }`}
                >
                  {meta?.title}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div
        className="relative h-1 w-full max-w-xs overflow-hidden rounded-full"
        style={{ background: `${t.primaryRgba}0.14)` }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${t.primaryRgba}0.95), ${t.secondaryRgba}0.95))`,
            boxShadow: `0 0 10px ${t.primaryRgba}0.55)`,
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}
