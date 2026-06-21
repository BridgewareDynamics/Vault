import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen } from 'lucide-react';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';
import { useSettingsContext } from '../../utils/settingsContext';

interface ArchiveDriveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ArchiveDriveDialog({ isOpen, onClose, onConfirm }: ArchiveDriveDialogProps) {
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className={`fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4 ${
          isPastel ? 'bg-white/80' : 'bg-black/80'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-drive-dialog-title"
        aria-describedby="archive-drive-dialog-description"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`rounded-lg border-2 shadow-2xl p-6 max-w-md w-full ${
            isPastel
              ? 'bg-gradient-to-br from-white to-pink-50/50 border-pink-300/60'
              : 'bg-gradient-to-br from-gray-800 to-gray-900 border-cyber-purple-500/60'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              isPastel
                ? 'bg-gradient-to-br from-pink-300 to-purple-300'
                : 'bg-gradient-to-br from-purple-600 to-cyan-600'
            }`} aria-hidden="true">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <h2 id="archive-drive-dialog-title" className={`text-2xl font-bold bg-clip-text text-transparent ${
              isPastel
                ? 'bg-gradient-to-r from-pink-400 to-purple-400'
                : 'bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400'
            }`}>
              Choose Vault Directory
            </h2>
          </div>

          <p id="archive-drive-dialog-description" className={`mb-6 ${
            isPastel ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Welcome to Vault! Please choose the directory where your vault will be stored. This location will be remembered for future sessions.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                isPastel
                  ? 'bg-pink-100 hover:bg-pink-200 text-gray-800'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              aria-label="Cancel selecting vault directory"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity font-semibold ${
                isPastel
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400'
                  : 'bg-gradient-to-r from-purple-600 to-cyan-600'
              }`}
              aria-label="Confirm vault directory selection"
            >
              Select Directory
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


