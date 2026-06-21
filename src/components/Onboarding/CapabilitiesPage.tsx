import { motion } from 'framer-motion';
import { memo } from 'react';
import {
  GraduationCap,
  Briefcase,
  FileSearch,
  Users,
  BookOpen,
  Target,
  Layers,
  Link2,
  Scale,
  Microscope,
  Library,
} from 'lucide-react';
import { Theme } from '../../types';
import { OnboardingPageShell } from './OnboardingPageShell';
import {
  OnboardingCardDetail,
  OnboardingCardSummary,
  OnboardingChip,
  OnboardingGlassCard,
  OnboardingGradientTitle,
  OnboardingIconBadge,
  OnboardingRichCard,
} from './OnboardingGlassCard';
import { getOnboardingTheme } from './onboardingTheme';
import { USE_CASES, USE_CASES_PAGE } from './onboardingData';

interface CapabilitiesPageProps {
  theme?: Theme;
}

const useCaseIcons = {
  academic: GraduationCap,
  legal: Briefcase,
  analysis: FileSearch,
  team: Users,
  library: BookOpen,
  project: Target,
} as const;

const spotlightIcons = {
  investigator: Scale,
  researcher: Microscope,
  archivist: Library,
} as const;

export const CapabilitiesPage = memo(function CapabilitiesPage({
  theme = 'brideware-purple',
}: CapabilitiesPageProps) {
  const t = getOnboardingTheme(theme);

  return (
    <OnboardingPageShell theme={theme}>
      <div className="grid h-full min-h-0 grid-cols-1 gap-2.5 lg:grid-cols-[1fr_1.12fr] lg:items-stretch lg:gap-4">
        {/* Left — how disciplines adapt the pipeline */}
        <OnboardingGlassCard theme={theme} padding="sm" hoverLift={false} className="min-h-0 lg:h-full">
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
            <div className="flex shrink-0 items-start gap-3">
              <OnboardingIconBadge theme={theme} accent="cyan">
                <Layers className="h-5 w-5 text-white" />
              </OnboardingIconBadge>
              <div className="min-w-0">
                <h2
                  className={`text-xl font-bold leading-tight sm:text-2xl ${
                    t.isPastel
                      ? t.text
                      : 'bg-gradient-to-r from-cyber-cyan-400 via-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent'
                  }`}
                >
                  {USE_CASES_PAGE.headline}
                </h2>
                <p
                  className={`mt-0.5 text-[11px] font-medium sm:text-xs ${
                    t.isPastel ? 'text-cyan-700' : 'text-cyber-cyan-400'
                  }`}
                >
                  {USE_CASES_PAGE.tagline}
                </p>
              </div>
            </div>

            <OnboardingCardDetail theme={theme} className="shrink-0">
              {USE_CASES_PAGE.description}
            </OnboardingCardDetail>

            <div className="shrink-0 space-y-2">
              <p
                className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
                  t.isPastel ? 'text-cyan-700' : 'text-cyber-cyan-400'
                }`}
              >
                What stays the same
              </p>
              <div className="space-y-1.5">
                {USE_CASES_PAGE.adaptPrinciples.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl border px-2.5 py-2 ${t.border} ${
                      t.isPastel ? 'bg-white/70' : 'bg-white/[0.03]'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        t.isPastel ? 'text-cyan-700' : 'text-cyber-cyan-400'
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
                  t.isPastel ? 'text-cyan-700' : 'text-cyber-cyan-400'
                }`}
              >
                {USE_CASES_PAGE.spotlightsTitle}
              </p>
              <div className="space-y-1.5">
                {USE_CASES_PAGE.disciplineSpotlights.map((item) => {
                  const Icon = spotlightIcons[item.id as keyof typeof spotlightIcons];
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border px-2.5 py-2 ${t.border} ${
                        t.isPastel ? 'bg-white/60' : 'bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <OnboardingIconBadge theme={theme} accent="cyan" size="sm">
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </OnboardingIconBadge>
                        <div className="min-w-0 flex-1">
                          <OnboardingGradientTitle theme={theme} className="text-[11px] sm:text-xs">
                            {item.title}
                          </OnboardingGradientTitle>
                          <OnboardingCardSummary theme={theme} className="mt-0.5 text-[10px]">
                            {item.summary}
                          </OnboardingCardSummary>
                          <OnboardingCardDetail theme={theme} className="mt-0.5">
                            {item.detail}
                          </OnboardingCardDetail>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.highlights.map((h) => (
                              <OnboardingChip key={h} theme={theme}>
                                {h}
                              </OnboardingChip>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 space-y-2 border-t border-white/10 pt-3">
              <p
                className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
                  t.isPastel ? 'text-cyan-700' : 'text-cyber-cyan-400'
                }`}
              >
                Typical workflow paths
              </p>
              <div className="space-y-1.5">
                {USE_CASES_PAGE.workflowProfiles.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl border px-2.5 py-2 ${t.border} ${
                      t.isPastel ? 'bg-cyan-50/80' : 'bg-cyber-cyan-400/[0.04]'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                        t.isPastel ? 'text-cyan-800' : 'text-cyan-200'
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
              <p
                className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
                  t.isPastel ? 'text-cyan-700' : 'text-cyber-cyan-400'
                }`}
              >
                Built for
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {USE_CASES_PAGE.audiences.map((audience) => (
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
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                {USE_CASES_PAGE.pipeline.map((step, index) => (
                  <div key={step} className="flex items-center gap-1">
                    <OnboardingChip theme={theme}>{step}</OnboardingChip>
                    {index < USE_CASES_PAGE.pipeline.length - 1 && (
                      <Link2 className={`h-3 w-3 ${t.isPastel ? 'text-gray-400' : 'text-cyber-cyan-400/70'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </OnboardingGlassCard>

        {/* Right — six discipline cards, equal-height grid */}
        <div className="grid h-full min-h-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:grid-rows-3 sm:gap-2 lg:gap-2.5">
          {USE_CASES.map((useCase, index) => {
            const Icon = useCaseIcons[useCase.id as keyof typeof useCaseIcons];
            return (
              <motion.div
                key={useCase.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.04 + index * 0.03 }}
                className="flex min-h-0 h-full"
              >
                <OnboardingRichCard
                  theme={theme}
                  icon={<Icon className="h-4 w-4 text-white" />}
                  title={useCase.title}
                  summary={useCase.summary}
                  detail={useCase.detail}
                  highlights={useCase.highlights}
                  accent={useCase.accent}
                  tools={useCase.tools}
                  feedsInto={useCase.feedsInto}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </OnboardingPageShell>
  );
});
