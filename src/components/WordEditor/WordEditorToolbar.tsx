import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline, Undo2, Redo2 } from 'lucide-react';
import { useSettingsContext } from '../../utils/settingsContext';
import { Theme } from '../../types';

interface WordEditorToolbarProps {
  fontSize: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  onFontSizeChange: (size: number) => void;
  onAlignmentChange: (align: 'left' | 'center' | 'right' | 'justify') => void;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function WordEditorToolbar({
  fontSize,
  textAlign,
  onFontSizeChange,
  onAlignmentChange,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onUndo,
  onRedo,
}: WordEditorToolbarProps) {
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = theme === 'pastel';

  const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

  return (
    <div className={`border-b p-3 ${
      isPastel
        ? 'border-pink-200/40 bg-white/50'
        : 'border-gray-700/50 bg-gray-800/50'
    }`}>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Font Size */}
        <div className="flex items-center gap-2">
          <label className={`text-xs ${
            isPastel ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Size:
          </label>
          <select
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className={`px-2 py-1 rounded text-sm focus:outline-none ${
              isPastel
                ? 'bg-white border border-pink-200 text-gray-700 focus:border-pink-400'
                : 'bg-gray-700 border border-gray-600 text-white focus:border-cyber-purple-500'
            }`}
          >
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size}pt
              </option>
            ))}
          </select>
        </div>

        {/* Text Formatting */}
        {(onToggleBold || onToggleItalic || onToggleUnderline) && (
          <div className={`flex items-center gap-1 border-l pl-3 ${
            isPastel ? 'border-pink-200/40' : 'border-gray-700/50'
          }`}>
            {onToggleBold && (
              <button
                onClick={onToggleBold}
                className={`p-2 rounded transition-colors ${
                  isPastel
                    ? 'text-gray-600 hover:bg-pink-100'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
                aria-label="Bold"
                title="Bold (Ctrl+B)"
              >
                <Bold size={16} />
              </button>
            )}
            {onToggleItalic && (
              <button
                onClick={onToggleItalic}
                className={`p-2 rounded transition-colors ${
                  isPastel
                    ? 'text-gray-600 hover:bg-pink-100'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
                aria-label="Italic"
                title="Italic (Ctrl+I)"
              >
                <Italic size={16} />
              </button>
            )}
            {onToggleUnderline && (
              <button
                onClick={onToggleUnderline}
                className={`p-2 rounded transition-colors ${
                  isPastel
                    ? 'text-gray-600 hover:bg-pink-100'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
                aria-label="Underline"
                title="Underline (Ctrl+U)"
              >
                <Underline size={16} />
              </button>
            )}
          </div>
        )}

        {/* Alignment */}
        <div className={`flex items-center gap-1 border-l pl-3 ${
          isPastel ? 'border-pink-200/40' : 'border-gray-700/50'
        }`}>
          <button
            onClick={() => onAlignmentChange('left')}
            className={`p-2 rounded transition-colors ${
              textAlign === 'left'
                ? isPastel
                  ? 'bg-pink-200/40 text-pink-600'
                  : 'bg-cyber-purple-500/20 text-cyber-purple-400'
                : isPastel
                  ? 'text-gray-600 hover:bg-pink-100'
                  : 'text-gray-400 hover:bg-gray-700'
            }`}
            aria-label="Align left"
            title="Align left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => onAlignmentChange('center')}
            className={`p-2 rounded transition-colors ${
              textAlign === 'center'
                ? isPastel
                  ? 'bg-pink-200/40 text-pink-600'
                  : 'bg-cyber-purple-500/20 text-cyber-purple-400'
                : isPastel
                  ? 'text-gray-600 hover:bg-pink-100'
                  : 'text-gray-400 hover:bg-gray-700'
            }`}
            aria-label="Align center"
            title="Align center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => onAlignmentChange('right')}
            className={`p-2 rounded transition-colors ${
              textAlign === 'right'
                ? isPastel
                  ? 'bg-pink-200/40 text-pink-600'
                  : 'bg-cyber-purple-500/20 text-cyber-purple-400'
                : isPastel
                  ? 'text-gray-600 hover:bg-pink-100'
                  : 'text-gray-400 hover:bg-gray-700'
            }`}
            aria-label="Align right"
            title="Align right"
          >
            <AlignRight size={16} />
          </button>
          <button
            onClick={() => onAlignmentChange('justify')}
            className={`p-2 rounded transition-colors ${
              textAlign === 'justify'
                ? isPastel
                  ? 'bg-pink-200/40 text-pink-600'
                  : 'bg-cyber-purple-500/20 text-cyber-purple-400'
                : isPastel
                  ? 'text-gray-600 hover:bg-pink-100'
                  : 'text-gray-400 hover:bg-gray-700'
            }`}
            aria-label="Justify"
            title="Justify"
          >
            <AlignJustify size={16} />
          </button>
        </div>

        {/* Undo/Redo */}
        {(onUndo || onRedo) && (
          <div className={`flex items-center gap-1 border-l pl-3 ${
            isPastel ? 'border-pink-200/40' : 'border-gray-700/50'
          }`}>
            {onUndo && (
              <button
                onClick={onUndo}
                className={`p-2 rounded transition-colors ${
                  isPastel
                    ? 'text-gray-600 hover:bg-pink-100'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
                aria-label="Undo"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={16} />
              </button>
            )}
            {onRedo && (
              <button
                onClick={onRedo}
                className={`p-2 rounded transition-colors ${
                  isPastel
                    ? 'text-gray-600 hover:bg-pink-100'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
                aria-label="Redo"
                title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
              >
                <Redo2 size={16} />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}



