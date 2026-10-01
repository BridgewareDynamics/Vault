import { execFile } from 'node:child_process';
import os from 'node:os';
import { promisify } from 'node:util';
import { logger } from './logger';
import { cleanWindowsRegistryFontName } from './windowsFontNames';

const execFileAsync = promisify(execFile);

let cachedFonts: string[] | null = null;
let inflightEnumeration: Promise<string[]> | null = null;

const WINDOWS_POWERSHELL_OPTS = {
  timeout: 45_000,
  maxBuffer: 24 * 1024 * 1024,
  windowsHide: true,
} as const;

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

async function runPowerShell(script: string): Promise<string[]> {
  const { stdout } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
    WINDOWS_POWERSHELL_OPTS
  );
  return stdout.split(/\r?\n/);
}

async function listWindowsFontsFromRegistry(): Promise<string[]> {
  const script = [
    '$names = New-Object System.Collections.Generic.List[string]',
    'foreach ($regPath in @(',
    "  'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts',",
    "  'HKCU:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts'",
    ')) {',
    '  if (-not (Test-Path $regPath)) { continue }',
    '  $props = Get-ItemProperty $regPath',
    '  foreach ($prop in $props.PSObject.Properties) {',
    "    if ($prop.Name -match '^PS') { continue }",
    '    [void]$names.Add($prop.Name)',
    '  }',
    '}',
    '$names',
  ].join('\n');

  const lines = await runPowerShell(script);
  const cleaned = lines
    .map((line) => cleanWindowsRegistryFontName(line))
    .filter((name): name is string => Boolean(name));
  return dedupeSort(cleaned);
}

async function listWindowsFontsFromGdi(): Promise<string[]> {
  const script = [
    'Add-Type -AssemblyName System.Drawing',
    '$graphics = [System.Drawing.Graphics]::FromHwnd([IntPtr]::Zero)',
    'try {',
    '  [System.Drawing.FontFamily]::GetFamilies($graphics) | ForEach-Object { $_.Name }',
    '} finally {',
    '  $graphics.Dispose()',
    '}',
  ].join('\n');

  const lines = await runPowerShell(script);
  return dedupeSort(lines);
}

async function listWindowsFonts(): Promise<string[]> {
  const [registryFonts, gdiFonts] = await Promise.allSettled([
    listWindowsFontsFromRegistry(),
    listWindowsFontsFromGdi(),
  ]);

  const merged: string[] = [];

  if (registryFonts.status === 'fulfilled') {
    merged.push(...registryFonts.value);
  } else {
    logger.warn('Windows registry font enumeration failed:', registryFonts.reason);
  }

  if (gdiFonts.status === 'fulfilled') {
    merged.push(...gdiFonts.value);
  } else {
    logger.warn('Windows GDI font enumeration failed:', gdiFonts.reason);
  }

  const result = dedupeSort(merged);
  if (result.length > 0) {
    logger.debug(`Enumerated ${result.length} Windows font families`);
  }
  return result;
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
  if (!forceRefresh && inflightEnumeration) return inflightEnumeration;

  const run = async (): Promise<string[]> => {
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
    } catch (error) {
      logger.warn('System font enumeration failed:', error);
      fonts = [];
    }

    if (fonts.length === 0) {
      logger.warn('Using fallback font list — installed fonts may not appear until enumeration succeeds');
      fonts = getFallbackFonts();
    }

    cachedFonts = fonts;
    return fonts;
  };

  if (forceRefresh) {
    cachedFonts = null;
    inflightEnumeration = null;
  }

  inflightEnumeration = run().finally(() => {
    inflightEnumeration = null;
  });
  return inflightEnumeration;
}

/** @internal Test helper */
export function clearSystemFontCacheForTests(): void {
  cachedFonts = null;
  inflightEnumeration = null;
}
