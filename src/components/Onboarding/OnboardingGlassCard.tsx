import { motion } from 'framer-motion';
import { memo, type ReactNode } from 'react';
import { Theme } from '../../types';
import { AmbientLavaGlow } from '../Shared/AmbientLavaFrame';
import { getAccentGradients, getOnboardingTheme, type OnboardingAccent } from './onboardingTheme';

interface OnboardingGlassCardProps {
  theme: Theme;
  children: ReactNode;
  className?: string;
  hoverLift?: boolean;
  padding?: 'sm' | 'md';
}

export const OnboardingGlassCard = memo(function OnboardingGlassCard({
  theme,
  children,
  className = '',
  hoverLift = true,
  padding = 'md',
}: OnboardingGlassCardProps) {
  const t = getOnboardingTheme(theme);
  const pad = padding === 'sm' ? 'p-2.5 sm:p-3' : 'p-3 sm:p-3.5';

  return (
    <motion.div
      className={`group relative h-full ${className}`}
      whileHover={hoverLift ? { y: -2, scale: 1.008 } : undefined}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        className="relative h-full overflow-hidden rounded-2xl p-px"
        style={{
          background: `linear-gradient(135deg, ${t.sheenFrom}, ${t.sheenTo}, ${t.sheenFrom})`,
          boxShadow: t.glow,
        }}
      >
        <div
          className={`relative h-full overflow-hidden rounded-[15px] bg-gradient-to-br ${t.cardBg} backdrop-blur-xl ${pad}`}
          style={{ isolation: 'isolate' }}
        >
          <AmbientLavaGlow colors={[t.sheenFrom, t.sheenTo]} borderRadiusClass="rounded-[15px]" />
          <div
            className={`pointer-events-none absolute inset-0 rounded-[15px] ${t.cardSurface}`}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="relative z-10 h-full">{children}</div>
        </div>
      </div>
    </motion.div>
  );
});

interface OnboardingIconBadgeProps {
  theme: Theme;
  accent?: OnboardingAccent;
  children: ReactNode;
  size?: 'sm' | 'md';
}

export const OnboardingIconBadge = memo(function OnboardingIconBadge({
  theme,
  accent = 'purple',
  children,
  size = 'md',
}: OnboardingIconBadgeProps) {
  const t = getOnboardingTheme(theme);
  const gradient = getAccentGradients(theme, accent);
  const dim = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-9 w-9 rounded-xl';

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden ${dim} bg-gradient-to-br ${gradient} border ${t.border}`}
      style={{
        boxShadow: t.isPastel
          ? '0 0 16px rgba(216, 180, 254, 0.35), inset 0 1px 0 rgba(255,255,255,0.45)'
          : '0 0 18px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
});

export function OnboardingNewBadge({ theme }: { theme: Theme }) {
  const t = getOnboardingTheme(theme);
  return (
    <span
      className={`absolute right-2 top-2 z-20 rounded-full px-1.5 py-px text-[8px] font-bold uppercase tracking-wider ${
        t.isPastel
          ? 'border border-amber-300/50 bg-amber-100 text-amber-700'
          : 'border border-amber-400/30 bg-amber-400/15 text-amber-300'
      }`}
    >
      New
    </span>
  );
}

export function OnboardingGradientTitle({
  theme,
  children,
  className = '',
}: {
  theme: Theme;
  children: ReactNode;
  className?: string;
}) {
  const t = getOnboardingTheme(theme);
  if (t.isPastel) {
    return <span className={`font-bold ${t.text} ${className}`}>{children}</span>;
  }
  return (
    <span
      className={`bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text font-bold text-transparent ${className}`}
    >
      {children}
    </span>
  );
}

export function OnboardingChip({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}) {
  const t = getOnboardingTheme(theme);
  return (
    <span
      className={`rounded-full border px-1.5 py-px text-[9px] font-medium ${
        t.isPastel
          ? 'border-purple-200/50 bg-white/85 text-purple-700'
          : 'border-cyber-purple-400/20 bg-white/5 text-cyber-cyan-300'
      }`}
    >
      {children}
    </span>
  );
}

export function OnboardingPageLead({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}) {
  const t = getOnboardingTheme(theme);
  return <p className={`text-center text-[11px] leading-relaxed sm:text-xs ${t.textMuted}`}>{children}</p>;
}

export function OnboardingCardSummary({
  theme,
  children,
  className = '',
}: {
  theme: Theme;
  children: ReactNode;
  className?: string;
}) {
  const t = getOnboardingTheme(theme);
  return <p className={`text-[10px] font-medium leading-snug sm:text-[11px] ${t.text} ${className}`}>{children}</p>;
}

export function OnboardingCardDetail({
  theme,
  children,
  className = '',
}: {
  theme: Theme;
  children: ReactNode;
  className?: string;
}) {
  const t = getOnboardingTheme(theme);
  return (
    <p className={`text-[10px] leading-relaxed sm:text-[11px] ${t.textMuted} ${className}`}>{children}</p>
  );
}

interface OnboardingRichCardProps {
  theme: Theme;
  icon: ReactNode;
  title: string;
  summary: string;
  detail: string;
  highlights: string[];
  accent?: OnboardingAccent;
  isNew?: boolean;
  padding?: 'sm' | 'md';
  footer?: ReactNode;
  feedsInto?: string;
  tools?: string[];
  outcome?: string;
}

export function OnboardingRichCard({
  theme,
  icon,
  title,
  summary,
  detail,
  highlights,
  accent = 'purple',
  isNew,
  padding = 'sm',
  footer,
  feedsInto,
  tools,
  outcome,
}: OnboardingRichCardProps) {
  const t = getOnboardingTheme(theme);

  return (
    <OnboardingGlassCard theme={theme} padding={padding} className="h-full">
      {isNew && <OnboardingNewBadge theme={theme} />}
      <div className="flex h-full min-h-0 flex-col gap-1.5">
        <div className="flex shrink-0 items-start gap-2">
          <OnboardingIconBadge theme={theme} accent={accent} size="sm">
            {icon}
          </OnboardingIconBadge>
          <div className="min-w-0 flex-1">
            <OnboardingGradientTitle theme={theme} className="text-xs leading-tight sm:text-sm">
              {title}
            </OnboardingGradientTitle>
            <OnboardingCardSummary theme={theme} className="mt-0.5">
              {summary}
            </OnboardingCardSummary>
          </div>
        </div>
        <OnboardingCardDetail theme={theme} className="shrink-0">
          {detail}
        </OnboardingCardDetail>
        <div className="mt-auto shrink-0 space-y-1.5 pt-1">
          <div className="flex flex-wrap gap-1">
            {highlights.map((item) => (
              <OnboardingChip key={item} theme={theme}>
                {item}
              </OnboardingChip>
            ))}
          </div>
          {tools && tools.length > 0 && (
            <div className="flex flex-wrap gap-1 border-t border-white/10 pt-1.5">
              {tools.map((tool) => (
                <span
                  key={tool}
                  className={`rounded-md px-1.5 py-px text-[9px] font-medium ${
                    t.isPastel
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-cyber-purple-400/10 text-cyber-cyan-300'
                  }`}
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
          {outcome && (
            <p className={`text-[9px] leading-snug ${t.textMuted}`}>
              <span className={`font-semibold ${t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'}`}>
                You&apos;ll have:{' '}
              </span>
              {outcome}
            </p>
          )}
          {feedsInto && (
            <p className={`text-[9px] leading-snug ${t.textMuted}`}>
              <span className={`font-semibold ${t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'}`}>
                {outcome ? 'Then: ' : 'Feeds into: '}
              </span>
              {feedsInto}
            </p>
          )}
        </div>
        {footer}
      </div>
    </OnboardingGlassCard>
  );
}
