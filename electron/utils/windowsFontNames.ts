/** Normalize a Windows Fonts registry value name into a display/family label. */
export function cleanWindowsRegistryFontName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (/^PS/.test(trimmed)) return null;
  if (/\.(ttf|otf|ttc|fon|woff|woff2)$/i.test(trimmed)) return null;

  const cleaned = trimmed.replace(/\s+\((TrueType|OpenType|All)\)$/i, '').trim();
  return cleaned || null;
}
