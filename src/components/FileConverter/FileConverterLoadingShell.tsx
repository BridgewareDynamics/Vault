import { Theme } from '../../types';
import { useSettingsContext } from '../../utils/settingsContext';
import { HexGrid } from '../Shared/HexGrid';
import { ScanLine } from '../Shared/ScanLine';
import { Loader2, Home } from 'lucide-react';
import { useFileConverterTheme } from './fileConverterTheme';

interface FileConverterLoadingShellProps {
  onClose: () => void;
  theme?: Theme;
}

export function FileConverterLoadingShell({ onClose, theme: themeProp }: FileConverterLoadingShellProps) {
  const { settings } = useSettingsContext();
  const theme: Theme = themeProp ?? (settings?.theme as Theme) ?? 'brideware-purple';
  const t = useFileConverterTheme(theme);

  return (
    <div className={`relative min-h-screen overflow-hidden ${t.bg}`}>
      <HexGrid theme={theme} density={20} />
      <ScanLine theme={theme} speed={12} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute left-1/3 top-24 h-64 w-64 rounded-full blur-3xl ${t.heroGlowPrimary}`} />
        <div className={`absolute bottom-24 right-1/3 h-72 w-72 rounded-full blur-3xl ${t.heroGlowSecondary}`} />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className={`relative w-full max-w-md overflow-hidden rounded-[32px] border p-8 text-center shadow-2xl ${t.dialogShellLarge}`}>
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-4 top-4 inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${t.dialogCancel}`}
          >
            <Home className="h-4 w-4" />
            Home
          </button>
          <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${t.button}`}>
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
          <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>Vault Engine</p>
          <h2 className={`mt-2 text-2xl font-bold ${t.heading}`}>Loading File Converter</h2>
          <p className={`mt-3 text-sm leading-6 ${t.mutedText}`}>
            Preparing the conversion studio and format engine…
          </p>
        </div>
      </div>
    </div>
  );
}
