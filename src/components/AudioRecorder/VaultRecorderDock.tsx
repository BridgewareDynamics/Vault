import { motion } from 'framer-motion';
import { Maximize2, Mic, Pause, Play, Square } from 'lucide-react';
import { useAudioRecorderPortal } from '../../contexts/AudioRecorderContext';
import { useSettingsContext } from '../../utils/settingsContext';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';

interface VaultRecorderDockProps {
  className?: string;
  compact?: boolean;
}

export function VaultRecorderDock({ className = '', compact = false }: VaultRecorderDockProps) {
  const studio = useAudioRecorderPortal();
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);

  const { recorder, panelMode, isMinimized, isSessionActive } = studio;
  const isRecording = recorder.status === 'recording';
  const isPaused = recorder.status === 'paused';
  const showDock =
    isMinimized || isRecording || isPaused || (recorder.status === 'stopped' && recorder.recordedBlob);

  const shellClass = isPastel
    ? 'border-rose-300/50 bg-white/90 text-gray-800 shadow-lg'
    : 'border-cyber-cyan-500/40 bg-gray-900/95 text-white shadow-xl';

  const btnSecondary = isPastel
    ? 'border-pink-200/60 bg-white hover:bg-pink-50'
    : 'border-white/10 bg-white/5 hover:bg-white/10';

  const btnPrimary = isPastel
    ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 text-white'
    : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white';

  const liveDot = isRecording ? 'bg-red-500 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-emerald-400';

  if (showDock) {
    return (
      <motion.div
        layout
        className={`inline-flex items-center gap-1 rounded-full border p-1 backdrop-blur-md ${shellClass} ${className}`}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <button
          type="button"
          onClick={studio.expandStudio}
          className={`flex items-center gap-2 rounded-full px-2.5 py-2 text-left ${btnSecondary}`}
          title="Expand recording studio"
          aria-label="Expand recording studio"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${liveDot}`} />
          <span className="font-mono text-xs font-bold tabular-nums">{recorder.durationLabel}</span>
        </button>

        {isRecording && recorder.supportsPause && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={recorder.pauseRecording}
            className={`rounded-full p-2.5 ${btnSecondary}`}
            aria-label="Pause recording"
            title="Pause"
          >
            <Pause size={compact ? 16 : 18} />
          </motion.button>
        )}

        {isPaused && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={recorder.resumeRecording}
            className={`rounded-full p-2.5 ${btnPrimary}`}
            aria-label="Resume recording"
            title="Resume"
          >
            <Play size={compact ? 16 : 18} className="ml-0.5" />
          </motion.button>
        )}

        {(isRecording || isPaused) && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={studio.handleStopFromDock}
            className={`rounded-full p-2.5 ${btnSecondary}`}
            aria-label="Stop recording"
            title="Stop"
          >
            <Square size={compact ? 16 : 18} />
          </motion.button>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={studio.expandStudio}
          className={`rounded-full p-2.5 ${btnPrimary}`}
          aria-label="Expand studio"
          title="Expand studio"
        >
          <Maximize2 size={compact ? 16 : 18} />
        </motion.button>
      </motion.div>
    );
  }

  if (panelMode === 'open') {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={studio.minimizeStudio}
        className={
          className ||
          `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm ${
            isPastel
              ? 'border-purple-300/50 bg-purple-100/90 text-purple-900'
              : 'border-cyber-cyan-500/50 bg-gray-800/90 text-cyan-200'
          }`
        }
        title="Minimize recording studio"
        aria-label="Minimize recording studio"
      >
        <span className={`h-2 w-2 rounded-full ${isSessionActive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
        Studio
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={studio.openStudio}
      className={
        className ||
        `rounded-full border p-2.5 shadow-lg backdrop-blur-sm transition-colors ${
          isPastel
            ? 'border-rose-300/50 bg-gradient-to-br from-rose-200/90 via-purple-200/90 to-cyan-200/90 text-gray-800'
            : 'border-cyber-cyan-500/50 bg-gray-800/90 text-white hover:bg-gray-700'
        }`
      }
      aria-label="Open recording studio"
      title="Recording studio"
    >
      <Mic size={compact ? 18 : 20} />
    </motion.button>
  );
}
