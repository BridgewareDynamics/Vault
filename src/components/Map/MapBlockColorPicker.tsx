import { useEffect, useMemo, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { Theme } from '../../types';
import { useMapTheme } from './mapTheme';
import {
  getMapBlockSurfaceStyle,
  hexToHsl,
  hslToHex,
  mixHexColors,
  normalizeMapBlockColor,
  resolveMapBlockColor,
} from './mapBlockColors';

interface MapBlockColorPickerProps {
  theme: Theme;
  surfaceColor?: string;
  borderColor?: string;
  legacyColor?: string;
  onSurfaceColorChange: (color?: string) => void;
  onBorderColorChange: (color?: string) => void;
  blockLabel: string;
}

const COLOR_SWATCHES = [
  { name: 'Aurora Mint', value: '#14B8A6' },
  { name: 'Neon Orchid', value: '#A855F7' },
  { name: 'Solar Ember', value: '#F97316' },
  { name: 'Rose Pulse', value: '#EC4899' },
  { name: 'Ocean Beam', value: '#0EA5E9' },
  { name: 'Lime Signal', value: '#84CC16' },
  { name: 'Royal Velvet', value: '#7C3AED' },
  { name: 'Crimson Echo', value: '#DC2626' },
] as const;

const HUE_TRACK =
  'linear-gradient(90deg, #EF4444 0%, #F97316 14%, #EAB308 28%, #22C55E 42%, #06B6D4 56%, #3B82F6 70%, #8B5CF6 84%, #EC4899 100%)';

export function MapBlockColorPicker({
  theme,
  surfaceColor,
  borderColor,
  legacyColor,
  onSurfaceColorChange,
  onBorderColorChange,
  blockLabel,
}: MapBlockColorPickerProps) {
  const t = useMapTheme(theme);
  const [activeTarget, setActiveTarget] = useState<'surface' | 'border'>('surface');
  const resolvedColors = useMemo(
    () => resolveMapBlockColor({ surfaceColor, borderColor, legacyColor }),
    [surfaceColor, borderColor, legacyColor]
  );
  const normalizedSurfaceColor = normalizeMapBlockColor(surfaceColor);
  const normalizedBorderColor = normalizeMapBlockColor(borderColor);
  const currentTargetColor =
    activeTarget === 'surface' ? normalizedSurfaceColor : normalizedBorderColor;
  const selectedColor =
    currentTargetColor ??
    (activeTarget === 'surface' ? normalizedBorderColor : normalizedSurfaceColor) ??
    (t.isPastel ? '#C084FC' : '#22D3EE');
  const currentHsl = useMemo(
    () => hexToHsl(selectedColor) ?? { h: 268, s: 80, l: 62 },
    [selectedColor]
  );
  const [hexInput, setHexInput] = useState(currentTargetColor ?? '');

  useEffect(() => {
    setHexInput(currentTargetColor ?? '');
  }, [currentTargetColor]);

  const setTargetColor = (target: 'surface' | 'border', nextColor?: string) => {
    const normalized = normalizeMapBlockColor(nextColor);
    if (target === activeTarget) {
      setHexInput(normalized ?? '');
    }
    if (target === 'surface') {
      onSurfaceColorChange(normalized);
      return;
    }
    onBorderColorChange(normalized);
  };

  const applyColor = (nextColor?: string) => {
    setTargetColor(activeTarget, nextColor);
  };

  const updateChannel = (patch: Partial<typeof currentHsl>) => {
    applyColor(
      hslToHex(
        patch.h ?? currentHsl.h,
        patch.s ?? currentHsl.s,
        patch.l ?? currentHsl.l
      )
    );
  };

  const saturationTrack = `linear-gradient(90deg, ${hslToHex(currentHsl.h, 8, currentHsl.l)} 0%, ${hslToHex(currentHsl.h, 100, currentHsl.l)} 100%)`;
  const lightnessTrack = `linear-gradient(90deg, ${hslToHex(currentHsl.h, currentHsl.s, 8)} 0%, ${hslToHex(currentHsl.h, currentHsl.s, 50)} 50%, ${hslToHex(currentHsl.h, currentHsl.s, 92)} 100%)`;
  const previewStyle = getMapBlockSurfaceStyle(
    {
      surfaceColor,
      borderColor,
      legacyColor,
    },
    {
    theme: t.isPastel ? 'pastel' : 'dark',
    selected: true,
    }
  );
  const previewAccent = mixHexColors(
    resolvedColors.accentColor ?? selectedColor,
    '#FFFFFF',
    t.isPastel ? 0.1 : 0.24
  );
  const activeLabel = activeTarget === 'surface' ? 'Card Fill' : 'Border';

  const sliderClass = `w-full h-2 rounded-full appearance-none cursor-pointer ${
    t.isPastel ? 'bg-white/70' : 'bg-white/10'
  }`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${
        t.isPastel
          ? 'border-purple-200/50 bg-gradient-to-br from-white/90 via-pink-50/80 to-purple-50/80'
          : 'border-cyber-purple-500/35 bg-gradient-to-br from-gray-900/95 via-purple-950/25 to-gray-950/95'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-80 blur-3xl"
        style={{
          background: `radial-gradient(circle at top right, ${mixHexColors(selectedColor, '#FFFFFF', 0.5)} 0%, transparent 58%)`,
        }}
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div
            className="relative min-h-[220px] flex-1 overflow-hidden rounded-[28px] border p-5 shadow-2xl"
            style={previewStyle}
          >
            <div
              className="absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl"
              style={{ backgroundColor: `${previewAccent}66` }}
            />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
                    Color Studio
                  </div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/75">Live Preview</p>
                  <h4 className="mt-2 text-2xl font-bold text-white">{blockLabel}</h4>
                </div>
                <div className="rounded-2xl border border-white/20 bg-black/15 px-3 py-2 text-right backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/65">Hex</p>
                  <p className="text-sm font-semibold text-white">{selectedColor}</p>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-white/85 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-black/15 px-4 py-3 backdrop-blur-md">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Card Fill</p>
                  <p className="mt-1 font-semibold">{resolvedColors.surfaceColor ?? 'Theme default'}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/15 px-4 py-3 backdrop-blur-md">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Border</p>
                  <p className="mt-1 font-semibold">{resolvedColors.borderColor ?? 'Theme default'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:max-w-[320px]">
            <div
              className={`rounded-[28px] border p-4 shadow-xl ${
                t.isPastel
                  ? 'border-white/70 bg-white/75 text-gray-800'
                  : 'border-white/10 bg-black/25 text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">
                    Customize Target
                  </p>
                  <p className="mt-1 text-sm font-medium">Choose whether you are styling the card fill or its border.</p>
                </div>
                <div
                  className="h-14 w-14 rounded-2xl border border-white/25 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${mixHexColors(selectedColor, '#FFFFFF', 0.55)} 0%, ${selectedColor} 100%)` }}
                  aria-hidden="true"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {([
                  { id: 'surface', label: 'Card Fill', value: resolvedColors.surfaceColor },
                  { id: 'border', label: 'Border', value: resolvedColors.borderColor },
                ] as const).map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => setActiveTarget(target.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                      activeTarget === target.id
                        ? t.isPastel
                          ? 'border-purple-400 bg-purple-50/90 text-gray-900'
                          : 'border-cyber-cyan-400/60 bg-cyber-cyan-500/10 text-white'
                        : t.isPastel
                          ? 'border-purple-200/60 bg-white/85 text-gray-700'
                          : 'border-white/10 bg-gray-950/60 text-gray-200'
                    }`}
                    aria-label={`Edit ${target.label}`}
                  >
                    <span className="block text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                      {target.label}
                    </span>
                    <span className="mt-1 block text-sm font-semibold">
                      {target.value ?? 'Theme default'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                    {activeLabel} Hex
                  </span>
                  <input
                    type="text"
                    value={hexInput}
                    onChange={(event) => {
                      const nextValue = event.target.value.toUpperCase();
                      setHexInput(nextValue);
                      const normalized = normalizeMapBlockColor(nextValue);
                      if (normalized || nextValue.trim() === '') {
                        setTargetColor(activeTarget, normalized);
                      }
                    }}
                    placeholder="#7C3AED"
                    className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium tracking-[0.18em] uppercase ${
                      t.isPastel
                        ? 'border-purple-200/60 bg-white/90 text-gray-800'
                        : 'border-white/10 bg-gray-950/70 text-white'
                    }`}
                    aria-label="Block color hex value"
                  />
                </label>

                <label
                  className={`relative inline-flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    t.isPastel
                      ? 'border-purple-200/60 bg-white/85 text-purple-600 hover:bg-white'
                      : 'border-white/10 bg-gray-950/70 text-cyber-cyan-300 hover:bg-gray-900'
                  }`}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Wheel
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(event) => applyColor(event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Open native color wheel"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => applyColor(undefined)}
                className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                  t.isPastel
                    ? 'border-pink-200/60 bg-pink-50/80 text-gray-700 hover:bg-pink-50'
                    : 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                }`}
              >
                Use theme default {activeTarget === 'surface' ? 'card fill' : 'border'}
              </button>

              {activeTarget === 'border' && normalizedSurfaceColor && (
                <button
                  type="button"
                  onClick={() => setTargetColor('border', normalizedSurfaceColor)}
                  className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                    t.isPastel
                      ? 'border-purple-200/60 bg-white/85 text-gray-700 hover:bg-white'
                      : 'border-white/10 bg-gray-950/70 text-gray-200 hover:bg-gray-900'
                  }`}
                >
                  Match border to card fill
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COLOR_SWATCHES.map((swatch) => {
            const isSelected = currentTargetColor === swatch.value;
            return (
              <button
                key={swatch.value}
                type="button"
                onClick={() => applyColor(swatch.value)}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5 ${
                  isSelected
                    ? t.isPastel
                      ? 'border-purple-400 shadow-lg shadow-purple-200/70'
                      : 'border-cyber-cyan-400/60 shadow-lg shadow-cyber-cyan-500/20'
                    : t.isPastel
                      ? 'border-purple-200/50'
                      : 'border-white/10'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${mixHexColors(swatch.value, '#FFFFFF', 0.74)} 0%, ${mixHexColors(swatch.value, '#FFFFFF', 0.42)} 54%, ${swatch.value} 100%)`,
                }}
                aria-label={`Choose ${swatch.name} for ${activeLabel.toLowerCase()}`}
              >
                <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{swatch.name}</p>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-700/80">
                      {swatch.value}
                    </p>
                  </div>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-white/40 text-gray-900 shadow-sm">
                    {isSelected ? <Check className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            t.isPastel
              ? 'border-purple-200/50 bg-white/75'
              : 'border-white/10 bg-black/20'
          }`}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                {activeLabel} Hue
              </span>
              <input
                type="range"
                min={0}
                max={360}
                value={currentHsl.h}
                onChange={(event) => updateChannel({ h: Number(event.target.value) })}
                className={sliderClass}
                style={{ background: HUE_TRACK }}
                aria-label="Adjust color hue"
              />
              <span className={`mt-2 block text-xs ${t.muted}`}>{currentHsl.h} deg</span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                {activeLabel} Saturation
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={currentHsl.s}
                onChange={(event) => updateChannel({ s: Number(event.target.value) })}
                className={sliderClass}
                style={{ background: saturationTrack }}
                aria-label="Adjust color saturation"
              />
              <span className={`mt-2 block text-xs ${t.muted}`}>{currentHsl.s}%</span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                {activeLabel} Lightness
              </span>
              <input
                type="range"
                min={10}
                max={90}
                value={currentHsl.l}
                onChange={(event) => updateChannel({ l: Number(event.target.value) })}
                className={sliderClass}
                style={{ background: lightnessTrack }}
                aria-label="Adjust color lightness"
              />
              <span className={`mt-2 block text-xs ${t.muted}`}>{currentHsl.l}%</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
