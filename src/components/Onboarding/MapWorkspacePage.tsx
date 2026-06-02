import { motion } from 'framer-motion';
import { memo } from 'react';
import {
  CalendarDays,
  FolderOpen,
  Link2,
  Map as MapIcon,
  Paperclip,
  StickyNote,
  Layers,
  GitBranch,
  Search,
  Save,
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
import { MAP_CONTENT } from './onboardingData';

interface MapWorkspacePageProps {
  theme?: Theme;
}

const integrationIcons = {
  cases: FolderOpen,
  attach: Paperclip,
  chrono: CalendarDays,
} as const;

const capabilityIcons = {
  'dated-blocks': CalendarDays,
  attachments: Paperclip,
  notes: StickyNote,
  tiers: Layers,
  gaps: Search,
  saves: Save,
} as const;

export const MapWorkspacePage = memo(function MapWorkspacePage({
  theme = 'brideware-purple',
}: MapWorkspacePageProps) {
  const t = getOnboardingTheme(theme);

  return (
    <OnboardingPageShell theme={theme}>
      <div className="grid h-full min-h-0 grid-cols-1 gap-2.5 lg:grid-cols-[1fr_1.12fr] lg:items-stretch lg:gap-4">
        {/* Left — why maps + vault integration */}
        <OnboardingGlassCard theme={theme} padding="sm" hoverLift={false} className="min-h-0 lg:h-full">
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
            <div className="flex shrink-0 items-start gap-3">
              <OnboardingIconBadge theme={theme} accent="emerald">
                <MapIcon className="h-5 w-5 text-white" />
              </OnboardingIconBadge>
              <div className="min-w-0">
                <h2
                  className={`text-xl font-bold leading-tight sm:text-2xl ${
                    t.isPastel
                      ? t.text
                      : 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent'
                  }`}
                >
                  {MAP_CONTENT.headline}
                </h2>
                <p
                  className={`mt-0.5 text-[11px] font-medium sm:text-xs ${
                    t.isPastel ? 'text-emerald-700' : 'text-emerald-300'
                  }`}
                >
                  {MAP_CONTENT.tagline}
                </p>
              </div>
            </div>

            <OnboardingCardDetail theme={theme} className="shrink-0">
              {MAP_CONTENT.description}
            </OnboardingCardDetail>

            <div className="shrink-0 space-y-2">
              <p
                className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
                  t.isPastel ? 'text-emerald-700' : 'text-emerald-300'
                }`}
              >
                Why visual timelines
              </p>
              <div className="space-y-1.5">
                {MAP_CONTENT.whyMaps.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl border px-2.5 py-2 ${t.border} ${
                      t.isPastel ? 'bg-white/70' : 'bg-white/[0.03]'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        t.isPastel ? 'text-emerald-700' : 'text-emerald-300'
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
                  t.isPastel ? 'text-emerald-700' : 'text-emerald-300'
                }`}
              >
                Folder vs map
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                {MAP_CONTENT.folderVsMap.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl border px-2.5 py-2 ${t.border} ${
                      t.isPastel ? 'bg-emerald-50/80' : 'bg-emerald-400/[0.04]'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                        t.isPastel ? 'text-emerald-800' : 'text-emerald-200'
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
                  t.isPastel ? 'text-emerald-700' : 'text-emerald-300'
                }`}
              >
                {MAP_CONTENT.integrationsTitle}
              </p>
              <div className="space-y-1.5">
                {MAP_CONTENT.integrations.map((item) => {
                  const Icon = integrationIcons[item.id as keyof typeof integrationIcons];
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border px-2.5 py-2 ${t.border} ${
                        t.isPastel ? 'bg-white/60' : 'bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <OnboardingIconBadge theme={theme} accent="emerald" size="sm">
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

            <div className="mt-auto shrink-0 space-y-1.5 border-t border-white/10 pt-3">
              <p className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${t.textMuted}`}>
                Full research pipeline
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {MAP_CONTENT.workflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-1">
                    <OnboardingChip theme={theme}>{step}</OnboardingChip>
                    {index < MAP_CONTENT.workflow.length - 1 && (
                      <Link2 className={`h-3 w-3 ${t.isPastel ? 'text-gray-400' : 'text-emerald-400/70'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </OnboardingGlassCard>

        {/* Right — six canvas capability cards */}
        <div className="flex min-h-0 flex-col gap-2">
          <p
            className={`shrink-0 text-center text-[9px] font-semibold uppercase tracking-[0.2em] lg:text-left ${
              t.isPastel ? 'text-emerald-700' : 'text-emerald-300'
            }`}
          >
            {MAP_CONTENT.capabilitiesTitle}
          </p>
          <div className="grid h-full min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 sm:grid-rows-3 sm:gap-2 lg:gap-2.5">
            {MAP_CONTENT.capabilities.map((cap, index) => {
              const Icon = capabilityIcons[cap.id as keyof typeof capabilityIcons] ?? GitBranch;
              return (
                <motion.div
                  key={cap.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 + index * 0.03 }}
                  className="flex min-h-0 h-full"
                >
                  <OnboardingRichCard
                    theme={theme}
                    icon={<Icon className="h-4 w-4 text-white" />}
                    title={cap.title}
                    summary={cap.summary}
                    detail={cap.detail}
                    highlights={cap.highlights}
                    accent="emerald"
                    feedsInto={cap.feedsInto}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </OnboardingPageShell>
  );
});
