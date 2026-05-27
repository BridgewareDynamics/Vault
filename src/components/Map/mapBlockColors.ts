import { isPastelPalette } from '../../theme/themeSemantics';
import type { CSSProperties } from 'react';

const HEX_COLOR_REGEX = /^#?[0-9a-fA-F]{6}$/;

export interface MapBlockHslColor {
  h: number;
  s: number;
  l: number;
}

export interface MapBlockColorConfig {
  surfaceColor?: string;
  borderColor?: string;
  legacyColor?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeMapBlockColor(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return undefined;
  }

  const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return normalized.toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeMapBlockColor(hex);
  if (!normalized) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

export function hexToHsl(hex: string): MapBlockHslColor | null {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }

  const red = rgb.r / 255;
  const green = rgb.g / 255;
  const blue = rgb.b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(lightness * 100) };
  }

  const saturation =
    delta / (1 - Math.abs(2 * lightness - 1));

  let hue = 0;
  if (max === red) {
    hue = ((green - blue) / delta) % 6;
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return {
    h: Math.round((hue * 60 + 360) % 360),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = lightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = chroma;
    green = x;
  } else if (hue < 120) {
    red = x;
    green = chroma;
  } else if (hue < 180) {
    green = chroma;
    blue = x;
  } else if (hue < 240) {
    green = x;
    blue = chroma;
  } else if (hue < 300) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return rgbToHex((red + match) * 255, (green + match) * 255, (blue + match) * 255);
}

export function mixHexColors(colorA: string, colorB: string, weight = 0.5): string {
  const first = hexToRgb(colorA);
  const second = hexToRgb(colorB);
  if (!first || !second) {
    return normalizeMapBlockColor(colorA) ?? normalizeMapBlockColor(colorB) ?? '#8B5CF6';
  }

  const amount = clamp(weight, 0, 1);
  return rgbToHex(
    first.r + (second.r - first.r) * amount,
    first.g + (second.g - first.g) * amount,
    first.b + (second.b - first.b) * amount
  );
}

export function withHexAlpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return `rgba(139, 92, 246, ${clamp(alpha, 0, 1)})`;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
}

export function resolveMapBlockColor(config: MapBlockColorConfig): {
  surfaceColor?: string;
  borderColor?: string;
  accentColor?: string;
} {
  const legacyColor = normalizeMapBlockColor(config.legacyColor);
  const surfaceColor = normalizeMapBlockColor(config.surfaceColor) ?? legacyColor;
  const borderColor = normalizeMapBlockColor(config.borderColor) ?? legacyColor;
  const accentColor = borderColor ?? surfaceColor ?? legacyColor;

  return {
    surfaceColor,
    borderColor,
    accentColor,
  };
}

export function getMapBlockMinimapColor(config: MapBlockColorConfig, theme: 'pastel' | 'dark'): string {
  const normalized = resolveMapBlockColor(config).surfaceColor;
  if (!normalized) {
    return isPastelPalette(theme) ? '#C4B5FD' : '#8B5CF6';
  }

  return isPastelPalette(theme) ? mixHexColors(normalized, '#FFFFFF', 0.18) : mixHexColors(normalized, '#111827', 0.12);
}

export function getMapBlockSurfaceStyle(
  config: MapBlockColorConfig,
  options: {
    theme: 'pastel' | 'dark';
    selected?: boolean;
  }
): CSSProperties | undefined {
  const { surfaceColor, borderColor, accentColor } = resolveMapBlockColor(config);
  if (!surfaceColor && !borderColor && !accentColor) {
    return undefined;
  }

  const isPastel = isPastelPalette(options.theme);
  const baseColor = surfaceColor ?? accentColor ?? borderColor;
  const edgeColor = borderColor ?? accentColor ?? surfaceColor;
  if (!baseColor || !edgeColor) {
    return undefined;
  }

  const topGlow = isPastel
    ? mixHexColors(baseColor, '#FFFFFF', 0.7)
    : mixHexColors(baseColor, '#1F2937', 0.45);
  const base = isPastel
    ? mixHexColors(baseColor, '#FFFFFF', 0.82)
    : mixHexColors(baseColor, '#0F172A', 0.52);
  const deep = isPastel
    ? mixHexColors(baseColor, '#E9D5FF', 0.4)
    : mixHexColors(baseColor, '#020617', 0.65);
  const border = options.selected
    ? mixHexColors(edgeColor, '#FFFFFF', isPastel ? 0.18 : 0.12)
    : mixHexColors(edgeColor, isPastel ? '#F5D0FE' : '#111827', isPastel ? 0.12 : 0.22);
  const glow = withHexAlpha(edgeColor, options.selected ? (isPastel ? 0.34 : 0.42) : isPastel ? 0.18 : 0.24);

  return {
    backgroundImage: `radial-gradient(circle at top right, ${withHexAlpha(topGlow, isPastel ? 0.7 : 0.36)} 0%, transparent 42%), linear-gradient(145deg, ${base} 0%, ${deep} 100%)`,
    borderColor: border,
    boxShadow: options.selected
      ? `0 0 0 2px ${glow}, 0 24px 60px -22px ${withHexAlpha(edgeColor, 0.55)}`
      : `0 18px 40px -26px ${glow}`,
  };
}
