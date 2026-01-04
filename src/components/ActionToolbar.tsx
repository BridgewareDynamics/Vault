import { motion } from 'framer-motion';
import { Settings, FileText } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface ActionToolbarProps {
  hideWordEditorButton?: boolean;
  onSettingsClick?: () => void;
}

export function ActionToolbar({ hideWordEditorButton = false, onSettingsClick }: ActionToolbarProps) {
  const { settings, loading } = useSettings();

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
        {/* Word Editor Button */}
        {!hideWordEditorButton && (
          <motion.button
            onClick={handleWordEditorClick}
            className="p-2.5 bg-gray-800/90 hover:bg-gray-700 text-white rounded-full border border-cyber-purple-500/60 shadow-lg backdrop-blur-sm transition-colors"
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
          className="p-2.5 bg-gray-800/90 hover:bg-gray-700 text-white rounded-full border border-cyber-purple-500/60 shadow-lg backdrop-blur-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

