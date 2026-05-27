import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  FolderOpen,
  Home,
  Library,
  Map as MapIcon,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { Theme } from '../../types';
import { HexGrid } from '../Shared/HexGrid';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { ScanLine } from '../Shared/ScanLine';
import { useMapTheme } from './mapTheme';

interface MapLandingPageProps {
  theme: Theme;
  onBack: () => void;
  onNewMap: () => void;
  onOpenLibrary: () => void;
}

interface LandingActionCard {
  title: string;
  eyebrow: string;
  description: string;
  cta: string;
  onClick: () => void;
  icon: LucideIcon;
  highlights: string[];
}

const featurePills = ['Chronology-first layout', 'Case-linked storage', 'Notes and attachments'];

const workflowHighlights = [
  {
    title: 'Dated blocks',
    description: 'Organize events by era, phase, year, month, or day.',
    icon: CalendarDays,
  },
  {
    title: 'Vault connected',
    description: 'Open work from global storage or directly from case folders.',
    icon: FolderOpen,
  },
  {
    title: 'Built for analysis',
    description: 'Map relationships, gaps, and narrative flow in one place.',
    icon: MapIcon,
  },
];

export function MapLandingPage({ theme, onBack, onNewMap, onOpenLibrary }: MapLandingPageProps) {
  const t = useMapTheme(theme);

  const actionCards: LandingActionCard[] = [
    {
      title: 'Create a New Map',
      eyebrow: 'Blank chronology workspace',
      description:
        'Launch a fresh timeline canvas with a strong first impression and jump straight into naming and building.',
      cta: 'Create Blank Map',
      onClick: onNewMap,
      icon: Plus,
      highlights: ['Instant blank canvas', 'Editable title on open', 'Optimized for case research'],
    },
    {
      title: 'Open the Library',
      eyebrow: 'Browse saved investigations',
      description:
        'Return to existing maps with richer browsing, quick context, and a cleaner view of Vault versus case-linked work.',
      cta: 'Browse Library',
      onClick: onOpenLibrary,
      icon: Library,
      highlights: ['Recent activity overview', 'Vault and case filters', 'Fast open and cleanup'],
    },
  ];

  return (
    <div className={`relative min-h-screen overflow-hidden ${t.bg}`}>
      <HexGrid theme={theme} density={24} />
      <ScanLine theme={theme} speed={11} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute -left-20 top-20 h-72 w-72 rounded-full blur-3xl ${t.ambientGlowPrimary}`} />
        <div className={`absolute right-8 top-1/3 h-80 w-80 rounded-full blur-3xl ${t.ambientGlowSecondary}`} />
      </div>

      <div className={`relative z-10 flex min-h-screen flex-col ${t.body}`}>
        <header className={`border-b backdrop-blur-xl ${t.headerBorder}`}>
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition-colors ${t.secondaryButton}`}
              aria-label="Back to home"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Home</span>
            </button>

            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${t.button}`}>
                <MapIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>Map Workspace</p>
                <h1 className={`text-xl font-bold md:text-2xl ${t.heading}`}>Research Maps</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 md:py-10">
          <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <HolographicEffect className="rounded-[32px]" intensity={t.isPastel ? 0.18 : 0.28}>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                className={`relative overflow-hidden rounded-[32px] border p-8 md:p-10 ${t.panel}`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${t.panelGradient}`}
                />

                <div className="relative z-10 flex h-full flex-col gap-8">
                  <div className={`space-y-6 rounded-[28px] border p-6 md:p-7 ${t.insetSurface}`}>
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em]">
                      <CalendarDays className={`h-4 w-4 ${t.primary}`} />
                      Visual chronology system
                    </div>

                    <div className="space-y-4">
                      <h2
                        className={`max-w-3xl text-4xl font-bold leading-tight md:text-5xl ${t.heroHeading}`}
                      >
                        Build maps that feel like a premium investigation workspace.
                      </h2>
                      <p className={`max-w-2xl text-base leading-7 md:text-lg ${t.mutedText}`}>
                        Create polished research timelines with dated blocks, supporting notes, and attachments that
                        stay connected to the Vault. The experience now opens with clearer hierarchy, richer context,
                        and faster next actions.
                      </p>
                    </div>

                    <div className={`rounded-[24px] border p-4 ${t.softInsetSurface}`}>
                      <div className="flex flex-wrap gap-3">
                        {featurePills.map((pill) => (
                          <span
                            key={pill}
                            className={`rounded-full border px-4 py-2 text-sm font-medium ${t.featurePill}`}
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </HolographicEffect>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
              className={`overflow-hidden rounded-[32px] border p-6 md:p-7 ${t.panel}`}
            >
              <div className="space-y-5">
                <div>
                  <p className={`text-xs uppercase tracking-[0.3em] ${t.primary}`}>Why Map works</p>
                  <h3 className={`mt-3 text-2xl font-bold ${t.heading}`}>A cleaner launchpad for timeline work</h3>
                </div>

                <div className="grid gap-4">
                  {workflowHighlights.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.12 + index * 0.06 }}
                        className={`rounded-[26px] border p-5 ${t.insetSurface}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`rounded-2xl p-3 ${t.button}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="space-y-1">
                            <h4 className={`text-base font-semibold ${t.heading}`}>{item.title}</h4>
                            <p className={`text-sm leading-6 ${t.mutedText}`}>{item.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className={`rounded-[26px] border p-6 ${t.callout}`}>
                  <p className={`text-xs uppercase tracking-[0.28em] ${t.calloutLabel}`}>
                    Ready to start
                  </p>
                  <p className={`mt-3 text-sm leading-6 ${t.mutedText}`}>
                    Use a blank map when you need to sketch a chronology quickly, then return through the Library to
                    reopen, sort, and manage the work as the investigation grows.
                  </p>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            {actionCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <HolographicEffect
                  key={card.title}
                  className="rounded-[30px]"
                  intensity={t.isPastel ? 0.14 : 0.24}
                >
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.12 + index * 0.06 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={card.onClick}
                    className={`group relative flex h-full w-full flex-col overflow-hidden rounded-[30px] border p-7 text-left md:p-8 ${t.panel}`}
                  >
                    <div
                      className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${t.cardHoverOverlay}`}
                    />

                    <div className="relative z-10 flex h-full flex-col gap-6">
                      <div className={`rounded-[26px] border p-5 ${t.softInsetSurface}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className={`rounded-3xl p-4 ${t.button}`}>
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                          <div
                            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] ${t.eyebrowBadge}`}
                          >
                            {card.eyebrow}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className={`text-2xl font-bold ${t.heading}`}>{card.title}</h3>
                        <p className={`text-sm leading-7 md:text-base ${t.mutedText}`}>{card.description}</p>
                      </div>

                      <div className={`rounded-[26px] border p-3 ${t.softInsetSurface}`}>
                        <div className="grid gap-3">
                          {card.highlights.map((item) => (
                            <div
                              key={item}
                              className={`flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm ${t.highlightRow}`}
                            >
                              <span className={`h-2.5 w-2.5 rounded-full ${t.highlightDot}`} />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`mt-auto rounded-[22px] border px-4 py-3 ${t.softInsetSurface}`}>
                        <div className={`rounded-3xl p-4 ${t.button}`}>
                          <div className="inline-flex items-center gap-2 text-sm font-semibold">
                            <span>{card.cta}</span>
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </HolographicEffect>
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
}
