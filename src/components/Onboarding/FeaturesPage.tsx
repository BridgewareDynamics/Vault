import { motion } from 'framer-motion';
import { memo } from 'react';
import {
  FileText,
  FolderOpen,
  Shield,
  Map as MapIcon,
  BookOpen,
  RefreshCw,
  Search,
  Layers,
  PanelRight,
  Link2,
  LayoutGrid,
} from 'lucide-react';
import { Theme } from '../../types';
import { OnboardingPageShell } from './OnboardingPageShell';
import {
  OnboardingCardDetail,
  OnboardingCardSummary,
  OnboardingGlassCard,
  OnboardingGradientTitle,
  OnboardingIconBadge,
  OnboardingRichCard,
} from './OnboardingGlassCard';
import { getOnboardingTheme } from './onboardingTheme';
import { FEATURE_INFRA, FEATURE_MODULES, FEATURES_PAGE } from './onboardingData';

interface FeaturesPageProps {
  theme?: Theme;
}

const moduleIcons = {
  pdf: FileText,
  converter: RefreshCw,
  vault: FolderOpen,
  map: MapIcon,
  novel: BookOpen,
  audit: Shield,
} as const;

const infraIcons = {
  search: Search,
  detach: PanelRight,
  themes: Layers,
  pipeline: Link2,
} as const;

export const FeaturesPage = memo(function FeaturesPage({ theme = 'brideware-purple' }: FeaturesPageProps) {
  const t = getOnboardingTheme(theme);

  return (
    <OnboardingPageShell theme={theme}>
      <div className="grid h-full min-h-0 grid-cols-1 gap-2.5 lg:grid-cols-[1fr_1.12fr] lg:items-stretch lg:gap-4">
        {/* Left — overview + infrastructure */}
        <OnboardingGlassCard theme={theme} padding="sm" hoverLift={false} className="min-h-0 lg:h-full">
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
            <div className="flex shrink-0 items-start gap-3">
              <OnboardingIconBadge theme={theme} accent="purple">
                <LayoutGrid className="h-4 w-4 text-white" />
              </OnboardingIconBadge>
              <div className="min-w-0">
                <h2
                  className={`text-xl font-bold leading-tight sm:text-2xl ${
                    t.isPastel
                      ? t.text
                      : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent'
                  }`}
                >
                  {FEATURES_PAGE.headline}
                </h2>
                <p
                  className={`mt-0.5 text-[11px] font-medium sm:text-xs ${
                    t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                  }`}
                >
                  {FEATURES_PAGE.tagline}
                </p>
              </div>
            </div>

            <OnboardingCardDetail theme={theme} className="shrink-0">
              {FEATURES_PAGE.description}
            </OnboardingCardDetail>

            <div className="shrink-0 space-y-2">
              <p
                className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
                  t.isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'
                }`}
              >
                How modules connect
              </p>
              <div className="space-y-1.5">
                {FEATURES_PAGE.connections.map((item) => (
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
                {FEATURES_PAGE.infraTitle}
              </p>
              <div className="space-y-1.5">
                {FEATURE_INFRA.map((item) => {
                  const Icon = infraIcons[item.id as keyof typeof infraIcons];
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border px-2.5 py-2 ${t.border} ${
                        t.isPastel ? 'bg-white/60' : 'bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <OnboardingIconBadge theme={theme} size="sm">
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </OnboardingGlassCard>

        {/* Right — six module cards, equal-height grid */}
        <div className="grid h-full min-h-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:grid-rows-3 sm:gap-2 lg:gap-2.5">
          {FEATURE_MODULES.map((feature, index) => {
            const Icon = moduleIcons[feature.id as keyof typeof moduleIcons];
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.04 + index * 0.03 }}
                className="flex min-h-0 h-full"
              >
                <OnboardingRichCard
                  theme={theme}
                  icon={<Icon className="h-4 w-4 text-white" />}
                  title={feature.title}
                  summary={feature.summary}
                  detail={feature.detail}
                  highlights={feature.highlights}
                  accent={feature.accent}
                  isNew={feature.isNew}
                  feedsInto={feature.feedsInto}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </OnboardingPageShell>
  );
});
