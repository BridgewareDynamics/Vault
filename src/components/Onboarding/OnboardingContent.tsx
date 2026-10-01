import { motion } from 'framer-motion';
import { memo } from 'react';
import {
  Archive,
  BookOpen,
  FileText,
  FolderOpen,
  Map as MapIcon,
  RefreshCw,
  Shield,
  Users,
} from 'lucide-react';
import { Theme } from '../../types';
import { OnboardingPageShell } from './OnboardingPageShell';
import {
  OnboardingCardDetail,
  OnboardingCardSummary,
  OnboardingChip,
  OnboardingGlassCard,
  OnboardingIconBadge,
  OnboardingRichCard,
} from './OnboardingGlassCard';
import { getOnboardingTheme } from './onboardingTheme';
import { VAULT_WELCOME, WELCOME_PILLARS } from './onboardingData';

interface OnboardingContentProps {
  theme?: Theme;
}

const pillarIcons = {
  extract: FileText,
  convert: RefreshCw,
  archive: FolderOpen,
  map: MapIcon,
  novel: BookOpen,
  audit: Shield,
} as const;

export const OnboardingContent = memo(function OnboardingContent({
  theme = 'brideware-purple',
}: OnboardingContentProps) {
  const t = getOnboardingTheme(theme);

  return (
    <OnboardingPageShell theme={theme}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid h-full min-h-0 grid-cols-1 gap-2.5 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-4"
      >
        {/* Left — full-height intro panel */}
        <OnboardingGlassCard theme={theme} padding="sm" hoverLift={false} className="min-h-0 lg:h-full">
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
            <div className="flex shrink-0 items-start gap-3">
              <OnboardingIconBadge theme={theme} size="md">
                <Archive className="h-5 w-5 text-white" />
              </OnboardingIconBadge>
              <div className="min-w-0">
                <h1
                  className={`text-2xl font-bold leading-tight sm:text-[1.65rem] ${
                    t.isPastel
                      ? t.text
                      : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent'
                  }`}
                >
                  {VAULT_WELCOME.headline}
                </h1>
                <p
                  className={`mt-0.5 text-[11px] font-medium sm:text-xs ${
                    t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                  }`}
                >
                  {VAULT_WELCOME.tagline}
                </p>
              </div>
            </div>

            <OnboardingCardDetail theme={theme} className="shrink-0">
              {VAULT_WELCOME.description}
            </OnboardingCardDetail>

            <div className="shrink-0 space-y-2">
              <p
                className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
                  t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                }`}
              >
                Core principles
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {VAULT_WELCOME.principles.map((principle) => (
                  <div
                    key={principle.label}
                    className={`rounded-xl border px-2.5 py-2 ${t.border} ${
                      t.isPastel ? 'bg-white/70' : 'bg-white/[0.03]'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                      }`}
                    >
                      {principle.label}
                    </p>
                    <p className={`mt-0.5 text-[10px] leading-snug ${t.textMuted}`}>{principle.text}</p>
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
                Connected research pipeline
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 lg:grid-cols-1">
                {VAULT_WELCOME.pipelineSteps.map((item, index) => (
                  <div key={item.step} className="flex gap-2">
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
                      {index < VAULT_WELCOME.pipelineSteps.length - 1 && (
                        <div
                          className={`my-0.5 w-px flex-1 min-h-[0.35rem] ${
                            t.isPastel
                              ? 'bg-gradient-to-b from-purple-300/60 to-purple-200/20'
                              : 'bg-gradient-to-b from-cyber-purple-400/50 to-transparent'
                          }`}
                        />
                      )}
                    </div>
                    <div className={`pb-1 ${index === VAULT_WELCOME.pipelineSteps.length - 1 ? '' : ''}`}>
                      <p className={`text-[11px] font-semibold leading-tight ${t.text}`}>{item.step}</p>
                      <p className={`text-[10px] leading-snug ${t.textMuted}`}>{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto shrink-0 space-y-2 border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                <Users className={`h-3.5 w-3.5 ${t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'}`} />
                <p
                  className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
                    t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                  }`}
                >
                  Built for
                </p>
              </div>
              <div className="space-y-1.5">
                {VAULT_WELCOME.audiences.map((audience) => (
                  <div
                    key={audience.label}
                    className={`rounded-lg border px-2 py-1.5 ${t.border} ${
                      t.isPastel ? 'bg-white/60' : 'bg-white/[0.02]'
                    }`}
                  >
                    <OnboardingCardSummary theme={theme} className="text-[10px]">
                      {audience.label}
                    </OnboardingCardSummary>
                    <p className={`text-[10px] leading-snug ${t.textMuted}`}>{audience.detail}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {VAULT_WELCOME.pipeline.map((step) => (
                  <OnboardingChip key={step} theme={theme}>
                    {step}
                  </OnboardingChip>
                ))}
              </div>
            </div>
          </div>
        </OnboardingGlassCard>

        {/* Right — module pillars */}
        <div className="grid min-h-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2 lg:gap-2">
          {WELCOME_PILLARS.map((pillar, index) => {
            const Icon = pillarIcons[pillar.id as keyof typeof pillarIcons];
            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + index * 0.04 }}
                className="min-h-0"
              >
                <OnboardingRichCard
                  theme={theme}
                  icon={<Icon className="h-4 w-4 text-white" />}
                  title={pillar.title}
                  summary={pillar.summary}
                  detail={pillar.detail}
                  highlights={pillar.highlights}
                  accent={pillar.accent}
                  isNew={pillar.isNew}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </OnboardingPageShell>
  );
});
