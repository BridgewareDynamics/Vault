import { motion } from 'framer-motion';
import { Settings, FileText } from 'lucide-react';
import { VaultRecorderTrigger } from './AudioRecorder/VaultRecorderTrigger';
import { useSettings } from '../hooks/useSettings';
import { useSettingsContext } from '../utils/settingsContext';
import { Theme } from '../types';
import { isLightTheme } from '../theme/themeSemantics';

interface ActionToolbarProps {
  hideWordEditorButton?: boolean;
  onSettingsClick?: () => void;
}

export function ActionToolbar({ hideWordEditorButton = false, onSettingsClick }: ActionToolbarProps) {
  const { settings, loading } = useSettings();
  const { settings: appSettings } = useSettingsContext();
  const theme: Theme = (appSettings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      // Dispatch event to open settings panel
      window.dispatchEvent(new CustomEvent('open-settings'));
    }
  };

  const handleWordEditorClick = () => {
    // Dispatch event to open word editor dialog (handled by SettingsPanel)
    window.dispatchEvent(new CustomEvent('open-word-editor-dialog'));
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <VaultRecorderTrigger />

        {/* Word Editor Button */}
        {!hideWordEditorButton && (
          <motion.button
            onClick={handleWordEditorClick}
            className={`p-2.5 rounded-full border shadow-lg backdrop-blur-sm transition-colors ${
              isPastel
                ? 'bg-gradient-to-br from-pink-200/90 via-purple-200/90 to-blue-200/90 hover:from-pink-200 hover:via-purple-200 hover:to-blue-200 text-gray-800 border-pink-300/40 hover:shadow-pink-300/30'
                : 'bg-gray-800/90 hover:bg-gray-700 text-white border-cyber-purple-500/60'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open word editor"
            title="Word Editor"
          >
            <FileText size={20} />
          </motion.button>
        )}

        {/* Settings Button */}
        <motion.button
          onClick={handleSettingsClick}
          disabled={loading || !settings}
          className={`p-2.5 rounded-full border shadow-lg backdrop-blur-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isPastel
              ? 'bg-gradient-to-br from-pink-200/90 via-purple-200/90 to-blue-200/90 hover:from-pink-200 hover:via-purple-200 hover:to-blue-200 text-gray-800 border-pink-300/40 hover:shadow-pink-300/30'
              : 'bg-gray-800/90 hover:bg-gray-700 text-white border-cyber-purple-500/60'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open settings"
          title="Settings"
        >
          <Settings size={20} />
        </motion.button>
      </div>

      {/* Word Editor Dialog - handled by SettingsPanel via event */}
    </>
  );
}

