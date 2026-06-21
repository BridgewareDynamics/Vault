import { memo, type ReactNode } from 'react';
import { Theme } from '../../types';
import { getOnboardingTheme } from './onboardingTheme';

interface OnboardingPageShellProps {
  theme: Theme;
  children: ReactNode;
}

export const OnboardingPageShell = memo(function OnboardingPageShell({
  theme,
  children,
}: OnboardingPageShellProps) {
  const t = getOnboardingTheme(theme);

  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden px-3 py-2 sm:px-5 sm:py-3">
      {/* Content canvas — unified frosted stage so cards don't float on raw grid */}
      <div
        className={`relative flex h-full min-h-0 w-full max-w-6xl flex-col justify-center overflow-hidden rounded-2xl border ${t.border} backdrop-blur-md sm:rounded-3xl`}
        style={{
          background: t.isPastel
            ? 'linear-gradient(145deg, rgba(255,255,255,0.55), rgba(248,250,252,0.35))'
            : 'linear-gradient(145deg, rgba(15,15,20,0.55), rgba(30,20,45,0.28))',
          boxShadow: t.isPastel
            ? 'inset 0 1px 0 rgba(255,255,255,0.65), 0 0 40px rgba(216,180,254,0.12)'
            : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 48px rgba(139,92,246,0.14)',
        }}
      >
        {/* Inner vignette — masks background grid at edges */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: t.isPastel
              ? 'radial-gradient(ellipse 90% 85% at 50% 45%, transparent 40%, rgba(248,250,252,0.55) 100%)'
              : 'radial-gradient(ellipse 90% 85% at 50% 45%, transparent 35%, rgba(10,10,15,0.65) 100%)',
          }}
        />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative z-10 flex h-full min-h-0 flex-col overflow-y-auto p-3 sm:p-4">{children}</div>
      </div>
    </div>
  );
});
