import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Download,
  FolderOpen,
  Home,
  Library,
  PenLine,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { Theme } from '../../types';
import { HexGrid } from '../Shared/HexGrid';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { ScanLine } from '../Shared/ScanLine';
import { useNovelTheme } from './novelTheme';
import type { ModuleChromeProps } from '../../types/detachableModules';
import { ModuleChromeButtons } from '../Shared/ModuleChromeButtons';
import { isLightTheme } from '../../theme/themeSemantics';

interface NovelLandingPageProps extends ModuleChromeProps {
  theme: Theme;
  onBack: () => void;
  onNewNovel: () => void;
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

const workflowHighlights = [
  {
    title: 'Spread-based book studio',
    description:
      'Compose case narratives as flipbook spreads with cover design, rich text, and draggable images on every page.',
    icon: BookOpen,
  },
  {
    title: 'Case-aware storage',
    description:
      'Keep books in the Vault library or bind them to a case so evidence and notes stay with the investigation.',
    icon: FolderOpen,
  },
  {
    title: 'Print-ready output',
    description:
      'Pick trade trim sizes, assign covers from case assets, and export finished books for briefs and review.',
    icon: Download,
  },
];

const bookCapabilities = [
  { label: 'Trim sizes', detail: 'US Trade · Digest · International presets', icon: BookMarked },
  { label: 'Editor', detail: 'Cover spread · page flip · inline images', icon: PenLine },
  { label: 'Vault flow', detail: 'Assign case · move to library · export', icon: FolderOpen },
];

export function NovelLandingPage({
  theme,
  onBack,
  onNewNovel,
  onOpenLibrary,
  hostMode,
  onPopOut,
  onReattach,
  popOutDisabled,
  isPastel: isPastelProp,
}: NovelLandingPageProps) {
  const t = useNovelTheme(theme);
  const isPastel = isPastelProp ?? isLightTheme(theme);

  const actionCards: LandingActionCard[] = [
    {
      title: 'Create a New Book',
      eyebrow: 'Fresh narrative workspace',
      description:
        'Start with a title, trim size, and optional case link—then build cover spreads, add pages, and save to Vault storage.',
      cta: 'Create Book',
      onClick: onNewNovel,
      icon: Plus,
      highlights: ['Cover + spread editor', 'Case link at creation', 'Autosave to Vault folders'],
    },
    {
      title: 'Open the Book Library',
      eyebrow: 'Reopen saved work',
      description:
        'Browse Vault and case-linked novels with page counts, storage context, and quick reopen into the spread editor.',
      cta: 'Browse Library',
      onClick: onOpenLibrary,
      icon: Library,
      highlights: ['Vault and case filters', 'Search by title or case', 'Fast reopen for edits and export'],
    },
  ];

  return (
    <div className={`relative min-h-screen overflow-hidden ${t.bg}`}>
      <HexGrid theme={theme} density={24} />
      <ScanLine theme={theme} speed={10} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute -left-20 top-20 h-72 w-72 rounded-full blur-3xl ${t.heroGlowPrimary}`} />
        <div className={`absolute right-8 top-1/3 h-80 w-80 rounded-full blur-3xl ${t.heroGlowSecondary}`} />
      </div>

      <div className={`relative z-10 flex min-h-screen flex-col ${t.body}`}>
        <header className={`border-b backdrop-blur-xl ${t.headerBorder}`}>
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition-colors ${t.secondaryButton}`}
                aria-label="Back to home"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Home</span>
              </button>
              <ModuleChromeButtons
                featureLabel="Novel"
                hostMode={hostMode}
                onPopOut={onPopOut}
                onReattach={onReattach}
                popOutDisabled={popOutDisabled}
                isPastel={isPastel}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${t.button}`}>
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>Vault Engine</p>
                <h1 className={`text-xl font-bold md:text-2xl ${t.heading}`}>Novel</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 md:py-10">
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
            <HolographicEffect className="rounded-[32px]" intensity={t.isPastel ? 0.18 : 0.28}>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                className={`overflow-hidden rounded-[32px] border p-8 md:p-10 ${t.panel}`}
              >
                <div className="space-y-6 rounded-[28px] border p-6 md:p-7">
                  <div
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] ${t.softInsetSurface}`}
                  >
                    <PenLine className={`h-4 w-4 ${t.primary}`} />
                    Case narrative studio
                  </div>

                  <div className="space-y-4">
                    <h2 className={`max-w-3xl text-4xl font-bold leading-tight md:text-5xl ${t.heroHeading}`}>
                      Turn investigation notes into polished, case-ready books inside Vault.
                    </h2>
                    <p className={`max-w-2xl text-base leading-7 md:text-lg ${t.mutedText}`}>
                      Build spread-based novels with covers, trim sizes, rich text, and case-linked assets—then export
                      finished volumes for briefs, review, and downstream reporting.
                    </p>
                  </div>

                  <div className={`rounded-[24px] border p-4 ${t.softInsetSurface}`}>
                    <div className="flex flex-wrap gap-3">
                      {['Spread book editor', 'Case-linked library', 'Cover + export'].map((pill) => (
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
                  <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Why this feature</p>
                  <h3 className={`mt-3 text-2xl font-bold ${t.heading}`}>
                    A narrative command center built into Vault
                  </h3>
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
                            <p className={`text-sm leading-6 ${t.body}`}>{item.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            {actionCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <HolographicEffect key={card.title} className="rounded-[30px]" intensity={t.isPastel ? 0.14 : 0.24}>
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
                          <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
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

          <section className={`overflow-hidden rounded-[30px] border p-7 md:p-8 ${t.panel}`}>
            <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Built into the editor</p>
            <h3 className={`mt-3 text-2xl font-bold ${t.heading}`}>What you can build</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {bookCapabilities.map((family, index) => {
                const Icon = family.icon;
                return (
                  <motion.div
                    key={family.label}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.12 + index * 0.06 }}
                    className={`rounded-[24px] border p-4 ${t.insetSurface}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2.5 ${t.button}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className={`font-semibold ${t.heading}`}>{family.label}</p>
                        <p className={`text-sm ${t.mutedText}`}>{family.detail}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className={`mt-6 rounded-[22px] border p-4 ${t.callout}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${t.calloutLabel}`}>
                Works with your case flow
              </p>
              <p className={`mt-2 text-sm leading-6 ${t.body}`}>
                Pull cover images and assets from linked cases, move books between the Vault library and case folders,
                and keep narratives alongside transcripts and maps in one workspace.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
