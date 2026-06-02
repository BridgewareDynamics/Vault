import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  FileCog,
  FileInput,
  Home,
  Settings2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Theme, FileConverterOutputFormat, FileConverterSource, FileConverterTarget } from '../../types';
import { HexGrid } from '../Shared/HexGrid';
import { ScanLine } from '../Shared/ScanLine';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { ModuleChromeButtons } from '../Shared/ModuleChromeButtons';
import { useFileConverter } from '../../hooks/useFileConverter';
import { useToast } from '../Toast/ToastContext';
import { useFileConverterTheme } from './fileConverterTheme';
import { FileConverterSourcePanel } from './FileConverterSourcePanel';
import { FileConverterFormatPicker } from './FileConverterFormatPicker';
import { FileConverterProgressPanel } from './FileConverterProgress';
import { FileConverterResultsPanel } from './FileConverterResults';
import { FileConverterStepRail, type FileConverterStepId } from './FileConverterStepRail';
import { isLightTheme } from '../../theme/themeSemantics';
import { useRegisterVaultActiveCase } from '../../contexts/VaultActiveCaseContext';
import type { FileConverterModuleDetachState, ModuleChromeProps } from '../../types/detachableModules';
import type { FileConverterWorkspaceDetachBridge } from '../../types/detachableModules';
import { DEFAULT_FILE_CONVERTER_TARGET } from './fileConverterDefaults';

interface FileConverterWorkspacePageProps extends ModuleChromeProps {
  theme: Theme;
  onBack: () => void;
  onExit: () => void;
  initialState?: FileConverterModuleDetachState | null;
  registerWorkspaceBridge?: (bridge: FileConverterWorkspaceDetachBridge | null) => void;
}

const WORKSPACE_STEPS = [
  { id: 'source' as const, label: 'Source', icon: FileInput },
  { id: 'output' as const, label: 'Output', icon: Settings2 },
  { id: 'convert' as const, label: 'Convert', icon: Zap },
  { id: 'results' as const, label: 'Results', icon: Sparkles },
];

function resolveActiveStep(
  source: FileConverterSource | null,
  isConverting: boolean,
  hasResult: boolean
): FileConverterStepId {
  if (hasResult) {
    return 'results';
  }
  if (isConverting) {
    return 'convert';
  }
  if (source) {
    return 'output';
  }
  return 'source';
}

export function FileConverterWorkspacePage({
  theme,
  onBack,
  onExit,
  initialState = null,
  registerWorkspaceBridge,
  hostMode,
  onPopOut,
  onReattach,
  popOutDisabled,
  isPastel: isPastelProp,
}: FileConverterWorkspacePageProps) {
  const t = useFileConverterTheme(theme);
  const isPastel = isPastelProp ?? isLightTheme(theme);
  const toast = useToast();

  const { convert, cancel, reset, isConverting, progress, result, error, capabilities } =
    useFileConverter();

  const [source, setSource] = useState<FileConverterSource | null>(initialState?.source ?? null);
  const [target, setTarget] = useState<FileConverterTarget>(
    initialState?.target ?? DEFAULT_FILE_CONVERTER_TARGET
  );
  const [selectedCasePath, setSelectedCasePath] = useState<string | null>(
    initialState?.selectedCasePath ?? null
  );

  const linkedCaseName = selectedCasePath?.split(/[\\/]/).filter(Boolean).pop() ?? null;
  useRegisterVaultActiveCase(selectedCasePath, linkedCaseName);

  const availableFormats = useMemo((): FileConverterOutputFormat[] => {
    if (!source || !capabilities) {
      return [];
    }
    return capabilities.matrix[source.category] ?? [];
  }, [source, capabilities]);

  const activeStep = resolveActiveStep(source, isConverting, Boolean(result));

  const completedSteps = useMemo(() => {
    const completed = new Set<FileConverterStepId>();
    if (source) {
      completed.add('source');
    }
    if (source && availableFormats.length > 0) {
      completed.add('output');
    }
    if (result) {
      completed.add('convert');
      completed.add('results');
    }
    return completed;
  }, [source, availableFormats.length, result]);

  useEffect(() => {
    if (availableFormats.length > 0 && !availableFormats.includes(target.format)) {
      setTarget((prev) => ({ ...prev, format: availableFormats[0] }));
    }
  }, [availableFormats, target.format]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isConverting) {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConverting, onBack]);

  const handleConvert = useCallback(async () => {
    if (!source) {
      toast.error('Select a source file first');
      return;
    }
    await convert(source, target);
  }, [source, target, convert, toast]);

  const handleComplete = useCallback(() => {
    setSource(null);
    setTarget(DEFAULT_FILE_CONVERTER_TARGET);
    setSelectedCasePath(null);
    reset();
  }, [reset]);

  const collectDetachState = useCallback(async (): Promise<FileConverterModuleDetachState> => {
    return {
      screen: 'workspace',
      source,
      target,
      selectedCasePath,
    };
  }, [source, target, selectedCasePath]);

  useEffect(() => {
    if (!registerWorkspaceBridge) {
      return;
    }
    registerWorkspaceBridge({
      collectDetachState,
      isConverting: () => isConverting,
    });
    return () => registerWorkspaceBridge(null);
  }, [registerWorkspaceBridge, collectDetachState, isConverting]);

  const canConvert = Boolean(source) && !isConverting && availableFormats.length > 0;

  return (
    <div className={`relative min-h-screen overflow-hidden ${t.bg}`}>
      <HexGrid theme={theme} density={20} />
      <ScanLine theme={theme} speed={12} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute left-1/4 top-16 h-64 w-64 rounded-full blur-3xl ${t.heroGlowPrimary}`} />
        <div className={`absolute bottom-20 right-1/4 h-72 w-72 rounded-full blur-3xl ${t.heroGlowSecondary}`} />
      </div>

      <div className={`relative z-10 flex min-h-screen flex-col ${t.body}`}>
        <header className={`border-b backdrop-blur-xl ${t.headerBorder}`}>
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                disabled={isConverting}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition-colors ${t.secondaryButton}`}
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Landing</span>
              </button>
              <button
                type="button"
                onClick={onExit}
                disabled={isConverting}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition-colors ${t.secondaryButton}`}
                aria-label="Back to home"
              >
                <Home className="h-5 w-5" />
              </button>
              <ModuleChromeButtons
                featureLabel="File Converter"
                hostMode={hostMode}
                onPopOut={onPopOut}
                onReattach={onReattach}
                popOutDisabled={popOutDisabled || isConverting}
                isPastel={isPastel}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${t.button}`}>
                <FileCog className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>Conversion Studio</p>
                <h1 className={`text-xl font-bold md:text-2xl ${t.heading}`}>File Converter</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 md:gap-8 md:py-10">
          <FileConverterStepRail
            theme={theme}
            steps={WORKSPACE_STEPS}
            activeStep={activeStep}
            completedSteps={completedSteps}
          />

          <div className="grid gap-6 xl:grid-cols-2">
            <HolographicEffect className="rounded-[32px]" intensity={isPastel ? 0.14 : 0.22}>
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`overflow-hidden rounded-[32px] border p-6 md:p-8 ${t.panel}`}
              >
                <div className="mb-6 space-y-2">
                  <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Step 1</p>
                  <h2 className={`text-2xl font-bold ${t.heading}`}>Source evidence</h2>
                  <p className={`text-sm leading-6 ${t.mutedText}`}>
                    Choose a vault case file, browse external media, or drag evidence into the intake zone.
                  </p>
                </div>
                <div className={`rounded-[26px] border p-5 md:p-6 ${t.insetSurface}`}>
                  <FileConverterSourcePanel
                    source={source}
                    onSourceChange={setSource}
                    theme={theme}
                    selectedCasePath={selectedCasePath}
                    onSelectedCasePathChange={setSelectedCasePath}
                  />
                </div>
              </motion.section>
            </HolographicEffect>

            <HolographicEffect className="rounded-[32px]" intensity={isPastel ? 0.14 : 0.22}>
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 }}
                className={`overflow-hidden rounded-[32px] border p-6 md:p-8 ${t.panel}`}
              >
                <div className="mb-6 space-y-2">
                  <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Step 2</p>
                  <h2 className={`text-2xl font-bold ${t.heading}`}>Output settings</h2>
                  <p className={`text-sm leading-6 ${t.mutedText}`}>
                    Format options adapt to the selected source category and local engine capabilities.
                  </p>
                </div>
                <div className={`rounded-[26px] border p-5 md:p-6 ${t.insetSurface}`}>
                  <FileConverterFormatPicker
                    source={source}
                    target={target}
                    availableFormats={availableFormats}
                    onChange={setTarget}
                    theme={theme}
                  />
                </div>

                <div className={`mt-6 rounded-[24px] border p-4 ${t.softInsetSurface}`}>
                  <button
                    type="button"
                    disabled={!canConvert}
                    onClick={() => void handleConvert()}
                    className={`group flex w-full items-center justify-center gap-2 rounded-[22px] px-5 py-4 text-sm font-semibold transition-opacity ${
                      canConvert ? t.button : 'cursor-not-allowed opacity-45 ' + t.button
                    }`}
                  >
                    <span>{isConverting ? 'Converting…' : 'Run conversion'}</span>
                    {!isConverting && (
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    )}
                  </button>
                </div>
              </motion.section>
            </HolographicEffect>
          </div>

          {(progress && isConverting) || (result && source) ? (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`overflow-hidden rounded-[32px] border p-6 md:p-8 ${t.panel}`}
            >
              <div className="mb-5 space-y-2">
                <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>
                  {result ? 'Step 4' : 'Step 3'}
                </p>
                <h2 className={`text-2xl font-bold ${t.heading}`}>
                  {result ? 'Conversion results' : 'Live conversion'}
                </h2>
              </div>

              {progress && isConverting && (
                <div className={`rounded-[26px] border p-5 md:p-6 ${t.insetSurface}`}>
                  <FileConverterProgressPanel
                    progress={progress}
                    onCancel={() => void cancel()}
                    theme={theme}
                  />
                </div>
              )}

              {result && source && !isConverting && (
                <div className={`rounded-[26px] border p-5 md:p-6 ${t.insetSurface}`}>
                  <FileConverterResultsPanel
                    source={source}
                    result={result}
                    theme={theme}
                    onComplete={handleComplete}
                    onExit={onExit}
                  />
                </div>
              )}
            </motion.section>
          ) : null}

          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-[24px] border px-5 py-4 ${t.callout}`}>
            <div className="flex items-center gap-3">
              <ArrowLeft className={`h-4 w-4 ${t.calloutLabel}`} />
              <p className={`text-sm ${t.body}`}>
                {source
                  ? `Ready to convert ${source.fileName} to ${target.format.toUpperCase()}.`
                  : 'Select source evidence to unlock output settings.'}
              </p>
            </div>
            {!isConverting && (
              <button
                type="button"
                onClick={onBack}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium ${t.dialogCancel}`}
              >
                Back to landing
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
