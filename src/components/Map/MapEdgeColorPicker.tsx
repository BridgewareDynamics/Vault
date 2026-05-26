import { useEffect, useMemo, useState } from 'react';
import { Check, Link2, PaintBucket } from 'lucide-react';
import { MapEdgeAppearance, Theme } from '../../types';
import { useMapTheme } from './mapTheme';
import {
  hexToHsl,
  hslToHex,
  mixHexColors,
  normalizeMapBlockColor,
  withHexAlpha,
} from './mapBlockColors';
import { normalizeMapEdgeAppearance } from './mapEdgeAppearance';

interface MapEdgeColorPickerProps {
  theme: Theme;
  appearance?: Partial<MapEdgeAppearance> | null;
  onChange: (appearance: MapEdgeAppearance) => void;
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

export function MapEdgeColorPicker({ theme, appearance, onChange }: MapEdgeColorPickerProps) {
  const t = useMapTheme(theme);
  const normalizedAppearance = useMemo(
    () => normalizeMapEdgeAppearance(appearance),
    [appearance]
  );
  const [activeTarget, setActiveTarget] = useState<'stroke' | 'glow'>('stroke');
  const fallbackStroke = t.isPastel ? '#8B5CF6' : '#A78BFA';
  const fallbackGlow = t.isPastel ? '#C084FC' : '#67E8F9';
  const targetColor =
    activeTarget === 'stroke'
      ? normalizedAppearance.strokeColor ?? fallbackStroke
      : normalizedAppearance.glowColor ?? fallbackGlow;
  const currentHsl = useMemo(
    () => hexToHsl(targetColor) ?? { h: 268, s: 80, l: 62 },
    [targetColor]
  );
  const [hexInput, setHexInput] = useState(targetColor);

  useEffect(() => {
    setHexInput(targetColor);
  }, [targetColor]);

  const updateAppearance = (patch: Partial<MapEdgeAppearance>) => {
    onChange(
      normalizeMapEdgeAppearance({
        ...normalizedAppearance,
        ...patch,
      })
    );
  };

  const setTargetColor = (target: 'stroke' | 'glow', nextColor?: string) => {
    updateAppearance({
      colorMode: 'custom',
      [target === 'stroke' ? 'strokeColor' : 'glowColor']: normalizeMapBlockColor(nextColor),
    });
  };

  const updateChannel = (patch: Partial<typeof currentHsl>) => {
    setTargetColor(
      activeTarget,
      hslToHex(
        patch.h ?? currentHsl.h,
        patch.s ?? currentHsl.s,
        patch.l ?? currentHsl.l
      )
    );
  };

  const previewStroke =
    normalizedAppearance.colorMode === 'linked-blocks'
      ? 'linear-gradient(90deg, #7C3AED 0%, #14B8A6 100%)'
      : normalizedAppearance.strokeColor ?? fallbackStroke;
  const previewGlow =
    normalizedAppearance.colorMode === 'linked-blocks'
      ? '#8B5CF6'
      : normalizedAppearance.glowColor ?? fallbackGlow;
  const saturationTrack = `linear-gradient(90deg, ${hslToHex(
    currentHsl.h,
    8,
    currentHsl.l
  )} 0%, ${hslToHex(currentHsl.h, 100, currentHsl.l)} 100%)`;
  const lightnessTrack = `linear-gradient(90deg, ${hslToHex(
    currentHsl.h,
    currentHsl.s,
    8
  )} 0%, ${hslToHex(currentHsl.h, currentHsl.s, 50)} 50%, ${hslToHex(
    currentHsl.h,
    currentHsl.s,
    92
  )} 100%)`;
  const sliderClass = `w-full h-2 rounded-full appearance-none cursor-pointer ${
    t.isPastel ? 'bg-white/70' : 'bg-white/10'
  }`;
  const activeLabel = activeTarget === 'stroke' ? 'Line Stroke' : 'Line Glow';
  const helperLabel =
    normalizedAppearance.colorMode === 'linked-blocks'
      ? 'Block-linked gradients are active. Editing a color detaches into custom mode.'
      : normalizedAppearance.colorMode === 'custom'
        ? 'Custom colors override the default connector palette.'
        : 'Theme mode keeps the original connector palette.';
  const panelClass = t.isPastel
    ? 'border-purple-200/50 bg-white/80 text-gray-800'
    : 'border-white/10 bg-black/20 text-white';
  const modeButtonClass = (isActive: boolean) =>
    `rounded-2xl border px-3 py-3 text-left transition-colors ${
      isActive
        ? t.isPastel
          ? 'border-purple-400 bg-purple-50/90 text-gray-900'
          : 'border-cyber-cyan-400/60 bg-cyber-cyan-500/10 text-white'
        : t.isPastel
          ? 'border-purple-200/60 bg-white/85 text-gray-700 hover:bg-white'
          : 'border-white/10 bg-gray-950/60 text-gray-200 hover:bg-gray-900'
    }`;
  const targetButtonClass = (isActive: boolean) =>
    `rounded-2xl border px-3 py-3 text-left transition-colors ${
      isActive
        ? t.isPastel
          ? 'border-purple-400 bg-purple-50/90 text-gray-900'
          : 'border-cyber-cyan-400/60 bg-cyber-cyan-500/10 text-white'
        : t.isPastel
          ? 'border-purple-200/60 bg-white/85 text-gray-700'
          : 'border-white/10 bg-gray-950/60 text-gray-200'
    }`;

  return (
    <div
      className={`relative max-w-full overflow-hidden rounded-[22px] border p-3 ${
        t.isPastel
          ? 'border-purple-200/60 bg-gradient-to-br from-white/95 via-pink-50/90 to-purple-50/90'
          : 'border-cyber-purple-500/35 bg-gradient-to-br from-gray-950/95 via-purple-950/20 to-gray-900/95'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-60 blur-2xl"
        style={{
          background: `radial-gradient(circle at top right, ${withHexAlpha(
            normalizedAppearance.glowColor ?? fallbackGlow,
            0.34
          )} 0%, transparent 62%)`,
        }}
      />

      <div className="relative flex max-w-full flex-col gap-3">
        <div className={`overflow-hidden rounded-[20px] border p-3 shadow-xl ${panelClass}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">
                Connector Preview
              </div>
              <p className={`mt-1 text-xs leading-5 ${t.muted}`}>{helperLabel}</p>
            </div>

            <div
              className={`shrink-0 rounded-2xl border px-3 py-2 text-right ${
                t.isPastel ? 'border-purple-200/60 bg-white/85' : 'border-white/10 bg-gray-950/70'
              }`}
            >
              <p className={`text-[10px] uppercase tracking-[0.2em] ${t.muted}`}>Mode</p>
              <p className="mt-1 text-sm font-semibold">
                {normalizedAppearance.colorMode === 'linked-blocks'
                  ? 'Link to block'
                  : normalizedAppearance.colorMode === 'custom'
                    ? 'Custom'
                    : 'Theme'}
              </p>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-[18px] border border-white/10 px-3 py-3">
            <div
              className="relative h-3 overflow-hidden rounded-full"
              style={{
                background: t.isPastel ? 'rgba(148, 163, 184, 0.14)' : 'rgba(15, 23, 42, 0.72)',
                boxShadow: `0 0 18px ${withHexAlpha(previewGlow, 0.22)}`,
              }}
            >
              <div
                className="absolute inset-y-0 left-0 right-0 rounded-full"
                style={{
                  background:
                    normalizedAppearance.colorMode === 'linked-blocks' ? previewStroke : undefined,
                  backgroundColor:
                    normalizedAppearance.colorMode === 'linked-blocks' ? undefined : (previewStroke as string),
                  boxShadow: `0 0 14px ${withHexAlpha(previewGlow, 0.32)}`,
                }}
              />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className={`min-w-0 rounded-2xl border px-3 py-2 ${panelClass}`}>
                <p className={`text-[10px] uppercase tracking-[0.18em] ${t.muted}`}>Stroke</p>
                <p className="mt-1 truncate text-sm font-semibold">{normalizedAppearance.strokeColor ?? 'Theme'}</p>
              </div>
              <div className={`min-w-0 rounded-2xl border px-3 py-2 ${panelClass}`}>
                <p className={`text-[10px] uppercase tracking-[0.18em] ${t.muted}`}>Glow</p>
                <p className="mt-1 truncate text-sm font-semibold">{normalizedAppearance.glowColor ?? 'Theme'}</p>
              </div>
              <div className={`min-w-0 rounded-2xl border px-3 py-2 ${panelClass}`}>
                <p className={`text-[10px] uppercase tracking-[0.18em] ${t.muted}`}>Behavior</p>
                <p className="mt-1 truncate text-sm font-semibold">
                  {normalizedAppearance.colorMode === 'linked-blocks'
                    ? 'Block gradient'
                    : normalizedAppearance.colorMode === 'custom'
                      ? 'Static palette'
                      : 'Default map theme'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
          <div className={`overflow-hidden rounded-[20px] border p-3 shadow-xl ${panelClass}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">Mode</p>
                <p className={`mt-1 text-xs leading-5 ${t.muted}`}>
                  Choose how connector colors are generated.
                </p>
              </div>
              <PaintBucket className={`h-5 w-5 shrink-0 ${t.primary}`} />
            </div>

            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={() => updateAppearance({ colorMode: 'theme', strokeColor: undefined, glowColor: undefined })}
                className={modeButtonClass(normalizedAppearance.colorMode === 'theme')}
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] opacity-70">Theme</span>
                <span className="mt-1 block text-sm font-semibold">Use the original map palette</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  updateAppearance({
                    colorMode: 'custom',
                    strokeColor: normalizedAppearance.strokeColor,
                    glowColor: normalizedAppearance.glowColor,
                  })
                }
                className={modeButtonClass(normalizedAppearance.colorMode === 'custom')}
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] opacity-70">Custom</span>
                <span className="mt-1 block text-sm font-semibold">Pick your own stroke and glow</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  updateAppearance({
                    colorMode: 'linked-blocks',
                    strokeColor: normalizedAppearance.strokeColor,
                    glowColor: normalizedAppearance.glowColor,
                  })
                }
                className={modeButtonClass(normalizedAppearance.colorMode === 'linked-blocks')}
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                  <Link2 className="h-4 w-4" />
                  Link to block
                </span>
                <span className="mt-1 block text-sm font-semibold">Blend from connected block colors</span>
              </button>
            </div>
          </div>

          <div className={`overflow-hidden rounded-[20px] border p-3 shadow-xl ${panelClass}`}>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">Target</p>
              <p className={`mt-1 text-xs leading-5 ${t.muted}`}>
                Set which part of the connector you are editing, then apply a color.
              </p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {([
                { id: 'stroke', label: 'Line Stroke', value: normalizedAppearance.strokeColor },
                { id: 'glow', label: 'Line Glow', value: normalizedAppearance.glowColor },
              ] as const).map((target) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => setActiveTarget(target.id)}
                  className={targetButtonClass(activeTarget === target.id)}
                >
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                    {target.label}
                  </span>
                  <span className="mt-1 block truncate text-sm font-semibold">
                    {target.value ?? 'Theme driven'}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-2">
              <label className="block min-w-0">
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
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium tracking-[0.16em] uppercase ${
                    t.isPastel
                      ? 'border-purple-200/60 bg-white/90 text-gray-800'
                      : 'border-white/10 bg-gray-950/70 text-white'
                  }`}
                  aria-label="Connector color hex value"
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <button
                  type="button"
                  onClick={() => setTargetColor(activeTarget, undefined)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                    t.isPastel
                      ? 'border-pink-200/60 bg-pink-50/80 text-gray-700 hover:bg-pink-50'
                      : 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                  }`}
                >
                  Use theme default
                </button>

                <label
                  className={`relative inline-flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    t.isPastel
                      ? 'border-purple-200/60 bg-white/85 text-purple-600 hover:bg-white'
                      : 'border-white/10 bg-gray-950/70 text-cyber-cyan-300 hover:bg-gray-900'
                  }`}
                >
                  <PaintBucket className="mr-2 h-4 w-4" />
                  Wheel
                  <input
                    type="color"
                    value={targetColor}
                    onChange={(event) => setTargetColor(activeTarget, event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Open native connector color wheel"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() =>
                  setTargetColor(
                    activeTarget,
                    activeTarget === 'glow'
                      ? normalizedAppearance.strokeColor ?? fallbackStroke
                      : normalizedAppearance.glowColor ?? fallbackGlow
                  )
                }
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                  t.isPastel
                    ? 'border-purple-200/60 bg-white/85 text-gray-700 hover:bg-white'
                    : 'border-white/10 bg-gray-950/70 text-gray-200 hover:bg-gray-900'
                }`}
              >
                {activeTarget === 'glow' ? 'Match glow to stroke' : 'Match stroke to glow'}
              </button>
            </div>
          </div>
        </div>

        <div className={`overflow-hidden rounded-[20px] border p-3 shadow-xl ${panelClass}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">Quick colors</p>
              <p className={`mt-1 text-xs leading-5 ${t.muted}`}>
                Fast presets for the current {activeLabel.toLowerCase()}.
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COLOR_SWATCHES.map((swatch) => {
              const isSelected = targetColor === swatch.value;
              return (
                <button
                  key={swatch.value}
                  type="button"
                  onClick={() => setTargetColor(activeTarget, swatch.value)}
                  className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-transform hover:-translate-y-0.5 ${
                    isSelected
                      ? t.isPastel
                        ? 'border-purple-400 shadow-lg shadow-purple-200/70'
                        : 'border-cyber-cyan-400/60 shadow-lg shadow-cyber-cyan-500/20'
                      : t.isPastel
                        ? 'border-purple-200/50'
                        : 'border-white/10'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${mixHexColors(
                      swatch.value,
                      '#FFFFFF',
                      0.74
                    )} 0%, ${mixHexColors(swatch.value, '#FFFFFF', 0.42)} 54%, ${swatch.value} 100%)`,
                  }}
                  aria-label={`Choose ${swatch.name} for ${activeLabel.toLowerCase()}`}
                >
                  <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{swatch.name}</p>
                      <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-gray-700/80">
                        {swatch.value}
                      </p>
                    </div>
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/40 text-gray-900 shadow-sm">
                      {isSelected ? <Check className="h-4 w-4" /> : <PaintBucket className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`overflow-hidden rounded-[20px] border p-3 shadow-xl ${panelClass}`}>
          <div className="mb-3 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">Fine tune</p>
            <p className={`mt-1 text-xs leading-5 ${t.muted}`}>
              Dial in the exact hue, saturation, and lightness.
            </p>
          </div>

          <div className="grid gap-3">
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
                aria-label="Adjust connector color hue"
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
                aria-label="Adjust connector color saturation"
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
                aria-label="Adjust connector color lightness"
              />
              <span className={`mt-2 block text-xs ${t.muted}`}>{currentHsl.l}%</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
