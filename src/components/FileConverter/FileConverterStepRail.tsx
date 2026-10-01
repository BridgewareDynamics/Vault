import { motion } from 'framer-motion';
import { Check, type LucideIcon } from 'lucide-react';
import { useFileConverterTheme } from './fileConverterTheme';
import { Theme } from '../../types';

export type FileConverterStepId = 'source' | 'output' | 'convert' | 'results';

interface StepDef {
  id: FileConverterStepId;
  label: string;
  icon: LucideIcon;
}

interface FileConverterStepRailProps {
  theme: Theme;
  steps: StepDef[];
  activeStep: FileConverterStepId;
  completedSteps: Set<FileConverterStepId>;
}

export function FileConverterStepRail({
  theme,
  steps,
  activeStep,
  completedSteps,
}: FileConverterStepRailProps) {
  const t = useFileConverterTheme(theme);

  return (
    <div className={`rounded-[26px] border p-3 md:p-4 ${t.softInsetSurface}`}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;
          const isComplete = completedSteps.has(step.id);

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className={`relative rounded-[20px] border px-3 py-3 md:px-4 md:py-3.5 ${
                isActive
                  ? `${t.insetSurface} ring-1 ring-inset ${t.isPastel ? 'ring-purple-300/40' : 'ring-cyber-cyan-400/30'}`
                  : isComplete
                    ? t.compactInsetSurface
                    : t.promptIdle
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isActive || isComplete ? t.button : t.metaBox
                  }`}
                >
                  {isComplete && !isActive ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <Icon className={`h-4 w-4 ${isActive || isComplete ? 'text-white' : t.primary}`} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${t.sectionLabel}`}>
                    Step {index + 1}
                  </p>
                  <p className={`truncate text-sm font-semibold ${t.heading}`}>{step.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
