import { Image as ImageIcon } from 'lucide-react';
import { useNovelTheme } from './novelTheme';
import { Theme } from '../../types';
import { NovelFontPicker } from './NovelFontPicker';
import { NovelFontSizePicker } from './NovelFontSizePicker';

interface NovelRichTextToolbarProps {
  theme: Theme;
  fontFamily: string;
  fontSize: number;
  showPageNumbers: boolean;
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onTogglePageNumbers: () => void;
  onFormatCommand: (command: string, value?: string) => void;
  onInsertImage?: () => void;
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
  onInsertImage,
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
      {onInsertImage && (
        <>
          <button
            type="button"
            className={`${btn} inline-flex items-center gap-1.5`}
            onClick={onInsertImage}
            title="Insert image on active page"
          >
            <ImageIcon className="h-4 w-4" />
            Image
          </button>
          <div className={`hidden h-5 w-px sm:block ${t.isPastel ? 'bg-stone-300/60' : 'bg-white/10'}`} />
        </>
      )}
      <NovelFontPicker theme={theme} value={fontFamily} onChange={onFontFamilyChange} />
      <NovelFontSizePicker theme={theme} value={fontSize} onChange={onFontSizeChange} />
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

export { NOVEL_FONT_PRESETS } from './novelFontUtils';
