import { memo } from 'react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FolderOpen, Save, Circle } from 'lucide-react';
import { SaveOptions } from './SaveOptions';

interface ToolbarProps {
  saveDirectory: string | null;
  saveParentFile: boolean;
  saveToZip: boolean;
  onSelectSaveDirectory: () => void;
  onToggleSaveParentFile: () => void;
  onToggleSaveToZip: () => void;
  onSave: (folderName?: string) => void;
  canSave: boolean;
}

export const Toolbar = memo(function Toolbar({
  saveDirectory,
  saveParentFile,
  saveToZip,
  onSelectSaveDirectory,
  onToggleSaveParentFile,
  onToggleSaveToZip,
  onSave,
  canSave,
}: ToolbarProps) {
  const [showFolderNameDialog, setShowFolderNameDialog] = useState(false);

  const handleSave = () => {
    if (saveToZip) {
      setShowFolderNameDialog(true);
    } else {
      onSave();
    }
  };

  const handleFolderNameConfirm = (folderName: string) => {
    setShowFolderNameDialog(false);
    onSave(folderName);
  };

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-0 right-0 z-40 flex justify-center items-center px-4"
      >
        <div className="bg-gradient-to-r from-gray-800/95 via-gray-800/95 to-gray-800/95 backdrop-blur-md rounded-full px-6 py-4 border-2 border-cyber-purple-500/50 shadow-2xl flex items-center gap-4 flex-shrink-0">
          {/* Select Save Directory */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSelectSaveDirectory}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/80 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 text-white rounded-full font-medium transition-all text-sm whitespace-nowrap border border-gray-600/50 hover:border-cyber-purple-400/50"
            aria-label={saveDirectory ? 'Change save directory' : 'Select save directory'}
          >
            <FolderOpen size={18} aria-hidden="true" />
            {saveDirectory ? 'Change Directory' : 'Select Save Directory'}
          </motion.button>

          {saveDirectory && (
            <>
              {/* Save Parent File Toggle */}
              <button
                onClick={onToggleSaveParentFile}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all text-sm whitespace-nowrap"
                style={{
                  backgroundColor: saveParentFile ? 'rgba(139, 92, 246, 0.2)' : 'rgba(55, 65, 81, 0.5)',
                  color: saveParentFile ? '#c084fc' : '#9ca3af',
                  border: `2px solid ${saveParentFile ? '#a855f7' : '#4b5563'}`,
                }}
                aria-label={saveParentFile ? 'Save parent file enabled' : 'Save parent file disabled'}
                aria-pressed={saveParentFile}
              >
                <Circle size={16} fill={saveParentFile ? 'currentColor' : 'none'} aria-hidden="true" />
                Save Parent File
              </button>

              {/* Save to ZIP Toggle */}
              <button
                onClick={onToggleSaveToZip}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all text-sm whitespace-nowrap"
                style={{
                  backgroundColor: saveToZip ? 'rgba(139, 92, 246, 0.2)' : 'rgba(55, 65, 81, 0.5)',
                  color: saveToZip ? '#c084fc' : '#9ca3af',
                  border: `2px solid ${saveToZip ? '#a855f7' : '#4b5563'}`,
                }}
                aria-label={saveToZip ? 'Save to ZIP folder enabled' : 'Save to ZIP folder disabled'}
                aria-pressed={saveToZip}
              >
                <Circle size={16} fill={saveToZip ? 'currentColor' : 'none'} aria-hidden="true" />
                Save into Zip Folder
              </button>

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: canSave && (saveParentFile || saveToZip) ? 1.05 : 1 }}
                whileTap={{ scale: canSave && (saveParentFile || saveToZip) ? 0.95 : 1 }}
                onClick={handleSave}
                disabled={!canSave || (!saveParentFile && !saveToZip)}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 text-white rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg hover:shadow-xl disabled:shadow-none"
                aria-label="Save extracted pages"
                aria-disabled={!canSave || (!saveParentFile && !saveToZip)}
              >
                <Save size={18} aria-hidden="true" />
                Save
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      <SaveOptions
        isOpen={showFolderNameDialog}
        onClose={() => setShowFolderNameDialog(false)}
        onConfirm={handleFolderNameConfirm}
      />
    </>
  );
});

