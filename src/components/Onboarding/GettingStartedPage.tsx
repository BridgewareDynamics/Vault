import { motion } from 'framer-motion';
import { memo } from 'react';
import {
  FileText,
  FolderOpen,
  Shield,
  Map as MapIcon,
  RefreshCw,
  BookOpen,
  Rocket,
  Link2,
} from 'lucide-react';
import { Theme } from '../../types';
import { OnboardingPageShell } from './OnboardingPageShell';
import {
  OnboardingCardDetail,
  OnboardingChip,
  OnboardingGlassCard,
  OnboardingIconBadge,
  OnboardingRichCard,
} from './OnboardingGlassCard';
import { getOnboardingTheme } from './onboardingTheme';
import { GETTING_STARTED_PAGE, GETTING_STARTED_STEPS } from './onboardingData';

interface GettingStartedPageProps {
  theme?: Theme;
}

const stepIcons = {
  'step-extract': FileText,
  'step-convert': RefreshCw,
  'step-archive': FolderOpen,
  'step-map': MapIcon,
  'step-novel': BookOpen,
  'step-audit': Shield,
} as const;

export const GettingStartedPage = memo(function GettingStartedPage({
  theme = 'brideware-purple',
}: GettingStartedPageProps) {
  const t = getOnboardingTheme(theme);

  return (
    <OnboardingPageShell theme={theme}>
      <div className="grid h-full min-h-0 grid-cols-1 gap-2.5 lg:grid-cols-[1fr_1.12fr] lg:items-stretch lg:gap-4">
        {/* Left — first session guide */}
        <OnboardingGlassCard theme={theme} padding="sm" hoverLift={false} className="min-h-0 lg:h-full">
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
            <div className="flex shrink-0 items-start gap-3">
              <OnboardingIconBadge theme={theme} accent="purple">
                <Rocket className="h-5 w-5 text-white" />
              </OnboardingIconBadge>
              <div className="min-w-0">
                <h2
                  className={`text-xl font-bold leading-tight sm:text-2xl ${
                    t.isPastel
                      ? t.text
                      : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent'
                  }`}
                >
                  {GETTING_STARTED_PAGE.headline}
                </h2>
                <p
                  className={`mt-0.5 text-[11px] font-medium sm:text-xs ${
                    t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                  }`}
                >
                  {GETTING_STARTED_PAGE.tagline}
                </p>
              </div>
            </div>

            <OnboardingCardDetail theme={theme} className="shrink-0">
              {GETTING_STARTED_PAGE.description}
            </OnboardingCardDetail>

            <div className="shrink-0 space-y-2">
              <p
                className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
                  t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                }`}
              >
                {GETTING_STARTED_PAGE.principlesTitle}
              </p>
              <div className="space-y-1.5">
                {GETTING_STARTED_PAGE.principles.map((item) => (
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
                {GETTING_STARTED_PAGE.tipsTitle}
              </p>
              <div className="space-y-1.5">
                {GETTING_STARTED_PAGE.sessionTips.map((item) => (
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

            <div className="shrink-0 space-y-2 border-t border-white/10 pt-3">
              <p
                className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
                  t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                }`}
              >
                {GETTING_STARTED_PAGE.stepperTitle}
              </p>
              <div className="grid grid-cols-1 gap-y-1.5">
                {GETTING_STARTED_STEPS.map((step, index) => (
                  <div key={step.id} className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${
                          t.isPastel
                            ? 'border-purple-300/50 bg-purple-100 text-purple-700'
                            : 'border-cyber-purple-400/40 bg-cyber-purple-400/15 text-cyber-cyan-300'
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index < GETTING_STARTED_STEPS.length - 1 && (
                        <div
                          className={`my-0.5 w-px flex-1 min-h-[0.35rem] ${
                            t.isPastel
                              ? 'bg-gradient-to-b from-purple-300/60 to-purple-200/20'
                              : 'bg-gradient-to-b from-cyber-purple-400/50 to-transparent'
                          }`}
                        />
                      )}
                    </div>
                    <div className="min-w-0 pb-0.5">
                      <p className={`text-[11px] font-semibold leading-tight ${t.text}`}>{step.title}</p>
                      <p className={`text-[10px] leading-snug ${t.textMuted}`}>{step.outcome}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto shrink-0 border-t border-white/10 pt-3">
              <p className={`mb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] ${t.textMuted}`}>
                Full research pipeline
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {GETTING_STARTED_PAGE.pipeline.map((step, index) => (
                  <div key={step} className="flex items-center gap-1">
                    <OnboardingChip theme={theme}>{step}</OnboardingChip>
                    {index < GETTING_STARTED_PAGE.pipeline.length - 1 && (
                      <Link2 className={`h-3 w-3 ${t.isPastel ? 'text-gray-400' : 'text-cyber-cyan-400/70'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </OnboardingGlassCard>

        {/* Right — six step cards */}
        <div className="grid h-full min-h-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:grid-rows-3 sm:gap-2 lg:gap-2.5">
          {GETTING_STARTED_STEPS.map((step, index) => {
            const Icon = stepIcons[step.id as keyof typeof stepIcons];
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 + index * 0.03 }}
                className="flex min-h-0 h-full"
              >
                <OnboardingRichCard
                  theme={theme}
                  icon={<Icon className="h-4 w-4 text-white" />}
                  title={`${index + 1}. ${step.title}`}
                  summary={step.summary}
                  detail={step.detail}
                  highlights={step.highlights}
                  accent={step.accent}
                  outcome={step.outcome}
                  feedsInto={step.feedsInto}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </OnboardingPageShell>
  );
});
