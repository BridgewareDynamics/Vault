import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { Theme } from '../../types';
import { useFileConverterTheme } from './fileConverterTheme';

export interface FileConverterSelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

interface FileConverterStyledSelectProps<T extends string> {
  theme: Theme;
  label: string;
  value: T;
  options: FileConverterSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function FileConverterStyledSelect<T extends string>({
  theme,
  label,
  value,
  options,
  onChange,
  ariaLabel,
}: FileConverterStyledSelectProps<T>) {
  const t = useFileConverterTheme(theme);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value) ?? options[0];

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  if (!selected) {
    return null;
  }

  const SelectedIcon = selected.icon;

  return (
    <div ref={rootRef} className="relative">
      <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.22em] ${t.sectionLabel}`}>{label}</p>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel ?? label}
        onClick={() => setOpen((current) => !current)}
        className={`group flex w-full items-center gap-3 rounded-[20px] border px-4 py-3.5 text-left transition-all ${
          open ? `${t.insetSurface} ring-1 ring-inset ${t.isPastel ? 'ring-purple-300/50' : 'ring-cyber-cyan-400/35'}` : t.promptIdle
        }`}
      >
        {SelectedIcon ? (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.button}`}>
            <SelectedIcon className="h-4 w-4 text-white" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${t.heading}`}>{selected.label}</p>
          {selected.description ? (
            <p className={`truncate text-xs ${t.mutedText}`}>{selected.description}</p>
          ) : null}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${t.primary} ${
            open ? 'rotate-180' : 'group-hover:translate-y-0.5'
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel ?? label}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className={`absolute z-20 mt-2 w-full overflow-hidden rounded-[22px] border shadow-2xl ${t.panel}`}
          >
            <div className="max-h-64 overflow-y-auto p-2">
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const Icon = option.icon;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      close();
                    }}
                    className={`mb-1 flex w-full items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition-all last:mb-0 ${
                      isSelected ? `${t.button} shadow-md` : t.promptIdle
                    }`}
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    {Icon ? (
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isSelected ? 'bg-white/20' : t.metaBox
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : t.primary}`} />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${isSelected ? 'text-white' : t.heading}`}>
                        {option.label}
                      </p>
                      {option.description ? (
                        <p className={`truncate text-xs ${isSelected ? 'text-white/85' : t.mutedText}`}>
                          {option.description}
                        </p>
                      ) : null}
                    </div>
                    {isSelected ? <Check className="h-4 w-4 shrink-0 text-white" /> : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
