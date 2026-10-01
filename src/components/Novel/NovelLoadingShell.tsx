import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';

interface NovelLoadingShellProps {
  theme: Theme;
  onClose?: () => void;
}

export function NovelLoadingShell({ theme }: NovelLoadingShellProps) {
  const isPastel = isLightTheme(theme);
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        isPastel ? 'bg-slate-50 text-gray-800' : 'bg-gray-950 text-white'
      }`}
    >
      <p className="text-white/70">Loading Novel...</p>
    </div>
  );
}
