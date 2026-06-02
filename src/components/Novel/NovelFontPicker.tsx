import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, Type } from 'lucide-react';
import { Theme } from '../../types';
import { useNovelTheme } from './novelTheme';
import {
  NOVEL_FONT_PRESETS,
  formatFontFamilyCss,
  getFontDisplayLabel,
  normalizeFontKey,
} from './novelFontUtils';
import { useSystemFonts } from './hooks/useSystemFonts';

interface NovelFontPickerProps {
  theme: Theme;
  value: string;
  onChange: (fontFamily: string) => void;
}

export function NovelFontPicker({ theme, value, onChange }: NovelFontPickerProps) {
  const t = useNovelTheme(theme);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { fonts: systemFonts, loading } = useSystemFonts();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  const presetKeys = useMemo(
    () => new Set(NOVEL_FONT_PRESETS.map((entry) => normalizeFontKey(entry.value))),
    []
  );

  const filteredSystemFonts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return systemFonts.filter((font) => {
      if (presetKeys.has(font.toLowerCase())) return false;
      if (!needle) return true;
      return font.toLowerCase().includes(needle);
    });
  }, [presetKeys, query, systemFonts]);

  const filteredPresets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return NOVEL_FONT_PRESETS;
    return NOVEL_FONT_PRESETS.filter(
      (entry) =>
        entry.label.toLowerCase().includes(needle) ||
        entry.value.toLowerCase().includes(needle)
    );
  }, [query]);

  const displayLabel = getFontDisplayLabel(value);
  const previewCss = formatFontFamilyCss(value);

  const panelSurface = t.isPastel
    ? 'border-stone-200/80 bg-white/95 text-stone-900 shadow-[0_16px_40px_rgba(60,45,30,0.14)] backdrop-blur-md'
    : 'border-white/10 bg-[#14121a]/95 text-stone-100 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md';

  const triggerSurface = t.isPastel
    ? 'border-stone-200/80 bg-white/70 hover:bg-white/90 text-stone-800'
    : 'border-white/10 bg-white/5 hover:bg-white/10 text-stone-100';

  const optionIdle = t.isPastel
    ? 'border-transparent hover:border-stone-200/80 hover:bg-stone-50/90 text-stone-800'
    : 'border-transparent hover:border-white/10 hover:bg-white/5 text-stone-100';

  const optionActive = t.isPastel
    ? 'border-amber-300/70 bg-amber-50/90 text-stone-900 shadow-sm'
    : 'border-purple-400/40 bg-purple-500/20 text-white shadow-sm';

  const renderOption = (label: string, optionValue: string, previewFamily?: string) => {
    const selected =
      optionValue === value ||
      normalizeFontKey(optionValue) === normalizeFontKey(value);
    return (
      <button
        key={optionValue}
        type="button"
        role="option"
        aria-selected={selected}
        onClick={() => {
          onChange(optionValue);
          close();
        }}
        className={`mb-1 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all last:mb-0 ${
          selected ? optionActive : optionIdle
        }`}
      >
        <span
          className="min-w-0 flex-1 truncate text-sm"
          style={{ fontFamily: previewFamily ?? formatFontFamilyCss(optionValue) }}
        >
          {label}
        </span>
        {selected ? <Check className="h-4 w-4 shrink-0 opacity-80" /> : null}
      </button>
    );
  };

  return (
    <div ref={rootRef} className="relative min-w-[11rem]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${triggerSurface}`}
      >
        <Type className="h-4 w-4 shrink-0 opacity-70" />
        <span className="min-w-0 flex-1 truncate text-left" style={{ fontFamily: previewCss }}>
          {displayLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Font family"
          className={`absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border ${panelSurface}`}
        >
          <div
            className={`border-b px-3 py-2.5 ${t.isPastel ? 'border-stone-200/70 bg-stone-50/80' : 'border-white/10 bg-black/20'}`}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search fonts…"
                className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none ring-0 ${
                  t.isPastel
                    ? 'border-stone-200/80 bg-white text-stone-900 placeholder:text-stone-400 focus:border-amber-300/80'
                    : 'border-white/10 bg-white/5 text-stone-100 placeholder:text-stone-500 focus:border-purple-400/50'
                }`}
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {filteredPresets.length > 0 && (
              <div className="mb-2">
                <p
                  className={`px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    t.isPastel ? 'text-stone-500' : 'text-stone-400'
                  }`}
                >
                  Book presets
                </p>
                {filteredPresets.map((entry) => renderOption(entry.label, entry.value))}
              </div>
            )}

            <div>
              <p
                className={`px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  t.isPastel ? 'text-stone-500' : 'text-stone-400'
                }`}
              >
                System fonts
              </p>
              {loading && (
                <p className={`px-2 py-3 text-sm ${t.isPastel ? 'text-stone-500' : 'text-stone-400'}`}>
                  Loading installed fonts…
                </p>
              )}
              {!loading && filteredSystemFonts.length === 0 && (
                <p className={`px-2 py-3 text-sm ${t.isPastel ? 'text-stone-500' : 'text-stone-400'}`}>
                  No matching fonts found.
                </p>
              )}
              {!loading &&
                filteredSystemFonts.map((font) => renderOption(font, font, formatFontFamilyCss(font)))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
