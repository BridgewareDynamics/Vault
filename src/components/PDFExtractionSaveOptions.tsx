import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, FolderOpen, Save, FileText, FolderPlus } from 'lucide-react';
import { ArchiveFile } from '../types';

export type ExtractionSaveOption = 'save-loose' | 'make-pdf-folder' | 'add-to-pdf-folder' | 'add-folder-to-directory';

interface PDFExtractionSaveOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: {
    saveOption: ExtractionSaveOption;
    saveDirectory: string;
    folderName?: string;
    subfolderName?: string;
    createNewFolderForLoose?: boolean;
    saveParentFile: boolean;
    saveToZip: boolean;
    fileNamingPattern: string;
  }) => void;
  initialSaveDirectory?: string | null;
  defaultFolderName?: string;
  pdfPath?: string | null;
  casePath?: string | null;
  existingFolders?: ArchiveFile[];
}

const NAMING_PATTERNS = [
  { value: 'page-{n}', label: 'page-{n} (e.g., page-1, page-2)' },
  { value: '{filename}-{n}', label: '{filename}-{n} (e.g., document-1, document-2)' },
  { value: 'page-{n:03d}', label: 'page-{n:03d} (e.g., page-001, page-002)' },
  { value: 'custom', label: 'Custom pattern' },
];

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
    return files.filter(
      (file: any) =>
        file.isFolder &&
        file.parentPdfName &&
        file.parentPdfName.toLowerCase() === pdfName.toLowerCase()
    ) as ArchiveFile[];
  } catch (error) {
    console.error('Failed to find extraction folders:', error);
    return [];
  }
}

export function PDFExtractionSaveOptions({
  isOpen,
  onClose,
  onConfirm,
  initialSaveDirectory,
  defaultFolderName,
  pdfPath,
  casePath,
  existingFolders,
}: PDFExtractionSaveOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<ExtractionSaveOption | null>(null);
  const [saveDirectory, setSaveDirectory] = useState<string>(initialSaveDirectory || '');
  const [folderName, setFolderName] = useState<string>(defaultFolderName || '');
  const [saveParentFile, setSaveParentFile] = useState(false);
  const [saveToZip, setSaveToZip] = useState(false);
  const [fileNamingPattern, setFileNamingPattern] = useState('page-{n}');
  const [customPattern, setCustomPattern] = useState('');
  const [folderNameError, setFolderNameError] = useState<string | null>(null);
  const [detectedFolders, setDetectedFolders] = useState<ArchiveFile[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [subfolderName, setSubfolderName] = useState('');
  const [showSubfolderInput, setShowSubfolderInput] = useState(false);
  const [createNewFolderForLoose, setCreateNewFolderForLoose] = useState(false);
  const [looseFolderName, setLooseFolderName] = useState('');

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
            console.error('Error detecting folders:', error);
            setDetectedFolders([]);
            setIsDetecting(false);
          });
      }
    } else {
      setDetectedFolders([]);
    }
  }, [isOpen, pdfPath, casePath, existingFolders]);

  // Generate default folder name from PDF name
  useEffect(() => {
    if (pdfPath && !folderName) {
      const pdfName = pdfPath.split(/[/\\]/).pop()?.replace(/\.pdf$/i, '') || 'extracted_images';
      setFolderName(pdfName);
    }
  }, [pdfPath, folderName]);

  // Auto-select option based on folder detection
  useEffect(() => {
    if (isOpen && !isDetecting) {
      if (detectedFolders.length > 0 && !selectedOption) {
        // Auto-select "Add to PDF Folder" if folder exists
        setSelectedOption('add-to-pdf-folder');
      } else if (detectedFolders.length === 0 && !selectedOption) {
        // Auto-select "Make PDF Folder" if no folder exists
        setSelectedOption('make-pdf-folder');
      }
    }
  }, [isOpen, isDetecting, detectedFolders.length, selectedOption]);

  const hasExistingFolder = detectedFolders.length > 0;
  const firstExistingFolder = detectedFolders[0];

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

  const handleOptionSelect = (option: ExtractionSaveOption) => {
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
    if (!selectedOption) {
      return;
    }

    if (!saveDirectory && casePath) {
      // If we have a case path, use it as save directory
      setSaveDirectory(casePath);
    }

    if (!saveDirectory) {
      return;
    }

    // Validate based on selected option
    if (selectedOption === 'add-folder-to-directory' && !subfolderName.trim()) {
      return; // Don't allow empty subfolder name
    }

    if (selectedOption === 'make-pdf-folder' && !folderName.trim()) {
      setFolderNameError('Folder name is required');
      return;
    }

    if (selectedOption === 'save-loose' && createNewFolderForLoose && !looseFolderName.trim()) {
      setFolderNameError('Folder name is required');
      return;
    }

    const finalPattern = fileNamingPattern === 'custom' ? customPattern : fileNamingPattern;

    onConfirm({
      saveOption: selectedOption,
      saveDirectory,
      folderName: selectedOption === 'make-pdf-folder' 
        ? folderName.trim() 
        : (selectedOption === 'save-loose' && createNewFolderForLoose ? looseFolderName.trim() : undefined),
      subfolderName: selectedOption === 'add-folder-to-directory' ? subfolderName.trim() : undefined,
      createNewFolderForLoose: selectedOption === 'save-loose' ? createNewFolderForLoose : false,
      saveParentFile,
      saveToZip,
      fileNamingPattern: finalPattern,
    });
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
                onClick={handleClose}
                className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Folder Location Options - Only show if we have casePath and pdfPath */}
            {casePath && pdfPath && (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-400 mb-3">
                  Folder Location
                </label>

                {isDetecting ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="text-gray-400">Detecting existing folders...</div>
                  </div>
                ) : (
                  <>
                    {/* Save Loose Option */}
                    <label className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 cursor-pointer hover:bg-gray-800/70 transition-colors group">
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
                              ? 'bg-cyber-purple-400 border-cyber-purple-400'
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
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-200">Save Loose</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Save to case folder (uses default folder name if no custom folder is created)
                        </p>
                      </div>
                    </label>

                    {/* Create New Folder option - expands when Save Loose is selected */}
                    {selectedOption === 'save-loose' && (
                      <div className="ml-8 pl-4 border-l-2 border-cyber-purple-400/30 space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 cursor-pointer hover:bg-gray-800/50 transition-colors group">
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
                                  ? 'bg-cyber-purple-400 border-cyber-purple-400'
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
                            <span className="text-sm font-medium text-gray-300">Create New Folder inside case file</span>
                          </div>
                        </label>

                        {/* Folder Name Input (shown when Create New Folder is checked) */}
                        {createNewFolderForLoose && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2">
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
                              className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white text-sm focus:ring-2 focus:border-transparent ${
                                folderNameError
                                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                                  : 'border-gray-700 focus:ring-cyber-purple-400'
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
                        <label className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 cursor-pointer hover:bg-gray-800/70 transition-colors group">
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
                                  ? 'bg-cyber-purple-400 border-cyber-purple-400'
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
                              <FolderPlus className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-200">Make PDF Folder</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Create folder above PDF (like Convert to Images)
                            </p>
                          </div>
                        </label>

                        {/* Folder Name Input (shown when Make PDF Folder is selected) */}
                        {selectedOption === 'make-pdf-folder' && (
                          <div className="ml-8 pl-4 border-l-2 border-cyber-purple-400/30">
                            <label className="block text-xs font-semibold text-gray-400 mb-2">
                              Folder Name
                            </label>
                            <input
                              type="text"
                              value={folderName}
                              onChange={(e) => {
                                setFolderName(e.target.value);
                                if (folderNameError) {
                                  setFolderNameError(null);
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                              placeholder="Enter folder name..."
                              className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white text-sm focus:ring-2 focus:border-transparent ${
                                folderNameError
                                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                                  : 'border-gray-700 focus:ring-cyber-purple-400'
                              }`}
                            />
                            {folderNameError && (
                              <p className="text-red-400 text-xs mt-2">{folderNameError}</p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Additional options when folder exists */}
                    {hasExistingFolder && (
                      <>
                        {/* Add to PDF Folder Option */}
                        <label className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 cursor-pointer hover:bg-gray-800/70 transition-colors group">
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
                                  ? 'bg-cyber-purple-400 border-cyber-purple-400'
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
                              <FolderOpen className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-200">
                                Add to PDF Folder
                              </span>
                              <span className="text-xs text-gray-500">({firstExistingFolder.name})</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Save to existing folder: {firstExistingFolder.name}
                            </p>
                          </div>
                        </label>

                        {/* Add Folder to Directory Option */}
                        <label className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 cursor-pointer hover:bg-gray-800/70 transition-colors group">
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
                                  ? 'bg-cyber-purple-400 border-cyber-purple-400'
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
                          <div className="ml-8 pl-4 border-l-2 border-cyber-purple-400/30">
                            <label className="block text-xs font-semibold text-gray-400 mb-2">
                              Subfolder Name
                            </label>
                            <input
                              type="text"
                              value={subfolderName}
                              onChange={(e) => setSubfolderName(e.target.value)}
                              placeholder="Enter subfolder name (e.g., Images)..."
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Save Directory - Only show if not using case folder options */}
            {(!casePath || !pdfPath) && (
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
            )}

            {/* Folder Name - Only show if not using case folder options or if making new folder */}
            {(!casePath || !pdfPath || selectedOption === 'make-pdf-folder') && selectedOption !== 'add-to-pdf-folder' && selectedOption !== 'add-folder-to-directory' && (
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-3">
                  Folder Name {!casePath && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => {
                    setFolderName(e.target.value);
                    if (folderNameError) {
                      setFolderNameError(null);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter folder name..."
                  aria-required={!casePath}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white text-sm focus:ring-2 focus:border-transparent ${
                    folderNameError
                      ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-gray-700 focus:ring-cyber-purple-400'
                  }`}
                />
                {folderNameError && (
                  <p className="text-red-400 text-sm mt-2">{folderNameError}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {saveToZip
                    ? 'This name will be used for the ZIP file'
                    : 'A subfolder with this name will be created to store the extracted images'}
                </p>
              </div>
            )}

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
              onClick={handleClose}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                !selectedOption ||
                (!casePath && !saveDirectory) ||
                (selectedOption === 'add-folder-to-directory' && !subfolderName.trim()) ||
                (selectedOption === 'make-pdf-folder' && !folderName.trim()) ||
                (selectedOption === 'save-loose' && createNewFolderForLoose && !looseFolderName.trim()) ||
                (!casePath && !folderName.trim())
              }
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
