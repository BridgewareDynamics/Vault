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

export function Toolbar({
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
        <div className="bg-gray-800/95 backdrop-blur-md rounded-full px-6 py-4 border-2 border-cyber-purple-500/50 shadow-2xl flex items-center gap-4 flex-shrink-0">
          {/* Select Save Directory */}
          <button
            onClick={onSelectSaveDirectory}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-medium transition-colors text-sm whitespace-nowrap"
          >
            <FolderOpen size={18} />
            {saveDirectory ? 'Change Directory' : 'Select Save Directory'}
          </button>

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
              >
                <Circle size={16} fill={saveParentFile ? 'currentColor' : 'none'} />
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
              >
                <Circle size={16} fill={saveToZip ? 'currentColor' : 'none'} />
                Save into Zip Folder
              </button>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!canSave || (!saveParentFile && !saveToZip)}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-purple hover:opacity-90 text-white rounded-full font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Save size={18} />
                Save
              </button>
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
}

