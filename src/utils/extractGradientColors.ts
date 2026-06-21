/** Pull rgba() stops from a CSS gradient string for ambient glow palettes. */
export function extractGradientColors(gradient: string): string[] {
  const matches = gradient.match(/rgba\([^)]+\)/g);
  if (matches && matches.length > 0) {
    return matches;
  }
  return ['rgba(139, 92, 246, 0.55)', 'rgba(34, 211, 238, 0.45)'];
}

/** Lower rgba alpha for softer borders and blobs. */
export function softenRgba(color: string, factor = 0.42): string {
  const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!match) {
    return color;
  }
  const alpha = Math.min(1, parseFloat(match[4]) * factor);
  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha.toFixed(3)})`;
}

export function buildSoftBorderGradient(colors: string[]): string {
  const softened = colors.map((c) => softenRgba(c, 0.38));
  if (softened.length === 1) {
    return `linear-gradient(135deg, ${softened[0]}, ${softenRgba(softened[0], 0.7)})`;
  }
  return `linear-gradient(135deg, ${softened.join(', ')})`;
}
