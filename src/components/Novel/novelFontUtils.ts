/** Curated stacks that ship well without relying on a specific OS install. */
export const NOVEL_FONT_PRESETS = [
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Crimson Pro', value: '"Crimson Pro", Georgia, serif' },
  { label: 'Lora', value: 'Lora, Georgia, serif' },
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'System UI', value: 'system-ui, -apple-system, sans-serif' },
] as const;

export function formatFontFamilyCss(fontFamily: string): string {
  const trimmed = fontFamily.trim();
  if (!trimmed) return 'Georgia, serif';
  if (trimmed.includes(',')) return trimmed;

  const quoted = trimmed.includes(' ') || trimmed.includes('-') ? `"${trimmed}"` : trimmed;
  return `${quoted}, sans-serif`;
}

export function getFontDisplayLabel(fontFamily: string): string {
  const trimmed = fontFamily.trim();
  if (!trimmed) return 'Georgia';

  const preset = NOVEL_FONT_PRESETS.find((entry) => entry.value === trimmed);
  if (preset) return preset.label;

  const primary = trimmed.split(',')[0]?.replace(/^['"]|['"]$/g, '').trim();
  return primary || trimmed;
}

export function normalizeFontKey(fontFamily: string): string {
  return getFontDisplayLabel(fontFamily).toLowerCase();
}

export function isPresetFont(fontFamily: string): boolean {
  return NOVEL_FONT_PRESETS.some((entry) => entry.value === fontFamily.trim());
}

export function sanitizeCustomFontInput(raw: string): string {
  return raw.replace(/[<>]/g, '').trim();
}

/** Turn free-typed input into a stored font-family value (single name or full CSS stack). */
export function parseCustomFontInput(raw: string): string | null {
  const cleaned = sanitizeCustomFontInput(raw);
  if (!cleaned) return null;
  if (cleaned.includes(',')) return cleaned;
  return formatFontFamilyCss(cleaned);
}

export function isFontInCatalog(
  fontFamily: string,
  systemFonts: readonly string[]
): boolean {
  const key = normalizeFontKey(fontFamily);
  if (NOVEL_FONT_PRESETS.some((entry) => normalizeFontKey(entry.value) === key)) {
    return true;
  }
  return systemFonts.some((font) => font.toLowerCase() === key);
}

export function getFallbackFonts(): string[] {
  return [
    'Arial',
    'Calibri',
    'Cambria',
    'Consolas',
    'Courier New',
    'Georgia',
    'Segoe UI',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
  ];
}

/** @deprecated Use NOVEL_FONT_PRESETS */
export const NOVEL_FONT_OPTIONS = NOVEL_FONT_PRESETS;
