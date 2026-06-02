import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { useAudioRecorderPortal } from '../../contexts/AudioRecorderContext';
import { useSettingsContext } from '../../utils/settingsContext';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';

interface VaultRecorderTriggerProps {
  className?: string;
  compact?: boolean;
}

export function VaultRecorderTrigger({ className = '', compact = false }: VaultRecorderTriggerProps) {
  const { openRecorder } = useAudioRecorderPortal();
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);

  return (
    <motion.button
      type="button"
      onClick={openRecorder}
      className={
        className ||
        `p-2.5 rounded-full border shadow-lg backdrop-blur-sm transition-colors ${
          isPastel
            ? 'bg-gradient-to-br from-rose-200/90 via-purple-200/90 to-cyan-200/90 hover:from-rose-200 hover:via-purple-200 hover:to-cyan-200 text-gray-800 border-rose-300/50'
            : 'bg-gray-800/90 hover:bg-gray-700 text-white border-cyber-cyan-500/50'
        }`
      }
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Open audio recorder"
      title="Record audio to case"
    >
      <Mic size={compact ? 18 : 20} />
      {!compact && <span className="sr-only">Record audio</span>}
    </motion.button>
  );
}
