import { execFile } from 'node:child_process';
import os from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

let cachedFonts: string[] | null = null;

function dedupeSort(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

async function listWindowsFonts(): Promise<string[]> {
  const script = [
    'Add-Type -AssemblyName System.Drawing',
    '[System.Drawing.FontFamily]::GetFamilies() | ForEach-Object { $_.Name }',
  ].join('; ');
  const { stdout } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { timeout: 20_000, maxBuffer: 12 * 1024 * 1024, windowsHide: true }
  );
  return dedupeSort(stdout.split(/\r?\n/));
}

async function listMacFonts(): Promise<string[]> {
  const { stdout } = await execFileAsync(
    'system_profiler',
    ['SPFontsDataType', '-json'],
    { timeout: 45_000, maxBuffer: 24 * 1024 * 1024 }
  );
  const parsed = JSON.parse(stdout) as {
    SPFontsDataType?: Array<{ _items?: Array<{ family?: string; family_name?: string }> }>;
  };
  const names: string[] = [];
  for (const group of parsed.SPFontsDataType ?? []) {
    for (const item of group._items ?? []) {
      if (item.family) names.push(item.family);
      if (item.family_name) names.push(item.family_name);
    }
  }
  if (names.length > 0) return dedupeSort(names);

  const { stdout: fcOut } = await execFileAsync('fc-list', ['--format=%{family}\n'], {
    timeout: 15_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  return dedupeSort(fcOut.split(/\r?\n/));
}

async function listLinuxFonts(): Promise<string[]> {
  const { stdout } = await execFileAsync('fc-list', ['--format=%{family}\n'], {
    timeout: 15_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  const names = stdout.split(/\r?\n/).flatMap((line) => line.split(',').map((part) => part.trim()));
  return dedupeSort(names);
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

export function formatFontFamilyCss(fontFamily: string): string {
  const trimmed = fontFamily.trim();
  if (!trimmed) return 'Georgia, serif';
  if (trimmed.includes(',')) return trimmed;

  const quoted = trimmed.includes(' ') || trimmed.includes('-') ? `"${trimmed}"` : trimmed;
  return `${quoted}, sans-serif`;
}

export async function listSystemFonts(forceRefresh = false): Promise<string[]> {
  if (!forceRefresh && cachedFonts) return cachedFonts;

  let fonts: string[] = [];
  const platform = os.platform();

  try {
    if (platform === 'win32') {
      fonts = await listWindowsFonts();
    } else if (platform === 'darwin') {
      fonts = await listMacFonts();
    } else {
      fonts = await listLinuxFonts();
    }
  } catch {
    fonts = [];
  }

  if (fonts.length === 0) {
    fonts = getFallbackFonts();
  }

  cachedFonts = fonts;
  return fonts;
}
