import { useNovelTheme } from './novelTheme';
import { Theme } from '../../types';

const NOVEL_FONT_OPTIONS = [
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Crimson Pro', value: '"Crimson Pro", Georgia, serif' },
  { label: 'Lora', value: 'Lora, Georgia, serif' },
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'System UI', value: 'system-ui, -apple-system, sans-serif' },
];

interface NovelRichTextToolbarProps {
  theme: Theme;
  fontFamily: string;
  fontSize: number;
  showPageNumbers: boolean;
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onTogglePageNumbers: () => void;
  onFormatCommand: (command: string, value?: string) => void;
  className?: string;
}

export function NovelRichTextToolbar({
  theme,
  fontFamily,
  fontSize,
  showPageNumbers,
  onFontFamilyChange,
  onFontSizeChange,
  onTogglePageNumbers,
  onFormatCommand,
  className = '',
}: NovelRichTextToolbarProps) {
  const t = useNovelTheme(theme);
  const btn = `rounded-lg border px-3 py-1.5 text-sm transition-colors ${t.badgeNeutral} hover:opacity-90`;
  const btnActive = `rounded-lg border px-3 py-1.5 text-sm ${t.button}`;

  return (
    <div className={`flex flex-wrap items-center gap-2 border-b px-4 py-2 ${t.dialogFooter} ${className}`}>
      <div className="flex items-center gap-1">
        <button type="button" className={`${btn} font-bold`} onClick={() => onFormatCommand('bold')}>
          B
        </button>
        <button type="button" className={`${btn} italic`} onClick={() => onFormatCommand('italic')}>
          I
        </button>
        <button type="button" className={`${btn} underline`} onClick={() => onFormatCommand('underline')}>
          U
        </button>
      </div>
      <div className={`hidden h-5 w-px sm:block ${t.isPastel ? 'bg-stone-300/60' : 'bg-white/10'}`} />
      <div className="flex items-center gap-1">
        <button type="button" className={btn} onClick={() => onFormatCommand('justifyLeft')}>
          L
        </button>
        <button type="button" className={btn} onClick={() => onFormatCommand('justifyCenter')}>
          C
        </button>
        <button type="button" className={btn} onClick={() => onFormatCommand('justifyRight')}>
          R
        </button>
      </div>
      <div className={`hidden h-5 w-px sm:block ${t.isPastel ? 'bg-stone-300/60' : 'bg-white/10'}`} />
      <select
        value={fontFamily}
        onChange={(e) => onFontFamilyChange(e.target.value)}
        className={`rounded-lg border bg-transparent px-2 py-1.5 text-sm ${t.badgeNeutral}`}
        aria-label="Font family"
      >
        {NOVEL_FONT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        value={fontSize}
        onChange={(e) => onFontSizeChange(Number(e.target.value))}
        className={`rounded-lg border bg-transparent px-2 py-1.5 text-sm ${t.badgeNeutral}`}
        aria-label="Font size"
      >
        {[10, 11, 12, 14, 16, 18, 24].map((size) => (
          <option key={size} value={size}>
            {size} pt
          </option>
        ))}
      </select>
      <button
        type="button"
        className={showPageNumbers ? btnActive : btn}
        onClick={onTogglePageNumbers}
      >
        Page numbers
      </button>
    </div>
  );
}

export { NOVEL_FONT_OPTIONS };
