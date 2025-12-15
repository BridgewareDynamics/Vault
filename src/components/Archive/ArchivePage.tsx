import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FolderPlus, Upload, ArrowLeft, FolderOpen } from 'lucide-react';
import { useArchive } from '../../hooks/useArchive';
import { useArchiveExtraction } from '../../hooks/useArchiveExtraction';
import { useToast } from '../Toast/ToastContext';
import { CaseFolder } from './CaseFolder';
import { ArchiveFileItem } from './ArchiveFileItem';
import { ArchiveFileViewer } from './ArchiveFileViewer';
import { ArchiveSearchBar } from './ArchiveSearchBar';
import { ArchiveDriveDialog } from './ArchiveDriveDialog';
import { CaseNameDialog } from './CaseNameDialog';
import { ExtractionFolderDialog } from './ExtractionFolderDialog';
import { SaveParentDialog } from './SaveParentDialog';
import { FolderSelectionDialog } from './FolderSelectionDialog';
import { DeleteFolderConfirmDialog } from './DeleteFolderConfirmDialog';
import { RenameFileDialog } from './RenameFileDialog';
import { ExtractionFolder } from './ExtractionFolder';
import { ArchiveFile } from '../../types';
import { ProgressBar } from '../ProgressBar';

interface ArchivePageProps {
  onBack: () => void;
}

export function ArchivePage({ onBack }: ArchivePageProps) {
  const {
    archiveConfig,
    cases,
    currentCase,
    currentFolderPath,
    folderNavigationStack,
    files,
    searchQuery,
    loading,
    setCurrentCase,
    setSearchQuery,
    selectArchiveDrive,
    createCase,
    addFilesToCase,
    deleteCase,
    deleteFile,
    renameFile,
    openFolder,
    goBackToCase,
    goBackToParentFolder,
    navigateToFolder,
    updateCaseBackgroundImage,
    refreshFiles,
  } = useArchive();

  const { extractPDF, isExtracting, progress, statusMessage, extractingCasePath, extractingFolderPath } = useArchiveExtraction();
  const toast = useToast();

  const [showDriveDialog, setShowDriveDialog] = useState(false);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showFolderSelectionDialog, setShowFolderSelectionDialog] = useState(false);
  const [showExtractionDialog, setShowExtractionDialog] = useState(false);
  const [showSaveParentDialog, setShowSaveParentDialog] = useState(false);
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<ArchiveFile | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [fileToRename, setFileToRename] = useState<ArchiveFile | null>(null);
  const [selectedFileForExtraction, setSelectedFileForExtraction] = useState<ArchiveFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<ArchiveFile | null>(null);
  const [fileViewerIndex, setFileViewerIndex] = useState(0);

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-show vault directory dialog on first open if no vault directory is set
  useEffect(() => {
    // Only show dialog if archiveConfig has been loaded and no vault directory is set
    if (archiveConfig !== null && archiveConfig !== undefined && !archiveConfig.archiveDrive) {
      setShowDriveDialog(true);
    }
  }, [archiveConfig]);

  // Handle drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentCase) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!currentCase) return;

      const droppedFiles = Array.from(e.dataTransfer?.files || []);
      if (droppedFiles.length > 0) {
        const filePaths = droppedFiles.map(file => (file as any).path).filter(Boolean);
        if (filePaths.length > 0) {
          await addFilesToCase(currentCase.path, filePaths);
        }
      }
    };

    const element = dropZoneRef.current;
    if (element) {
      element.addEventListener('dragover', handleDragOver);
      element.addEventListener('dragleave', handleDragLeave);
      element.addEventListener('drop', handleDrop);
    }

    return () => {
      if (element) {
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('drop', handleDrop);
      }
    };
  }, [currentCase, addFilesToCase]);

  const handleSelectDrive = async () => {
    const success = await selectArchiveDrive();
    if (success) {
      setShowDriveDialog(false);
    }
  };

  const handleCreateCase = async (caseName: string, description: string) => {
    const success = await createCase(caseName, description);
    if (success) {
      setShowCaseDialog(false);
    }
  };

  const handleAddFiles = async () => {
    if (!currentCase) return;
    await addFilesToCase(currentCase.path);
  };

  const handleFileClick = (file: ArchiveFile) => {
    // Don't open folders in the file viewer
    if (file.isFolder) {
      return;
    }
    const index = files.filter(f => !f.isFolder).findIndex(f => f.path === file.path);
    setFileViewerIndex(index);
    setSelectedFile(file);
  };

  const handleNextFile = () => {
    if (fileViewerIndex < files.length - 1) {
      const nextFile = files[fileViewerIndex + 1];
      setFileViewerIndex(fileViewerIndex + 1);
      setSelectedFile(nextFile);
    }
  };

  const handlePreviousFile = () => {
    if (fileViewerIndex > 0) {
      const prevFile = files[fileViewerIndex - 1];
      setFileViewerIndex(fileViewerIndex - 1);
      setSelectedFile(prevFile);
    }
  };

  const handleExtractPDF = (file: ArchiveFile) => {
    setSelectedFileForExtraction(file);
    setShowFolderSelectionDialog(true);
  };

  const [pendingExtraction, setPendingExtraction] = useState<{
    folderName: string;
    folderPath?: string;
    file: ArchiveFile;
    casePath: string;
  } | null>(null);

  const handleFolderSelection = () => {
    // TODO: Implement folder selection from existing folders
    // For now, just show the folder name dialog
    if (!selectedFileForExtraction || !currentCase) {
      console.error('handleFolderSelection: Missing required data', { 
        selectedFileForExtraction, 
        currentCase 
      });
      return;
    }
    console.log('handleFolderSelection: Proceeding with file:', selectedFileForExtraction.name);
    setShowFolderSelectionDialog(false);
    setShowExtractionDialog(true);
  };

  const handleMakeNewFolder = () => {
    if (!selectedFileForExtraction || !currentCase) {
      console.error('handleMakeNewFolder: Missing required data', { 
        selectedFileForExtraction, 
        currentCase 
      });
      return;
    }
    console.log('handleMakeNewFolder: Proceeding with file:', selectedFileForExtraction.name);
    setShowFolderSelectionDialog(false);
    setShowExtractionDialog(true);
  };

  const handleExtractionConfirm = async (folderName: string) => {
    // Capture the values immediately to avoid stale closure issues
    const fileToExtract = selectedFileForExtraction;
    const caseToUse = currentCase;
    
    console.log('handleExtractionConfirm called with:', { folderName, hasSelectedFile: !!fileToExtract, hasCurrentCase: !!caseToUse });
    
    if (!fileToExtract || !caseToUse) {
      console.error('Missing required data:', { selectedFileForExtraction: fileToExtract, currentCase: caseToUse });
      setShowExtractionDialog(false);
      setSelectedFileForExtraction(null);
      return;
    }

    try {
      // Create folder immediately so it appears in the vault
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        setShowExtractionDialog(false);
        return;
      }

      console.log('Creating extraction folder:', { casePath: caseToUse.path, folderName, parentPdf: fileToExtract.path });
      const folderPath = await window.electronAPI.createExtractionFolder(caseToUse.path, folderName, fileToExtract.path);
      console.log('Folder created successfully at:', folderPath);
      
      // Clear search query to ensure folder is visible
      setSearchQuery('');
      
      // Refresh files to show the new folder - use a small delay to ensure folder is fully created
      console.log('Waiting before refresh...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Refreshing files...');
      await refreshFiles();
      console.log('Files refreshed');
      
      setPendingExtraction({
        folderName,
        folderPath,
        file: fileToExtract,
        casePath: caseToUse.path,
      });
      
      setShowExtractionDialog(false);
      setShowSaveParentDialog(true);
      console.log('Dialog closed, SaveParentDialog should open');
    } catch (error) {
      console.error('Failed to create extraction folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create extraction folder';
      toast.error(errorMessage);
      setShowExtractionDialog(false);
      // Don't clear selectedFileForExtraction on error, allow user to retry
    }
  };

  const handleSaveParentConfirm = async (saveParent: boolean) => {
    if (!pendingExtraction) {
      setShowSaveParentDialog(false);
      return;
    }

    setShowSaveParentDialog(false);
    
    try {
      // Refresh files immediately to show the folder with loading state
      if (currentCase) {
        await refreshFiles();
      }

      await extractPDF(
        pendingExtraction.file.path,
        pendingExtraction.casePath,
        pendingExtraction.folderName,
        saveParent
      );
      
      // Refresh files after extraction completes
      if (currentCase) {
        await refreshFiles();
      }
    } catch (error) {
      console.error('Extraction failed:', error);
    }
    
    setSelectedFileForExtraction(null);
    setPendingExtraction(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full border border-cyber-purple-500/60 shadow-sm transition-colors"
              >
                <Home size={18} />
                <span className="text-sm font-medium">Home</span>
              </button>
              {currentCase && (
                <button
                  onClick={() => setCurrentCase(null)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full border border-cyber-purple-500/60 shadow-sm transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="text-sm font-medium">Back</span>
                </button>
              )}
            </div>
            <h1 className="text-4xl font-bold bg-gradient-purple bg-clip-text text-transparent mb-2">
              The Vault
            </h1>
            {currentCase && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => navigateToFolder(currentCase.path)}
                  className={`text-sm ${currentFolderPath ? 'text-cyber-purple-400 hover:text-cyber-purple-300 underline' : 'text-white font-medium'}`}
                >
                  {currentCase.name}
                </button>
                {currentFolderPath && (
                  <>
                    <span className="text-gray-500">/</span>
                    <div className="flex items-center gap-2">
                      {folderNavigationStack.map((path, index) => {
                        const folderName = path.split(/[/\\]/).pop() || path;
                        return (
                          <span key={path} className="flex items-center gap-2">
                            <button
                              onClick={() => navigateToFolder(path)}
                              className="text-cyber-purple-400 hover:text-cyber-purple-300 text-sm underline"
                            >
                              {folderName}
                            </button>
                            <span className="text-gray-500">/</span>
                          </span>
                        );
                      })}
                      <span className="text-white text-sm font-medium">
                        {currentFolderPath.split(/[/\\]/).pop() || currentFolderPath}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
            {currentCase && currentFolderPath && (
              <button
                onClick={goBackToParentFolder}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full border border-cyber-purple-500/60 shadow-sm transition-colors mt-2"
              >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Back to {folderNavigationStack.length > 0 ? 'Parent' : 'Case'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isExtracting && progress && (
          <div className="mb-6">
            <ProgressBar progress={progress} statusMessage={statusMessage} />
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {!currentCase && (
            <button
              onClick={() => setShowCaseDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
            >
              <FolderPlus size={20} />
              Start Case File
            </button>
          )}
          
          {currentCase && (
            <>
              <button
                onClick={handleAddFiles}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
              >
                <Upload size={20} />
                Add Files
              </button>
            </>
          )}

          <div className="flex-1 max-w-md">
            <ArchiveSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={currentCase ? 'Search files...' : 'Search cases...'}
            />
          </div>

          <button
            onClick={() => setShowDriveDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg border border-cyber-purple-500/60 transition-colors font-medium"
          >
            <FolderOpen size={18} />
            Switch Vault Directory
          </button>
        </div>

        {/* Content */}
        <div
          ref={dropZoneRef}
          className={`relative min-h-[400px] ${isDragging ? 'bg-cyber-purple-500/20 border-2 border-cyber-purple-500 border-dashed rounded-lg' : ''}`}
        >
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading...</p>
              </div>
            </div>
          ) : currentCase ? (
            <>
              {/* Case Description */}
              {currentCase.description && !currentFolderPath && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="mb-6 p-4 bg-gray-800/50 border border-cyber-purple-500/30 rounded-lg backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyber-purple-400"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {currentCase.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Unified Grid: Folders and Files in Backend Order */}
              {/* Group folders with their PDFs so folders appear above PDFs in the same column */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <AnimatePresence>
                  {(() => {
                    // Check if we're inside a folder
                    // When inside an extraction folder, PDFs should not show extraction options and no spacers needed
                    const isInsideFolder = !!currentFolderPath;
                    
                    // Group folders with their associated PDFs so they appear stacked vertically
                    // This ensures folders stay above their PDFs in the same column when new files are added
                    // Skip grouping when inside a folder (folders don't appear inside folders)
                    if (isInsideFolder) {
                      // Inside a folder: render files normally without grouping or spacers
                      return files.map((item) => {
                        if (item.isFolder) {
                          return (
                            <ExtractionFolder
                              key={item.path}
                              folder={item}
                              isExtracting={isExtracting && extractingFolderPath === item.path}
                              onClick={() => openFolder(item.path)}
                              onDelete={() => {
                                setFolderToDelete(item);
                                setShowDeleteFolderDialog(true);
                              }}
                              onRename={() => {
                                setFileToRename(item);
                                setShowRenameDialog(true);
                              }}
                            />
                          );
                        } else {
                          // Inside folder: don't show extraction for PDFs (they're already extracted)
                          return (
                            <ArchiveFileItem
                              key={item.path}
                              file={item}
                              onClick={() => handleFileClick(item)}
                              onDelete={() => deleteFile(item.path)}
                              onExtract={undefined} // No extraction inside folders
                              onRename={() => {
                                setFileToRename(item);
                                setShowRenameDialog(true);
                              }}
                            />
                          );
                        }
                      });
                    }
                    
                    const groupedItems: Array<{ type: 'group' | 'single'; items: ArchiveFile[] }> = [];
                    const processedPaths = new Set<string>();
                    
                    // Build a map of PDF paths to their folders (for quick lookup)
                    const pdfToFoldersMap = new Map<string, ArchiveFile[]>();
                    const pdfFiles = files.filter(f => !f.isFolder && f.type === 'pdf');
                    
                    files.forEach((item) => {
                      if (item.isFolder && item.parentPdfName) {
                        // Find the PDF this folder belongs to (case-insensitive match)
                        const associatedPdf = pdfFiles.find(pdf => 
                          pdf.name.toLowerCase() === item.parentPdfName!.toLowerCase()
                        );
                        
                        if (associatedPdf) {
                          const pdfKey = associatedPdf.path;
                          if (!pdfToFoldersMap.has(pdfKey)) {
                            pdfToFoldersMap.set(pdfKey, []);
                          }
                          pdfToFoldersMap.get(pdfKey)!.push(item);
                        }
                      }
                    });
                    
                    // Process items in backend order to maintain sorting
                    files.forEach((item) => {
                      if (processedPaths.has(item.path)) return;
                      
                      if (item.isFolder && item.parentPdfName) {
                        // Find the PDF this folder belongs to
                        const associatedPdf = pdfFiles.find(pdf => 
                          pdf.name.toLowerCase() === item.parentPdfName!.toLowerCase() &&
                          !processedPaths.has(pdf.path)
                        );
                        
                        if (associatedPdf) {
                          // Get all folders for this PDF (maintain order from backend)
                          const allFoldersForPdf = pdfToFoldersMap.get(associatedPdf.path) || [];
                          // Sort folders by their position in the original array to maintain backend order
                          const sortedFolders = allFoldersForPdf.sort((a, b) => {
                            const indexA = files.findIndex(f => f.path === a.path);
                            const indexB = files.findIndex(f => f.path === b.path);
                            return indexA - indexB;
                          });
                          
                          // Group all folders with their PDF (folders first, then PDF)
                          groupedItems.push({
                            type: 'group',
                            items: [...sortedFolders, associatedPdf]
                          });
                          
                          // Mark all as processed
                          sortedFolders.forEach(folder => processedPaths.add(folder.path));
                          processedPaths.add(associatedPdf.path);
                        } else {
                          // Folder without associated PDF found - render as single
                          groupedItems.push({
                            type: 'single',
                            items: [item]
                          });
                          processedPaths.add(item.path);
                        }
                      } else if (item.type === 'pdf' && !processedPaths.has(item.path)) {
                        // Check if this PDF has unprocessed folders
                        const foldersForPdf = (pdfToFoldersMap.get(item.path) || []).filter(
                          folder => !processedPaths.has(folder.path)
                        );
                        
                        if (foldersForPdf.length > 0) {
                          // Sort folders by their position in the original array
                          const sortedFolders = foldersForPdf.sort((a, b) => {
                            const indexA = files.findIndex(f => f.path === a.path);
                            const indexB = files.findIndex(f => f.path === b.path);
                            return indexA - indexB;
                          });
                          
                          // Group folders with this PDF
                          groupedItems.push({
                            type: 'group',
                            items: [...sortedFolders, item]
                          });
                          sortedFolders.forEach(folder => processedPaths.add(folder.path));
                          processedPaths.add(item.path);
                        } else {
                          // Standalone PDF
                          groupedItems.push({
                            type: 'single',
                            items: [item]
                          });
                          processedPaths.add(item.path);
                        }
                      } else if (!item.isFolder && item.type !== 'pdf') {
                        // Non-PDF file
                        groupedItems.push({
                          type: 'single',
                          items: [item]
                        });
                        processedPaths.add(item.path);
                      } else if (item.isFolder && !item.parentPdfName) {
                        // Folder without parentPdfName metadata
                        groupedItems.push({
                          type: 'single',
                          items: [item]
                        });
                        processedPaths.add(item.path);
                      }
                    });
                    
                    return groupedItems.map((group, groupIndex) => {
                      if (group.type === 'group') {
                        // Render folder and PDF stacked vertically
                        return (
                          <div key={`group-${groupIndex}`} className="flex flex-col gap-4">
                            {group.items.map((item) => {
                              if (item.isFolder) {
                                return (
                                  <ExtractionFolder
                                    key={item.path}
                                    folder={item}
                                    isExtracting={isExtracting && extractingFolderPath === item.path}
                                    onClick={() => openFolder(item.path)}
                                    onDelete={() => {
                                      setFolderToDelete(item);
                                      setShowDeleteFolderDialog(true);
                                    }}
                                    onRename={() => {
                                      setFileToRename(item);
                                      setShowRenameDialog(true);
                                    }}
                                  />
                                );
                              } else {
                                return (
                                  <ArchiveFileItem
                                    key={item.path}
                                    file={item}
                                    onClick={() => handleFileClick(item)}
                                    onDelete={() => deleteFile(item.path)}
                                    onExtract={item.type === 'pdf' ? () => handleExtractPDF(item) : undefined}
                                    onRename={() => {
                                      setFileToRename(item);
                                      setShowRenameDialog(true);
                                    }}
                                  />
                                );
                              }
                            })}
                          </div>
                        );
                      } else {
                        // Single item
                        const item = group.items[0];
                        if (item.isFolder) {
                          return (
                            <ExtractionFolder
                              key={item.path}
                              folder={item}
                              isExtracting={isExtracting && extractingFolderPath === item.path}
                              onClick={() => openFolder(item.path)}
                              onDelete={() => {
                                setFolderToDelete(item);
                                setShowDeleteFolderDialog(true);
                              }}
                              onRename={() => {
                                setFileToRename(item);
                                setShowRenameDialog(true);
                              }}
                            />
                          );
                        } else if (item.type === 'pdf') {
                          // Standalone PDF: Add spacer above to align with PDFs in groups
                          // The spacer matches the height of a folder (p-6 + icon + text) + gap-4
                          return (
                            <div key={item.path} className="flex flex-col gap-4">
                              {/* Invisible spacer matching folder height to align PDFs */}
                              <div className="invisible rounded-lg border-2 border-transparent p-6">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-16 h-16" />
                                  <div className="h-5 w-full" />
                                </div>
                              </div>
                              <ArchiveFileItem
                                file={item}
                                onClick={() => handleFileClick(item)}
                                onDelete={() => deleteFile(item.path)}
                                onExtract={() => handleExtractPDF(item)}
                                onRename={() => {
                                  setFileToRename(item);
                                  setShowRenameDialog(true);
                                }}
                              />
                            </div>
                          );
                        } else {
                          // Non-PDF file - no spacer needed
                          return (
                            <ArchiveFileItem
                              key={item.path}
                              file={item}
                              onClick={() => handleFileClick(item)}
                              onDelete={() => deleteFile(item.path)}
                              onExtract={item.type === 'pdf' ? () => handleExtractPDF(item) : undefined}
                              onRename={() => {
                                setFileToRename(item);
                                setShowRenameDialog(true);
                              }}
                            />
                          );
                        }
                      }
                    });
                  })()}
                </AnimatePresence>
              </div>
            </>
          ) : (
            // Cases Grid
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {cases.map((caseItem) => (
                  <CaseFolder
                    key={caseItem.path}
                    caseItem={caseItem}
                    isExtracting={isExtracting && extractingCasePath === caseItem.path}
                    onClick={() => setCurrentCase(caseItem)}
                    onDelete={() => deleteCase(caseItem.path)}
                    onEditBackground={() => updateCaseBackgroundImage(caseItem.path)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty state */}
          {!loading && (
            <>
              {!currentCase && cases.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <p className="text-gray-400 text-lg mb-4">No cases yet</p>
                  <button
                    onClick={() => setShowCaseDialog(true)}
                    className="px-6 py-3 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
                  >
                    Create Your First Case
                  </button>
                </div>
              )}
              {currentCase && files.filter(f => !f.isFolder).length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <p className="text-gray-400 text-lg mb-4">No files in this case</p>
                  <button
                    onClick={handleAddFiles}
                    className="px-6 py-3 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
                  >
                    Add Files
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ArchiveDriveDialog
        isOpen={showDriveDialog}
        onClose={() => setShowDriveDialog(false)}
        onConfirm={handleSelectDrive}
      />

      <CaseNameDialog
        isOpen={showCaseDialog}
        onClose={() => setShowCaseDialog(false)}
        onConfirm={handleCreateCase}
      />

      <FolderSelectionDialog
        isOpen={showFolderSelectionDialog}
        onClose={() => {
          setShowFolderSelectionDialog(false);
          // Only clear selectedFileForExtraction if user is canceling, not when proceeding
          // The handleFolderSelection and handleMakeNewFolder functions handle dialog transitions
          setSelectedFileForExtraction(null);
        }}
        onSelectDirectory={handleFolderSelection}
        onMakeNewFolder={handleMakeNewFolder}
      />

      <ExtractionFolderDialog
        isOpen={showExtractionDialog}
        onClose={() => {
          setShowExtractionDialog(false);
          // Only clear selectedFileForExtraction if user explicitly cancels
          // Don't clear it during normal flow transitions
          setSelectedFileForExtraction(null);
        }}
        onConfirm={handleExtractionConfirm}
      />

      <SaveParentDialog
        isOpen={showSaveParentDialog}
        onClose={() => {
          setShowSaveParentDialog(false);
          setPendingExtraction(null);
          setSelectedFileForExtraction(null);
        }}
        onConfirm={handleSaveParentConfirm}
      />

      <DeleteFolderConfirmDialog
        isOpen={showDeleteFolderDialog}
        folderName={folderToDelete?.name || ''}
        onClose={() => {
          setShowDeleteFolderDialog(false);
          setFolderToDelete(null);
        }}
        onConfirm={async () => {
          if (folderToDelete) {
            await deleteFile(folderToDelete.path, true);
            setFolderToDelete(null);
          }
        }}
      />

      <RenameFileDialog
        isOpen={showRenameDialog}
        currentName={fileToRename?.name || ''}
        onClose={() => {
          setShowRenameDialog(false);
          setFileToRename(null);
        }}
        onConfirm={async (newName) => {
          if (fileToRename) {
            // Close dialog immediately for better UX
            setShowRenameDialog(false);
            const filePath = fileToRename.path;
            setFileToRename(null);
            // Perform rename asynchronously
            renameFile(filePath, newName).catch((error) => {
              console.error('Rename failed:', error);
            });
          }
        }}
      />

      {/* File Viewer */}
      {selectedFile && !selectedFile.isFolder && (
        <ArchiveFileViewer
          file={selectedFile}
          files={files.filter(f => !f.isFolder)}
          onClose={() => setSelectedFile(null)}
          onNext={fileViewerIndex < files.filter(f => !f.isFolder).length - 1 ? handleNextFile : undefined}
          onPrevious={fileViewerIndex > 0 ? handlePreviousFile : undefined}
        />
      )}
    </div>
  );
}

