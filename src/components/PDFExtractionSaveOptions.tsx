import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, FolderOpen, Save, FileText } from 'lucide-react';

interface PDFExtractionSaveOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: {
    saveDirectory: string;
    folderName?: string;
    saveParentFile: boolean;
    saveToZip: boolean;
    fileNamingPattern: string;
  }) => void;
  initialSaveDirectory?: string | null;
  defaultFolderName?: string;
}

const NAMING_PATTERNS = [
  { value: 'page-{n}', label: 'page-{n} (e.g., page-1, page-2)' },
  { value: '{filename}-{n}', label: '{filename}-{n} (e.g., document-1, document-2)' },
  { value: 'page-{n:03d}', label: 'page-{n:03d} (e.g., page-001, page-002)' },
  { value: 'custom', label: 'Custom pattern' },
];

export function PDFExtractionSaveOptions({
  isOpen,
  onClose,
  onConfirm,
  initialSaveDirectory,
  defaultFolderName,
}: PDFExtractionSaveOptionsProps) {
  const [saveDirectory, setSaveDirectory] = useState<string>(initialSaveDirectory || '');
  const [folderName, setFolderName] = useState<string>(defaultFolderName || '');
  const [saveParentFile, setSaveParentFile] = useState(false);
  const [saveToZip, setSaveToZip] = useState(false);
  const [fileNamingPattern, setFileNamingPattern] = useState('page-{n}');
  const [customPattern, setCustomPattern] = useState('');

  const handleSelectDirectory = async () => {
    try {
      if (!window.electronAPI) {
        return;
      }
      const directory = await window.electronAPI.selectSaveDirectory();
      if (directory) {
        setSaveDirectory(directory);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  const handleConfirm = () => {
    if (!saveDirectory) {
      return;
    }

    const finalPattern = fileNamingPattern === 'custom' ? customPattern : fileNamingPattern;

    onConfirm({
      saveDirectory,
      folderName: saveToZip ? folderName : undefined,
      saveParentFile,
      saveToZip,
      fileNamingPattern: finalPattern,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-options-dialog-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl border-2 border-cyber-purple-400/40 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="relative p-6 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl blur-xl opacity-50"></div>
                  <div className="relative p-3 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl shadow-2xl">
                    <Save className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h2 id="save-options-dialog-title" className="text-2xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent">
                    Save Options
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Configure how extracted pages will be saved
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Save Directory */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Save Directory
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={saveDirectory}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
                  placeholder="No directory selected"
                />
                <button
                  onClick={handleSelectDirectory}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg font-medium text-white transition-all flex items-center gap-2"
                >
                  <FolderOpen className="w-5 h-5" />
                  Browse
                </button>
              </div>
            </div>

            {/* Save Options */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                Save Options
              </label>

              {/* Save Parent File */}
              <label className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 cursor-pointer hover:bg-gray-800/70 transition-colors">
                <input
                  type="checkbox"
                  checked={saveParentFile}
                  onChange={(e) => setSaveParentFile(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-cyber-purple-400 focus:ring-cyber-purple-400 focus:ring-offset-gray-900"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-200">Save Parent PDF File</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Include the original PDF file in the output folder
                  </p>
                </div>
              </label>

              {/* Save to ZIP */}
              <label className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 cursor-pointer hover:bg-gray-800/70 transition-colors">
                <input
                  type="checkbox"
                  checked={saveToZip}
                  onChange={(e) => setSaveToZip(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-cyber-purple-400 focus:ring-cyber-purple-400 focus:ring-offset-gray-900"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-200">Save to ZIP Folder</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a ZIP archive containing all extracted pages
                  </p>
                </div>
              </label>
            </div>

            {/* Folder Name (if ZIP) */}
            {saveToZip && (
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-3">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
                />
              </div>
            )}

            {/* File Naming Pattern */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                File Naming Pattern
              </label>
              <select
                value={fileNamingPattern}
                onChange={(e) => setFileNamingPattern(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
              >
                {NAMING_PATTERNS.map((pattern) => (
                  <option key={pattern.value} value={pattern.value}>
                    {pattern.label}
                  </option>
                ))}
              </select>

              {fileNamingPattern === 'custom' && (
                <input
                  type="text"
                  value={customPattern}
                  onChange={(e) => setCustomPattern(e.target.value)}
                  placeholder="Enter custom pattern (use {n} for page number)..."
                  className="w-full mt-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-cyber-purple-400/30 bg-gray-900/50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!saveDirectory}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
