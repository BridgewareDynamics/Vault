import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { Check, ChevronDown, RefreshCw, Search, Type } from 'lucide-react';
import { Theme } from '../../types';
import { useNovelTheme } from './novelTheme';
import {
  NOVEL_FONT_PRESETS,
  formatFontFamilyCss,
  getFontDisplayLabel,
  normalizeFontKey,
  parseCustomFontInput,
} from './novelFontUtils';
import { useSystemFonts } from './hooks/useSystemFonts';

const FONT_LIST_ROW_HEIGHT = 44;
const FONT_LIST_VIRTUAL_THRESHOLD = 30;
const FONT_LIST_MAX_HEIGHT = 288;

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
  const { fonts: systemFonts, loading, reload } = useSystemFonts();

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

  const customFontCandidate = useMemo(() => {
    const parsed = parseCustomFontInput(query);
    if (!parsed) return null;

    const needle = normalizeFontKey(query);
    const exactPreset = NOVEL_FONT_PRESETS.some(
      (entry) =>
        normalizeFontKey(entry.value) === needle || normalizeFontKey(entry.label) === needle
    );
    const exactSystem = systemFonts.some((font) => font.toLowerCase() === needle);
    if (exactPreset || exactSystem) return null;

    return parsed;
  }, [query, systemFonts]);

  const applyCustomFont = useCallback(
    (raw: string) => {
      const parsed = parseCustomFontInput(raw);
      if (!parsed) return;
      onChange(parsed);
      close();
    },
    [close, onChange]
  );

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

  const renderOption = useCallback((label: string, optionValue: string, previewFamily?: string) => {
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
  }, [close, onChange, optionActive, optionIdle, value]);

  const renderSystemFontRow = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const font = filteredSystemFonts[index];
      if (!font) {
        return null;
      }

      return (
        <div style={{ ...style, paddingRight: 4 }}>
          {renderOption(font, font, formatFontFamilyCss(font))}
        </div>
      );
    },
    [filteredSystemFonts, renderOption],
  );

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
            <div className="relative flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    if (customFontCandidate) {
                      applyCustomFont(query);
                    }
                  }}
                  placeholder="Search or type a font name…"
                  className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none ring-0 ${
                    t.isPastel
                      ? 'border-stone-200/80 bg-white text-stone-900 placeholder:text-stone-400 focus:border-amber-300/80'
                      : 'border-white/10 bg-white/5 text-stone-100 placeholder:text-stone-500 focus:border-purple-400/50'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => void reload(true)}
                disabled={loading}
                className={`shrink-0 rounded-xl border p-2 transition-colors disabled:opacity-50 ${
                  t.isPastel
                    ? 'border-stone-200/80 bg-white text-stone-700 hover:bg-stone-50'
                    : 'border-white/10 bg-white/5 text-stone-200 hover:bg-white/10'
                }`}
                title="Refresh installed fonts"
                aria-label="Refresh installed fonts"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className={`mt-2 text-[11px] leading-snug ${t.isPastel ? 'text-stone-500' : 'text-stone-400'}`}>
              Pick from the list, or type any installed font. Paste a full stack like{' '}
              <span className="font-mono">&quot;My Font&quot;, serif</span>.
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {customFontCandidate && (
              <div className="mb-2">
                <p
                  className={`px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    t.isPastel ? 'text-stone-500' : 'text-stone-400'
                  }`}
                >
                  Custom entry
                </p>
                <button
                  type="button"
                  onClick={() => applyCustomFont(query)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                    normalizeFontKey(customFontCandidate) === normalizeFontKey(value)
                      ? optionActive
                      : optionIdle
                  }`}
                >
                  <span
                    className="min-w-0 flex-1 truncate text-sm"
                    style={{ fontFamily: formatFontFamilyCss(customFontCandidate) }}
                  >
                    Use &ldquo;{getFontDisplayLabel(customFontCandidate)}&rdquo;
                  </span>
                  <Check className="h-4 w-4 shrink-0 opacity-0" aria-hidden />
                </button>
              </div>
            )}

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
                Installed fonts ({filteredSystemFonts.length}
                {!loading && systemFonts.length > 0 ? ` of ${systemFonts.length}` : ''})
              </p>
              {loading && (
                <p className={`px-2 py-3 text-sm ${t.isPastel ? 'text-stone-500' : 'text-stone-400'}`}>
                  Loading installed fonts…
                </p>
              )}
              {!loading && filteredSystemFonts.length === 0 && !customFontCandidate && (
                <p className={`px-2 py-3 text-sm ${t.isPastel ? 'text-stone-500' : 'text-stone-400'}`}>
                  No matching fonts found. Press Enter to use your typed name as a custom font.
                </p>
              )}
              {!loading && filteredSystemFonts.length >= FONT_LIST_VIRTUAL_THRESHOLD && (
                <FixedSizeList
                  height={Math.min(FONT_LIST_MAX_HEIGHT, filteredSystemFonts.length * FONT_LIST_ROW_HEIGHT)}
                  width="100%"
                  itemCount={filteredSystemFonts.length}
                  itemSize={FONT_LIST_ROW_HEIGHT}
                >
                  {renderSystemFontRow}
                </FixedSizeList>
              )}
              {!loading && filteredSystemFonts.length > 0 && filteredSystemFonts.length < FONT_LIST_VIRTUAL_THRESHOLD &&
                filteredSystemFonts.map((font) => renderOption(font, font, formatFontFamilyCss(font)))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
