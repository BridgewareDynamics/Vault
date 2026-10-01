import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Theme } from '../../types';
import { useNovelTheme } from './novelTheme';

const FONT_SIZES = [10, 11, 12, 14, 16, 18, 24] as const;

interface NovelFontSizePickerProps {
  theme: Theme;
  value: number;
  onChange: (size: number) => void;
}

export function NovelFontSizePicker({ theme, value, onChange }: NovelFontSizePickerProps) {
  const t = useNovelTheme(theme);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  const triggerSurface = t.isPastel
    ? 'border-stone-200/80 bg-white/70 hover:bg-white/90 text-stone-800'
    : 'border-white/10 bg-white/5 hover:bg-white/10 text-stone-100';

  const panelSurface = t.isPastel
    ? 'border-stone-200/80 bg-white/95 text-stone-900 shadow-[0_12px_32px_rgba(60,45,30,0.12)] backdrop-blur-md'
    : 'border-white/10 bg-[#14121a]/95 text-stone-100 shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-md';

  const optionIdle = t.isPastel
    ? 'hover:bg-stone-50/90 text-stone-800'
    : 'hover:bg-white/5 text-stone-100';

  const optionActive = t.isPastel
    ? 'bg-amber-50/90 text-stone-900'
    : 'bg-purple-500/20 text-white';

  return (
    <div ref={rootRef} className="relative min-w-[5.5rem]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${triggerSurface}`}
      >
        <span>{value} pt</span>
        <ChevronDown className={`h-4 w-4 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Font size"
          className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-full overflow-hidden rounded-2xl border p-1.5 ${panelSurface}`}
        >
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              role="option"
              aria-selected={size === value}
              onClick={() => {
                onChange(size);
                close();
              }}
              className={`flex w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                size === value ? optionActive : optionIdle
              }`}
            >
              {size} pt
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
