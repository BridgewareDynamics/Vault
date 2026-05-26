import { MapBlock, MapEdgeAppearance, MapEdgeKind, MapEdgeStyle } from '../../types';
import { mixHexColors, normalizeMapBlockColor, resolveMapBlockColor } from './mapBlockColors';

type MapEdgeTheme = 'pastel' | 'dark';

export interface ResolvedMapEdgeRenderStyle extends Record<string, unknown> {
  strokeColor: string;
  glowColor: string;
  gradientStartColor?: string;
  gradientEndColor?: string;
  gradientMode: 'none' | 'linked-blocks';
}

const THEME_EDGE_PALETTES = {
  chronology: {
    solid: {
      strokeColor: '#A78BFA',
      glowColor: '#C084FC',
    },
    dotted: {
      strokeColor: '#67E8F9',
      glowColor: '#22D3EE',
    },
  },
  branch: {
    solid: {
      strokeColor: '#F59E0B',
      glowColor: '#FBBF24',
    },
    dotted: {
      strokeColor: '#F59E0B',
      glowColor: '#FBBF24',
    },
  },
} as const;

function getThemePalette(kind: MapEdgeKind, style: MapEdgeStyle, theme: MapEdgeTheme) {
  const palette = kind === 'branch' ? THEME_EDGE_PALETTES.branch[style] : THEME_EDGE_PALETTES.chronology[style];
  if (theme === 'pastel') {
    return {
      strokeColor: mixHexColors(palette.strokeColor, '#FFFFFF', 0.12),
      glowColor: mixHexColors(palette.glowColor, '#FFFFFF', 0.22),
    };
  }

  return palette;
}

function getBlockAccentColor(block: MapBlock | undefined, fallback: string): string {
  if (!block) {
    return fallback;
  }

  return (
    resolveMapBlockColor({
      surfaceColor: block.surfaceColor,
      borderColor: block.borderColor,
      legacyColor: block.color,
    }).accentColor ?? fallback
  );
}

export function normalizeMapEdgeAppearance(
  appearance?: Partial<MapEdgeAppearance> | null
): MapEdgeAppearance {
  const colorMode =
    appearance?.colorMode === 'custom' || appearance?.colorMode === 'linked-blocks'
      ? appearance.colorMode
      : 'theme';

  return {
    colorMode,
    strokeColor: normalizeMapBlockColor(appearance?.strokeColor),
    glowColor: normalizeMapBlockColor(appearance?.glowColor),
  };
}

export function getMapEdgeAppearanceLabel(appearance?: Partial<MapEdgeAppearance> | null): string {
  const normalized = normalizeMapEdgeAppearance(appearance);
  if (normalized.colorMode === 'linked-blocks') {
    return 'Linked to block gradients';
  }
  if (normalized.colorMode === 'custom') {
    return 'Custom connector palette';
  }
  return 'Theme connector palette';
}

export function resolveMapEdgeRenderStyle(options: {
  appearance?: Partial<MapEdgeAppearance> | null;
  sourceBlock?: MapBlock;
  targetBlock?: MapBlock;
  kind: MapEdgeKind;
  style: MapEdgeStyle;
  theme: MapEdgeTheme;
}): ResolvedMapEdgeRenderStyle {
  const appearance = normalizeMapEdgeAppearance(options.appearance);
  const themePalette = getThemePalette(options.kind, options.style, options.theme);

  if (appearance.colorMode === 'linked-blocks') {
    const startColor = getBlockAccentColor(options.sourceBlock, themePalette.strokeColor);
    const endColor = getBlockAccentColor(options.targetBlock, themePalette.glowColor);
    const glowBase = mixHexColors(startColor, endColor, 0.5);

    return {
      strokeColor: startColor,
      glowColor:
        options.theme === 'pastel'
          ? mixHexColors(glowBase, '#FFFFFF', 0.18)
          : mixHexColors(glowBase, '#111827', 0.12),
      gradientStartColor: startColor,
      gradientEndColor: endColor,
      gradientMode: startColor === endColor ? 'none' : 'linked-blocks',
    };
  }

  if (appearance.colorMode === 'custom') {
    const strokeColor = appearance.strokeColor ?? themePalette.strokeColor;
    const glowColor =
      appearance.glowColor ??
      (options.theme === 'pastel'
        ? mixHexColors(strokeColor, '#FFFFFF', 0.28)
        : mixHexColors(strokeColor, '#111827', 0.18));

    return {
      strokeColor,
      glowColor,
      gradientMode: 'none',
    };
  }

  return {
    ...themePalette,
    gradientMode: 'none',
  };
}
