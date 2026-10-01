import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, FileText } from 'lucide-react';
import { ArchiveFile, ArchiveCase, CategoryTag } from '../../types';
import { CaseFolder } from './CaseFolder';
import { RegularFolder } from './RegularFolder';
import { ArchiveFileItem } from './ArchiveFileItem';
import { ExtractionFolder } from './ExtractionFolder';
import { VirtualizedItemGrid } from '../Shared/VirtualizedItemGrid';
import { getResponsiveColumnCount } from '../../utils/virtualGridUtils';

// Case-root grid entry: either a folder+PDF group (stacked vertically) or a single item.
type GroupedGridItem = { type: 'group' | 'single'; items: ArchiveFile[] };

// Invisible spacer that aligns single PDFs/files with PDFs that sit beneath a folder.
// Module-scoped so it is a stable reference (not a hook dependency).
function renderAlignmentSpacer() {
  return (
    <div className="invisible rounded-lg border-2 border-transparent p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16" />
        <div className="h-5 w-full" />
      </div>
    </div>
  );
}

interface ArchiveGridProps {
  loading: boolean;
  isPastel: boolean;
  cases: ArchiveCase[];
  files: ArchiveFile[];
  currentCase: ArchiveCase | null;
  currentFolderPath: string | null;
  // Extraction status
  isExtracting: boolean;
  extractingCasePath: string | null;
  extractingFolderPath: string | null;
  // Drag-and-drop
  dragOverFolder: string | null;
  onFolderDragOver: (itemPath: string, e: React.DragEvent) => void;
  onFolderDragLeave: (e: React.DragEvent) => void;
  onFolderDrop: (itemPath: string, e: React.DragEvent) => void;
  onDragStartFile: (file: ArchiveFile) => void;
  onDragEndFile: () => void;
  // Folder handlers
  onOpenFolder: (folderPath: string) => void;
  onRequestDeleteFolder: (folder: ArchiveFile) => void;
  onRequestRename: (file: ArchiveFile) => void;
  onUpdateFolderBackgroundImage: (folderPath: string) => void;
  // File handlers
  onFileClick: (file: ArchiveFile) => void;
  onDeleteFileDirect: (item: ArchiveFile) => void;
  onDeleteFileWithConfirm: (item: ArchiveFile) => void;
  onExtractPDF: (file: ArchiveFile) => void;
  onRunPDFAudit: (file: ArchiveFile) => void;
  onTranscribeMedia: (file: ArchiveFile) => void;
  onFileTagClick: (filePath: string) => void;
  onRequestThumbnail: (file: ArchiveFile) => void;
  getTagById: (tagId: string | undefined) => CategoryTag | undefined;
  // Case handlers
  onSelectCase: (caseItem: ArchiveCase) => void;
  onDeleteCase: (casePath: string) => void;
  onRenameCase: (caseItem: ArchiveCase) => void;
  onUpdateCaseBackgroundImage: (casePath: string) => void;
  onCaseTagClick: (casePath: string) => void;
  onEditCaseDescription: (caseItem: ArchiveCase) => void;
  // Empty-state handlers
  onCreateCase: () => void;
  onAddFiles: () => void;
}

/**
 * Renders the Archive content body: the loading state, the case / folder /
 * grouped grids (virtualized via {@link VirtualizedItemGrid}) and the empty
 * states. Extracted from ArchivePage with behavior preserved verbatim.
 */
export function ArchiveGrid({
  loading,
  isPastel,
  cases,
  files,
  currentCase,
  currentFolderPath,
  isExtracting,
  extractingCasePath,
  extractingFolderPath,
  dragOverFolder,
  onFolderDragOver,
  onFolderDragLeave,
  onFolderDrop,
  onDragStartFile,
  onDragEndFile,
  onOpenFolder,
  onRequestDeleteFolder,
  onRequestRename,
  onUpdateFolderBackgroundImage,
  onFileClick,
  onDeleteFileDirect,
  onDeleteFileWithConfirm,
  onExtractPDF,
  onRunPDFAudit,
  onTranscribeMedia,
  onFileTagClick,
  onRequestThumbnail,
  getTagById,
  onSelectCase,
  onDeleteCase,
  onRenameCase,
  onUpdateCaseBackgroundImage,
  onCaseTagClick,
  onEditCaseDescription,
  onCreateCase,
  onAddFiles,
}: ArchiveGridProps) {
  // Inside a folder: render each item without grouping/spacers.
  const renderFolderViewItem = useCallback((item: ArchiveFile) => {
    if (item.isFolder) {
      // Only use ExtractionFolder if it's actually an extraction folder
      if (item.folderType === 'extraction') {
        return (
          <ExtractionFolder
            folder={item}
            isExtracting={isExtracting && extractingFolderPath === item.path}
            onClick={() => onOpenFolder(item.path)}
            onDelete={() => onRequestDeleteFolder(item)}
            onRename={() => onRequestRename(item)}
            onEditBackground={() => onUpdateFolderBackgroundImage(item.path)}
          />
        );
      }
      // Regular folder - supports drag-and-drop
      return (
        <RegularFolder
          folder={item}
          onClick={() => onOpenFolder(item.path)}
          onDelete={() => onRequestDeleteFolder(item)}
          onRename={() => onRequestRename(item)}
          onEditBackground={() => onUpdateFolderBackgroundImage(item.path)}
          onDragOver={(e) => onFolderDragOver(item.path, e)}
          onDragLeave={onFolderDragLeave}
          onDrop={(e) => onFolderDrop(item.path, e)}
          isDragOver={dragOverFolder === item.path}
        />
      );
    }
    // Inside folder: don't show extraction for PDFs (they're already extracted)
    return (
      <ArchiveFileItem
        file={item}
        onClick={() => onFileClick(item)}
        onDelete={() => onDeleteFileDirect(item)}
        onExtract={undefined}
        onRunAudit={item.type === 'pdf' ? () => onRunPDFAudit(item) : undefined}
        onTranscribe={item.type === 'audio' || item.type === 'video' ? () => onTranscribeMedia(item) : undefined}
        onRename={() => onRequestRename(item)}
        onDragStart={onDragStartFile}
        onDragEnd={onDragEndFile}
        caseTag={item.categoryTagId ? getTagById(item.categoryTagId) : null}
        onTagClick={() => onFileTagClick(item.path)}
        onRequestThumbnail={() => onRequestThumbnail(item)}
      />
    );
  }, [isExtracting, extractingFolderPath, onOpenFolder, onRequestDeleteFolder, onRequestRename, onUpdateFolderBackgroundImage, onFolderDragOver, onFolderDragLeave, onFolderDrop, dragOverFolder, onFileClick, onDeleteFileDirect, onRunPDFAudit, onTranscribeMedia, onDragStartFile, onDragEndFile, getTagById, onFileTagClick, onRequestThumbnail]);

  const renderGroupedRegularFolder = useCallback((item: ArchiveFile) => (
    <div className="flex flex-col gap-4">
      {/* Invisible spacer matching folder height to align with PDFs */}
      {renderAlignmentSpacer()}
      <RegularFolder
        folder={item}
        onClick={() => onOpenFolder(item.path)}
        onDelete={() => onRequestDeleteFolder(item)}
        onRename={() => onRequestRename(item)}
        onEditBackground={() => onUpdateFolderBackgroundImage(item.path)}
        onDragOver={(e) => onFolderDragOver(item.path, e)}
        onDragLeave={onFolderDragLeave}
        onDrop={(e) => onFolderDrop(item.path, e)}
        isDragOver={dragOverFolder === item.path}
      />
    </div>
  ), [onOpenFolder, onRequestDeleteFolder, onRequestRename, onUpdateFolderBackgroundImage, onFolderDragOver, onFolderDragLeave, onFolderDrop, dragOverFolder]);

  // Case-root grid: render a grouped (folder + PDF stacked) or single entry.
  const renderGroupedItem = useCallback((group: GroupedGridItem) => {
    if (group.type === 'group') {
      // Render folder(s) and PDF stacked vertically
      return (
        <div className="flex flex-col gap-4">
          {group.items.map((item) => {
            if (item.isFolder) {
              if (item.folderType === 'case' || (!item.folderType && !item.parentPdfName)) {
                return (
                  <div key={item.path} className="flex flex-col gap-4">
                    {renderGroupedRegularFolder(item)}
                  </div>
                );
              }
              return (
                <ExtractionFolder
                  key={item.path}
                  folder={item}
                  isExtracting={isExtracting && extractingFolderPath === item.path}
                  onClick={() => onOpenFolder(item.path)}
                  onDelete={() => onRequestDeleteFolder(item)}
                  onRename={() => onRequestRename(item)}
                />
              );
            }
            return (
              <ArchiveFileItem
                key={item.path}
                file={item}
                onClick={() => onFileClick(item)}
                onDelete={() => onDeleteFileWithConfirm(item)}
                onExtract={item.type === 'pdf' ? () => onExtractPDF(item) : undefined}
                onRunAudit={item.type === 'pdf' ? () => onRunPDFAudit(item) : undefined}
                onTranscribe={item.type === 'audio' || item.type === 'video' ? () => onTranscribeMedia(item) : undefined}
                onRename={() => onRequestRename(item)}
                onDragStart={onDragStartFile}
                onDragEnd={onDragEndFile}
                caseTag={item.categoryTagId ? getTagById(item.categoryTagId) : null}
                onTagClick={() => onFileTagClick(item.path)}
                onRequestThumbnail={() => onRequestThumbnail(item)}
              />
            );
          })}
        </div>
      );
    }

    // Single item
    const item = group.items[0];
    if (item.isFolder) {
      if (item.folderType === 'case' || (!item.folderType && !item.parentPdfName)) {
        return renderGroupedRegularFolder(item);
      }
      return (
        <ExtractionFolder
          folder={item}
          isExtracting={isExtracting && extractingFolderPath === item.path}
          onClick={() => onOpenFolder(item.path)}
          onDelete={() => onRequestDeleteFolder(item)}
          onRename={() => onRequestRename(item)}
          onEditBackground={() => onUpdateFolderBackgroundImage(item.path)}
        />
      );
    }
    if (item.type === 'pdf') {
      // Standalone PDF: spacer above to align with PDFs in groups
      return (
        <div className="flex flex-col gap-4">
          {renderAlignmentSpacer()}
          <ArchiveFileItem
            file={item}
            onClick={() => onFileClick(item)}
            onDelete={() => onDeleteFileWithConfirm(item)}
            onExtract={() => onExtractPDF(item)}
            onRunAudit={item.type === 'pdf' ? () => onRunPDFAudit(item) : undefined}
            onRename={() => onRequestRename(item)}
            onDragStart={onDragStartFile}
            onDragEnd={onDragEndFile}
            caseTag={item.categoryTagId ? getTagById(item.categoryTagId) : null}
            onTagClick={() => onFileTagClick(item.path)}
            onRequestThumbnail={() => onRequestThumbnail(item)}
          />
        </div>
      );
    }
    // Non-PDF file: spacer above to align with PDFs
    return (
      <div className="flex flex-col gap-4">
        {renderAlignmentSpacer()}
        <ArchiveFileItem
          file={item}
          onClick={() => onFileClick(item)}
          onDelete={() => onDeleteFileDirect(item)}
          onExtract={undefined}
          onRunAudit={undefined}
          onTranscribe={item.type === 'audio' || item.type === 'video' ? () => onTranscribeMedia(item) : undefined}
          onRename={() => onRequestRename(item)}
          onDragStart={onDragStartFile}
          onDragEnd={onDragEndFile}
          caseTag={item.categoryTagId ? getTagById(item.categoryTagId) : null}
          onTagClick={() => onFileTagClick(item.path)}
          onRequestThumbnail={() => onRequestThumbnail(item)}
        />
      </div>
    );
  }, [isExtracting, extractingFolderPath, onOpenFolder, onRequestDeleteFolder, onRequestRename, onUpdateFolderBackgroundImage, renderGroupedRegularFolder, onFileClick, onDeleteFileWithConfirm, onDeleteFileDirect, onExtractPDF, onRunPDFAudit, onTranscribeMedia, onDragStartFile, onDragEndFile, getTagById, onFileTagClick, onRequestThumbnail]);

  const renderCaseItem = useCallback((caseItem: ArchiveCase) => (
    <CaseFolder
      caseItem={caseItem}
      isExtracting={isExtracting && extractingCasePath === caseItem.path}
      onClick={() => onSelectCase(caseItem)}
      onDelete={() => onDeleteCase(caseItem.path)}
      onRename={() => onRenameCase(caseItem)}
      onEditBackground={() => onUpdateCaseBackgroundImage(caseItem.path)}
      onTagClick={() => onCaseTagClick(caseItem.path)}
      onEditDescription={() => onEditCaseDescription(caseItem)}
    />
  ), [isExtracting, extractingCasePath, onSelectCase, onDeleteCase, onRenameCase, onUpdateCaseBackgroundImage, onCaseTagClick, onEditCaseDescription]);

  // Group folders with their associated PDFs so they appear stacked vertically.
  // Preserves the original backend ordering and grouping semantics.
  const groupedGridItems = useMemo<GroupedGridItem[]>(() => {
    const groupedItems: GroupedGridItem[] = [];
    const processedPaths = new Set<string>();

    // Build complete map first (all folders for all PDFs)
    const pdfToFoldersMap = new Map<string, ArchiveFile[]>();
    const pdfFiles = files.filter(f => !f.isFolder && f.type === 'pdf');

    // First pass: Collect ALL folders for each PDF
    files.forEach((item) => {
      if (item.isFolder && item.parentPdfName) {
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

    // Second pass: Create groups in backend order
    files.forEach((item) => {
      if (processedPaths.has(item.path)) return;

      if (item.type === 'pdf' && !processedPaths.has(item.path)) {
        const foldersForPdf = (pdfToFoldersMap.get(item.path) || []).filter(
          folder => !processedPaths.has(folder.path)
        );

        if (foldersForPdf.length > 0) {
          const sortedFolders = foldersForPdf.sort((a, b) => {
            const indexA = files.findIndex(f => f.path === a.path);
            const indexB = files.findIndex(f => f.path === b.path);
            return indexA - indexB;
          });

          groupedItems.push({ type: 'group', items: [...sortedFolders, item] });
          sortedFolders.forEach(folder => processedPaths.add(folder.path));
          processedPaths.add(item.path);
        } else {
          groupedItems.push({ type: 'single', items: [item] });
          processedPaths.add(item.path);
        }
      } else if (item.isFolder && item.parentPdfName) {
        const associatedPdf = pdfFiles.find(pdf =>
          pdf.name.toLowerCase() === item.parentPdfName!.toLowerCase()
        );
        if (!associatedPdf || processedPaths.has(associatedPdf.path)) {
          groupedItems.push({ type: 'single', items: [item] });
          processedPaths.add(item.path);
        }
      } else if (item.isFolder && !item.parentPdfName) {
        groupedItems.push({ type: 'single', items: [item] });
        processedPaths.add(item.path);
      } else if (!item.isFolder && item.type !== 'pdf') {
        groupedItems.push({ type: 'single', items: [item] });
        processedPaths.add(item.path);
      }
    });

    return groupedItems;
  }, [files]);

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-6">
            <div className="inline-flex p-6 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 rounded-2xl border-2 border-cyber-cyan-400/30">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan-400"></div>
            </div>
            <p className="text-gray-300 text-lg">Loading...</p>
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
              className={`mb-6 p-4 rounded-lg backdrop-blur-sm ${
                isPastel
                  ? 'bg-white/50 border border-pink-300/30'
                  : 'bg-gray-800/50 border border-cyber-purple-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isPastel ? 'bg-pink-400' : 'bg-cyber-purple-400'
                  }`}></div>
                </div>
                <div className="flex-1">
                  <p className={`text-sm leading-relaxed ${
                    isPastel ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {currentCase.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Unified Grid: Folders and Files in Backend Order */}
          {/* Group folders with their PDFs so folders appear above PDFs in the same column */}
          {currentFolderPath ? (
            <VirtualizedItemGrid
              items={files}
              getItemKey={(item) => item.path}
              getColumnCount={getResponsiveColumnCount}
              nonVirtualClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
              gap={24}
              renderItem={renderFolderViewItem}
            />
          ) : (
            <VirtualizedItemGrid
              items={groupedGridItems}
              getItemKey={(group, index) => (group.type === 'group' ? `group-${index}` : group.items[0].path)}
              getColumnCount={getResponsiveColumnCount}
              nonVirtualClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
              gap={24}
              renderItem={renderGroupedItem}
            />
          )}
        </>
      ) : (
        // Cases Grid
        <VirtualizedItemGrid
          items={cases}
          getItemKey={(caseItem) => caseItem.path}
          getColumnCount={getResponsiveColumnCount}
          nonVirtualClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
          gap={24}
          renderItem={renderCaseItem}
        />
      )}

      {/* Empty state */}
      {!loading && (
        <>
          {!currentCase && cases.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className={`inline-flex p-8 rounded-2xl border mb-6 ${
                isPastel
                  ? 'bg-white/50 border-pink-300/20'
                  : 'bg-gray-800/50 border-cyber-purple-400/20'
              }`}>
                <FolderOpen className={`w-20 h-20 ${
                  isPastel ? 'text-pink-400/50' : 'text-cyber-purple-400/50'
                }`} />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${
                isPastel ? 'text-gray-800' : 'text-gray-300'
              }`}>No cases yet</h3>
              <p className={`text-lg mb-6 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>Create your first case file to get started</p>
              <button
                onClick={onCreateCase}
                className={`px-6 py-3 rounded-lg font-semibold text-white text-base transition-all shadow-lg transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ${
                  isPastel
                    ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 hover:from-pink-500 hover:via-purple-500 hover:to-pink-500 hover:shadow-pink-400/50'
                    : 'bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 hover:from-cyan-700 hover:via-purple-700 hover:to-cyan-700 hover:shadow-cyan-500/50'
                }`}
                aria-label="Create your first case"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative z-10">Create Your First Case</span>
              </button>
            </div>
          )}
          {currentCase && files.filter(f => !f.isFolder).length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className={`inline-flex p-8 rounded-2xl border mb-6 ${
                isPastel
                  ? 'bg-white/50 border-pink-300/20'
                  : 'bg-gray-800/50 border-cyber-purple-400/20'
              }`}>
                <FileText className={`w-20 h-20 ${
                  isPastel ? 'text-pink-400/50' : 'text-cyber-purple-400/50'
                }`} />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${
                isPastel ? 'text-gray-800' : 'text-gray-300'
              }`}>No files in this case</h3>
              <p className={`text-lg mb-6 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>Add files to get started organizing your case</p>
              <button
                onClick={onAddFiles}
                className={`px-6 py-3 rounded-lg font-semibold text-white text-base transition-all shadow-lg transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ${
                  isPastel
                    ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 hover:from-pink-500 hover:via-purple-500 hover:to-pink-500 hover:shadow-pink-400/50'
                    : 'bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 hover:from-cyan-700 hover:via-purple-700 hover:to-cyan-700 hover:shadow-cyan-500/50'
                }`}
                aria-label="Add files to this case"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative z-10">Add Files</span>
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
