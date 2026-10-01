import { motion } from 'framer-motion';
import {
  ArrowRight,
  FileCog,
  FileImage,
  Film,
  FolderOpen,
  Home,
  RefreshCw,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { Theme } from '../../types';
import { HexGrid } from '../Shared/HexGrid';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { ScanLine } from '../Shared/ScanLine';
import { useFileConverterTheme } from './fileConverterTheme';
import { isLightTheme } from '../../theme/themeSemantics';
import type { ModuleChromeProps } from '../../types/detachableModules';
import { ModuleChromeButtons } from '../Shared/ModuleChromeButtons';

interface FileConverterLandingPageProps extends ModuleChromeProps {
  theme: Theme;
  onBack: () => void;
  onStartConversion: () => void;
}

interface CapabilityHighlight {
  title: string;
  description: string;
  icon: LucideIcon;
}

const capabilityHighlights: CapabilityHighlight[] = [
  {
    title: 'Evidence-native intake',
    description: 'Pull files from vault cases or drop external media directly into the conversion pipeline.',
    icon: FolderOpen,
  },
  {
    title: 'Multi-format matrix',
    description: 'Images, PDFs, GIFs, and video routes with Sharp, PDF.js, and FFmpeg behind one workspace.',
    icon: RefreshCw,
  },
  {
    title: 'Vault-safe outputs',
    description: 'Replace originals with reference propagation or assign converted files back to cases.',
    icon: Shield,
  },
];

const formatFamilies = [
  { label: 'Images', detail: 'PNG · JPEG · WebP · TIFF', icon: FileImage },
  { label: 'Documents', detail: 'PDF page rasterization · image to PDF', icon: FileCog },
  { label: 'Video', detail: 'MP4 · WebM · MOV · MKV', icon: Film },
];

export function FileConverterLandingPage({
  theme,
  onBack,
  onStartConversion,
  hostMode,
  onPopOut,
  onReattach,
  popOutDisabled,
  isPastel: isPastelProp,
}: FileConverterLandingPageProps) {
  const t = useFileConverterTheme(theme);
  const isPastel = isPastelProp ?? isLightTheme(theme);

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
                featureLabel="File Converter"
                hostMode={hostMode}
                onPopOut={onPopOut}
                onReattach={onReattach}
                popOutDisabled={popOutDisabled}
                isPastel={isPastel}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${t.button}`}>
                <FileCog className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>Vault Engine</p>
                <h1 className={`text-xl font-bold md:text-2xl ${t.heading}`}>File Converter</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 md:py-10">
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
            <HolographicEffect className="rounded-[32px]" intensity={isPastel ? 0.18 : 0.28}>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                className={`overflow-hidden rounded-[32px] border p-8 md:p-10 ${t.panel}`}
              >
                <div className={`space-y-6 rounded-[28px] border p-6 md:p-7 ${t.softInsetSurface}`}>
                  <div
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] ${t.eyebrowBadge}`}
                  >
                    <RefreshCw className={`h-4 w-4 ${t.primary}`} />
                    Advanced format engine
                  </div>

                  <div className="space-y-4">
                    <h2 className={`max-w-3xl text-4xl font-bold leading-tight md:text-5xl ${t.heroHeading}`}>
                      Transform case evidence without leaving the Vault workflow.
                    </h2>
                    <p className={`max-w-2xl text-base leading-7 md:text-lg ${t.mutedText}`}>
                      Convert images, PDF pages, and video into research-ready formats with case-aware intake,
                      quality controls, and vault-safe replace or assign flows.
                    </p>
                  </div>

                  <div className={`rounded-[24px] border p-4 ${t.insetSurface}`}>
                    <div className="flex flex-wrap gap-3">
                      {['Case-linked sources', 'Batch PDF rasterization', 'Reference-safe replace'].map((pill) => (
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
                  <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Supported routes</p>
                  <h3 className={`mt-3 text-2xl font-bold ${t.heading}`}>Built for investigative media</h3>
                </div>

                <div className="grid gap-4">
                  {capabilityHighlights.map((item, index) => {
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

          <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <HolographicEffect className="rounded-[30px]" intensity={isPastel ? 0.14 : 0.24}>
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onStartConversion}
                className={`group relative flex h-full w-full flex-col overflow-hidden rounded-[30px] border p-7 text-left md:p-8 ${t.panel}`}
              >
                <div className="relative z-10 flex h-full flex-col gap-6">
                  <div className={`rounded-[26px] border p-5 ${t.softInsetSurface}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className={`rounded-3xl p-4 ${t.button}`}>
                        <FileCog className="h-7 w-7 text-white" />
                      </div>
                      <div
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] ${t.eyebrowBadge}`}
                      >
                        Conversion studio
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className={`text-2xl font-bold ${t.heading}`}>Open the Conversion Studio</h3>
                    <p className={`text-sm leading-7 md:text-base ${t.mutedText}`}>
                      Select vault or external evidence, tune output format and quality, then convert with live
                      progress and vault-safe result actions.
                    </p>
                  </div>

                  <div className={`rounded-[26px] border p-3 ${t.softInsetSurface}`}>
                    <div className="grid gap-3">
                      {[
                        'Guided source → output pipeline',
                        'Live FFmpeg / Sharp progress',
                        'Replace or assign to cases',
                      ].map((item) => (
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
                        <span>Enter Studio</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            </HolographicEffect>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className={`overflow-hidden rounded-[30px] border p-7 md:p-8 ${t.panel}`}
            >
              <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Format matrix</p>
              <h3 className={`mt-3 text-2xl font-bold ${t.heading}`}>What you can convert</h3>
              <div className="mt-6 grid gap-4">
                {formatFamilies.map((family, index) => {
                  const Icon = family.icon;
                  return (
                    <motion.div
                      key={family.label}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.2 + index * 0.06 }}
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
                  Ready to start
                </p>
                <p className={`mt-2 text-sm leading-6 ${t.body}`}>
                  The studio loads format capabilities from your local engine and adapts output options to each
                  source type automatically.
                </p>
              </div>
            </motion.div>
          </section>
        </main>
      </div>
    </div>
  );
}
