import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { X, FolderOpen, Save, FileText, FolderPlus } from 'lucide-react';
import { ArchiveFile, Theme } from '../types';
import { useSettingsContext } from '../utils/settingsContext';
import { logger } from '../utils/logger';

export type AuditSaveOption = 'save-loose' | 'make-pdf-folder' | 'add-to-pdf-folder' | 'add-folder-to-directory';

interface AuditSaveOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (option: AuditSaveOption, folderName?: string, subfolderName?: string, createNewFolderForLoose?: boolean, looseFolderName?: string) => void;
  pdfPath: string | null;
  casePath: string | null;
  existingFolders?: ArchiveFile[]; // Optional: if called from ArchivePage context
}

// Helper function to find extraction folders for a PDF
async function findExtractionFoldersForPDF(
  pdfPath: string | null,
  casePath: string | null
): Promise<ArchiveFile[]> {
  if (!pdfPath || !casePath || !window.electronAPI) {
    return [];
  }

  try {
    // Get PDF filename for matching
    const pdfName = pdfPath.split(/[/\\]/).pop() || '';
    
    // List case files to find folders
    const files = await window.electronAPI.listCaseFiles(casePath);
    
    // Filter for folders with matching parentPdfName
    // Note: listCaseFiles returns a simplified type, so we need to cast/check properties
    return files.filter(
      (file) =>
        file.isFolder &&
        file.parentPdfName &&
        file.parentPdfName.toLowerCase() === pdfName.toLowerCase()
    ) as ArchiveFile[];
  } catch (error) {
    logger.error('Failed to find extraction folders:', error);
    return [];
  }
}

export function AuditSaveOptionsDialog({
  isOpen,
  onClose,
  onConfirm,
  pdfPath,
  casePath,
  existingFolders,
}: AuditSaveOptionsDialogProps) {
  const { settings } = useSettingsContext();
  const isPastel = (settings?.theme as Theme) === 'pastel';
  const [selectedOption, setSelectedOption] = useState<AuditSaveOption | null>(null);
  const [detectedFolders, setDetectedFolders] = useState<ArchiveFile[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [subfolderName, setSubfolderName] = useState('');
  const [showSubfolderInput, setShowSubfolderInput] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [createNewFolderForLoose, setCreateNewFolderForLoose] = useState(false);
  const [looseFolderName, setLooseFolderName] = useState('');
  const [folderNameError, setFolderNameError] = useState<string | null>(null);
  const hasInitializedFolderName = useRef(false);

  // Detect existing folders on mount or when props change
  useEffect(() => {
    if (isOpen && pdfPath && casePath) {
      setIsDetecting(true);
      
      // Use provided folders if available, otherwise detect
      if (existingFolders && existingFolders.length > 0) {
        setDetectedFolders(existingFolders);
        setIsDetecting(false);
      } else {
        findExtractionFoldersForPDF(pdfPath, casePath)
          .then((folders) => {
            setDetectedFolders(folders);
            setIsDetecting(false);
          })
          .catch((error) => {
            logger.error('Error detecting folders:', error);
            setDetectedFolders([]);
            setIsDetecting(false);
          });
      }
    } else {
      setDetectedFolders([]);
    }
  }, [isOpen, pdfPath, casePath, existingFolders]);

  // Generate default folder name from PDF name - only when dialog opens or pdfPath changes
  useEffect(() => {
    if (isOpen && pdfPath && !hasInitializedFolderName.current) {
      const pdfName = pdfPath.split(/[/\\]/).pop()?.replace(/\.pdf$/i, '') || 'audit_report';
      setFolderName(pdfName);
      hasInitializedFolderName.current = true;
    }
    
    // Reset initialization flag when dialog closes
    if (!isOpen) {
      hasInitializedFolderName.current = false;
      setFolderName('');
    }
  }, [isOpen, pdfPath]);

  const hasExistingFolder = detectedFolders.length > 0;
  const firstExistingFolder = detectedFolders[0];

  const handleOptionSelect = (option: AuditSaveOption) => {
    setSelectedOption(option);
    
    if (option === 'add-folder-to-directory') {
      setShowSubfolderInput(true);
      setCreateNewFolderForLoose(false);
    } else if (option === 'save-loose') {
      setShowSubfolderInput(false);
      // Don't reset createNewFolderForLoose - let user toggle it
    } else {
      setShowSubfolderInput(false);
      setCreateNewFolderForLoose(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedOption) return;

    if (selectedOption === 'add-folder-to-directory' && !subfolderName.trim()) {
      return; // Don't allow empty subfolder name
    }

    if (selectedOption === 'make-pdf-folder' && !folderName.trim()) {
      return; // Don't allow empty folder name
    }

    if (selectedOption === 'save-loose' && createNewFolderForLoose && !looseFolderName.trim()) {
      setFolderNameError('Folder name is required');
      return;
    }

    onConfirm(
      selectedOption,
      selectedOption === 'make-pdf-folder' 
        ? folderName.trim() 
        : (selectedOption === 'save-loose' && createNewFolderForLoose ? looseFolderName.trim() : undefined),
      selectedOption === 'add-folder-to-directory' ? subfolderName.trim() : undefined,
      selectedOption === 'save-loose' ? createNewFolderForLoose : false,
      selectedOption === 'save-loose' && createNewFolderForLoose ? looseFolderName.trim() : undefined
    );
    
    // Reset state
    setSelectedOption(null);
    setSubfolderName('');
    setShowSubfolderInput(false);
    setCreateNewFolderForLoose(false);
    setLooseFolderName('');
    setFolderNameError(null);
    onClose();
  };

  const handleClose = () => {
    setSelectedOption(null);
    setSubfolderName('');
    setShowSubfolderInput(false);
    setCreateNewFolderForLoose(false);
    setLooseFolderName('');
    setFolderNameError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-save-dialog-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`rounded-2xl border-2 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col ${
            isPastel
              ? 'bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50 border-pink-200/40'
              : 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-cyber-purple-400/40'
          }`}
          style={isPastel ? {
            boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
          } : {}}
        >
          {/* Header */}
          <div className={`relative p-6 border-b backdrop-blur-xl ${
            isPastel
              ? 'border-pink-200/40 bg-gradient-to-r from-white/95 via-pink-50/20 to-white/95'
              : 'border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {isPastel ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-purple-200 rounded-xl blur-xl opacity-50"></div>
                      <div className="relative p-3 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl shadow-lg border border-pink-200/40">
                        <Save className="w-6 h-6 text-pink-600" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl blur-xl opacity-50"></div>
                      <div className="relative p-3 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl shadow-2xl">
                        <Save className="w-6 h-6 text-white" />
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <h2 id="audit-save-dialog-title" className={`text-2xl font-bold bg-clip-text text-transparent ${
                    isPastel
                      ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500'
                      : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400'
                  }`}>
                    Save Audit Report
                  </h2>
                  <p className={`text-sm mt-1 ${
                    isPastel ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    Choose where to save the audit report
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className={`p-2 rounded-xl transition-colors ${
                  isPastel ? 'hover:bg-pink-100' : 'hover:bg-gray-800'
                }`}
                aria-label="Close"
              >
                <X className={`w-5 h-5 ${isPastel ? 'text-gray-600' : 'text-gray-400'}`} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isDetecting ? (
              <div className="flex items-center justify-center py-8">
                <div className={isPastel ? 'text-gray-600' : 'text-gray-400'}>
                  Detecting existing folders...
                </div>
              </div>
            ) : (
              <>
                {/* Save Loose Option */}
                <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors group ${
                  isPastel
                    ? 'bg-pink-50/50 border-pink-200/50 hover:bg-pink-100/70'
                    : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
                }`}>
                  <div className="relative">
                    <input
                      type="radio"
                      name="save-option"
                      value="save-loose"
                      checked={selectedOption === 'save-loose'}
                      onChange={() => handleOptionSelect('save-loose')}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        selectedOption === 'save-loose'
                          ? isPastel
                            ? 'bg-pink-500 border-pink-500'
                            : 'bg-cyber-purple-400 border-cyber-purple-400'
                          : isPastel
                            ? 'bg-transparent border-gray-400 group-hover:border-pink-400'
                            : 'bg-transparent border-gray-500 group-hover:border-cyber-purple-400'
                      }`}
                    >
                      {selectedOption === 'save-loose' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className={`w-4 h-4 ${
                        isPastel ? 'text-gray-600' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        isPastel ? 'text-gray-700' : 'text-gray-200'
                      }`}>
                        Save Loose
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${
                      isPastel ? 'text-gray-600' : 'text-gray-500'
                    }`}>
                      Save to case folder (uses default folder name if no custom folder is created)
                    </p>
                  </div>
                </label>

                {/* Create New Folder option - expands when Save Loose is selected */}
                {selectedOption === 'save-loose' && (
                  <div className={`ml-8 pl-4 border-l-2 space-y-3 ${
                    isPastel ? 'border-pink-300/40' : 'border-cyber-purple-400/30'
                  }`}>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors group ${
                      isPastel
                        ? 'bg-pink-50/30 border-pink-200/30 hover:bg-pink-100/50'
                        : 'bg-gray-800/30 border-gray-700/30 hover:bg-gray-800/50'
                    }`}>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={createNewFolderForLoose}
                          onChange={(e) => {
                            setCreateNewFolderForLoose(e.target.checked);
                            if (!e.target.checked) {
                              setLooseFolderName('');
                              setFolderNameError(null);
                            }
                          }}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border-2 transition-all ${
                            createNewFolderForLoose
                              ? isPastel
                                ? 'bg-pink-500 border-pink-500'
                                : 'bg-cyber-purple-400 border-cyber-purple-400'
                              : isPastel
                                ? 'bg-transparent border-gray-400 group-hover:border-pink-400'
                                : 'bg-transparent border-gray-500 group-hover:border-cyber-purple-400'
                          }`}
                        >
                          {createNewFolderForLoose && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-full h-full flex items-center justify-center"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${
                          isPastel ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Create New Folder inside case file
                        </span>
                      </div>
                    </label>

                    {/* Folder Name Input (shown when Create New Folder is checked) */}
                    {createNewFolderForLoose && (
                      <div>
                        <label className={`block text-xs font-semibold mb-2 ${
                          isPastel ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          Folder Name
                        </label>
                        <input
                          type="text"
                          value={looseFolderName}
                          onChange={(e) => {
                            setLooseFolderName(e.target.value);
                            if (folderNameError) {
                              setFolderNameError(null);
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          placeholder="Enter folder name..."
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${
                            folderNameError
                              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                              : isPastel
                                ? 'bg-white border-pink-200 text-gray-700 focus:ring-pink-400'
                                : 'bg-gray-800 border-gray-700 text-white focus:ring-cyber-purple-400'
                          }`}
                        />
                        {folderNameError && (
                          <p className="text-red-400 text-xs mt-2">{folderNameError}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Make PDF Folder Option - Only show if no existing folder */}
                {!hasExistingFolder && (
                  <>
                    <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors group ${
                      isPastel
                        ? 'bg-pink-50/50 border-pink-200/50 hover:bg-pink-100/70'
                        : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
                    }`}>
                      <div className="relative">
                        <input
                          type="radio"
                          name="save-option"
                          value="make-pdf-folder"
                          checked={selectedOption === 'make-pdf-folder'}
                          onChange={() => handleOptionSelect('make-pdf-folder')}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            selectedOption === 'make-pdf-folder'
                              ? isPastel
                                ? 'bg-pink-500 border-pink-500'
                                : 'bg-cyber-purple-400 border-cyber-purple-400'
                              : isPastel
                                ? 'bg-transparent border-gray-400 group-hover:border-pink-400'
                                : 'bg-transparent border-gray-500 group-hover:border-cyber-purple-400'
                          }`}
                        >
                          {selectedOption === 'make-pdf-folder' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-full h-full flex items-center justify-center"
                            >
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FolderPlus className={`w-4 h-4 ${
                            isPastel ? 'text-gray-600' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm font-medium ${
                            isPastel ? 'text-gray-700' : 'text-gray-200'
                          }`}>
                            Make PDF Folder
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${
                          isPastel ? 'text-gray-600' : 'text-gray-500'
                        }`}>
                          Create folder above PDF (like Convert to Images)
                        </p>
                      </div>
                    </label>

                    {/* Folder Name Input (shown when Make PDF Folder is selected) */}
                    {selectedOption === 'make-pdf-folder' && (
                      <div className={`ml-8 pl-4 border-l-2 ${
                        isPastel ? 'border-pink-300/40' : 'border-cyber-purple-400/30'
                      }`}>
                        <label className={`block text-xs font-semibold mb-2 ${
                          isPastel ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          Folder Name
                        </label>
                        <input
                          type="text"
                          value={folderName}
                          onChange={(e) => setFolderName(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          placeholder="Enter folder name..."
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${
                            isPastel
                              ? 'bg-white border-pink-200 text-gray-700 focus:ring-pink-400'
                              : 'bg-gray-800 border-gray-700 text-white focus:ring-cyber-purple-400'
                          }`}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Additional options when folder exists */}
                {hasExistingFolder && (
                  <>
                    {/* Add to PDF Folder Option */}
                    <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors group ${
                      isPastel
                        ? 'bg-pink-50/50 border-pink-200/50 hover:bg-pink-100/70'
                        : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
                    }`}>
                      <div className="relative">
                        <input
                          type="radio"
                          name="save-option"
                          value="add-to-pdf-folder"
                          checked={selectedOption === 'add-to-pdf-folder'}
                          onChange={() => handleOptionSelect('add-to-pdf-folder')}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            selectedOption === 'add-to-pdf-folder'
                              ? isPastel
                                ? 'bg-pink-500 border-pink-500'
                                : 'bg-cyber-purple-400 border-cyber-purple-400'
                              : isPastel
                                ? 'bg-transparent border-gray-400 group-hover:border-pink-400'
                                : 'bg-transparent border-gray-500 group-hover:border-cyber-purple-400'
                          }`}
                        >
                          {selectedOption === 'add-to-pdf-folder' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-full h-full flex items-center justify-center"
                            >
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FolderOpen className={`w-4 h-4 ${
                            isPastel ? 'text-gray-600' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm font-medium ${
                            isPastel ? 'text-gray-700' : 'text-gray-200'
                          }`}>
                            Add to PDF Folder
                          </span>
                          <span className={`text-xs ${
                            isPastel ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            ({firstExistingFolder.name})
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${
                          isPastel ? 'text-gray-600' : 'text-gray-500'
                        }`}>
                          Save to existing folder: {firstExistingFolder.name}
                        </p>
                      </div>
                    </label>

                    {/* Add Folder to Directory Option */}
                    <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors group ${
                      isPastel
                        ? 'bg-pink-50/50 border-pink-200/50 hover:bg-pink-100/70'
                        : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
                    }`}>
                      <div className="relative">
                        <input
                          type="radio"
                          name="save-option"
                          value="add-folder-to-directory"
                          checked={selectedOption === 'add-folder-to-directory'}
                          onChange={() => handleOptionSelect('add-folder-to-directory')}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            selectedOption === 'add-folder-to-directory'
                              ? isPastel
                                ? 'bg-pink-500 border-pink-500'
                                : 'bg-cyber-purple-400 border-cyber-purple-400'
                              : isPastel
                                ? 'bg-transparent border-gray-400 group-hover:border-pink-400'
                                : 'bg-transparent border-gray-500 group-hover:border-cyber-purple-400'
                          }`}
                        >
                          {selectedOption === 'add-folder-to-directory' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-full h-full flex items-center justify-center"
                            >
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FolderPlus className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-200">
                            Make Subfolder Within PDF Folder
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Create subfolder inside {firstExistingFolder.name}
                        </p>
                      </div>
                    </label>

                    {/* Subfolder Name Input (shown when Add Folder to Directory is selected) */}
                    {showSubfolderInput && (
                      <div className={`ml-8 pl-4 border-l-2 ${
                        isPastel ? 'border-pink-300/40' : 'border-cyber-purple-400/30'
                      }`}>
                        <label className={`block text-xs font-semibold mb-2 ${
                          isPastel ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          Subfolder Name
                        </label>
                        <input
                          type="text"
                          value={subfolderName}
                          onChange={(e) => setSubfolderName(e.target.value)}
                          placeholder="Enter subfolder name (e.g., Audit Reports)..."
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${
                            isPastel
                              ? 'bg-white border-pink-200 text-gray-700 focus:ring-pink-400'
                              : 'bg-gray-800 border-gray-700 text-white focus:ring-cyber-purple-400'
                          }`}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className={`p-6 border-t flex items-center justify-end gap-3 ${
            isPastel
              ? 'border-pink-200/40 bg-pink-50/50'
              : 'border-cyber-purple-400/30 bg-gray-900/50'
          }`}>
            <button
              onClick={handleClose}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                isPastel
                  ? 'bg-pink-100 hover:bg-pink-200 text-gray-700'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                !selectedOption ||
                (selectedOption === 'add-folder-to-directory' && !subfolderName.trim()) ||
                (selectedOption === 'make-pdf-folder' && !folderName.trim()) ||
                (selectedOption === 'save-loose' && createNewFolderForLoose && !looseFolderName.trim())
              }
              className={`px-6 py-2.5 rounded-lg font-medium transition-all disabled:cursor-not-allowed flex items-center gap-2 text-white ${
                isPastel
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-300'
                  : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700'
              }`}
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
