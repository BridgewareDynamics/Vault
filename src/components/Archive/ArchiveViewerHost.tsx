import { lazy, Suspense } from 'react';
import { ArchiveFile } from '../../types';

const ArchiveFileViewer = lazy(() =>
  import('./ArchiveFileViewer').then((module) => ({ default: module.ArchiveFileViewer })),
);
const SecurityCheckerModal = lazy(() =>
  import('../SecurityCheckerModal').then((module) => ({ default: module.SecurityCheckerModal })),
);
const PDFExtractionModal = lazy(() =>
  import('../PDFExtractionModal').then((module) => ({ default: module.PDFExtractionModal })),
);

// Folders whose parentPdfName matches the given PDF path's file name.
function findExistingFoldersForPdf(files: ArchiveFile[], pdfPath: string | null) {
  if (!pdfPath) {
    return undefined;
  }
  const targetName = pdfPath.split(/[/\\]/).pop()?.toLowerCase();
  return files.filter(
    (file) =>
      file.isFolder &&
      file.parentPdfName &&
      file.parentPdfName.toLowerCase() === targetName,
  );
}

interface ArchiveViewerHostProps {
  // File viewer
  selectedFile: ArchiveFile | null;
  files: ArchiveFile[];
  fileViewerIndex: number;
  initialPage: number | undefined;
  onCloseViewer: () => void;
  onNextFile: () => void;
  onPreviousFile: () => void;
  onInitialPageApplied: () => void;
  onTranscribe: (file: ArchiveFile) => void;
  // Security checker modal
  showSecurityChecker: boolean;
  pdfPathForAudit: string | null;
  onCloseSecurityChecker: () => void;
  onReportSaved: () => void;
  // PDF extraction modal
  showPDFExtraction: boolean;
  pdfPathForExtraction: string | null;
  onClosePDFExtraction: () => void;
  onExtractionComplete: () => void;
  // Shared
  currentCasePath: string | null;
}

/**
 * Hosts the lazily-loaded Archive viewer surfaces: the file viewer overlay plus
 * the security-checker and PDF-extraction modals. Behavior preserved verbatim
 * from ArchivePage; only the markup location moved.
 */
export function ArchiveViewerHost({
  selectedFile,
  files,
  fileViewerIndex,
  initialPage,
  onCloseViewer,
  onNextFile,
  onPreviousFile,
  onInitialPageApplied,
  onTranscribe,
  showSecurityChecker,
  pdfPathForAudit,
  onCloseSecurityChecker,
  onReportSaved,
  showPDFExtraction,
  pdfPathForExtraction,
  onClosePDFExtraction,
  onExtractionComplete,
  currentCasePath,
}: ArchiveViewerHostProps) {
  const nonFolderFiles = files.filter((f) => !f.isFolder);

  return (
    <>
      {/* File Viewer */}
      {selectedFile && !selectedFile.isFolder && (
        <Suspense fallback={null}>
          <ArchiveFileViewer
            file={selectedFile}
            files={nonFolderFiles}
            onTranscribe={(file) => onTranscribe(file)}
            onClose={onCloseViewer}
            onNext={fileViewerIndex < nonFolderFiles.length - 1 ? onNextFile : undefined}
            onPrevious={fileViewerIndex > 0 ? onPreviousFile : undefined}
            initialPage={initialPage}
            onInitialPageApplied={onInitialPageApplied}
          />
        </Suspense>
      )}

      {showSecurityChecker && (
        <Suspense fallback={null}>
          <SecurityCheckerModal
            isOpen={showSecurityChecker}
            onClose={onCloseSecurityChecker}
            initialPdfPath={pdfPathForAudit}
            caseFolderPath={currentCasePath}
            onReportSaved={onReportSaved}
            existingFolders={findExistingFoldersForPdf(files, pdfPathForAudit)}
          />
        </Suspense>
      )}

      {showPDFExtraction && (
        <Suspense fallback={null}>
          <PDFExtractionModal
            isOpen={showPDFExtraction}
            onClose={onClosePDFExtraction}
            initialPdfPath={pdfPathForExtraction}
            caseFolderPath={currentCasePath}
            onExtractionComplete={onExtractionComplete}
            existingFolders={findExistingFoldersForPdf(files, pdfPathForExtraction)}
          />
        </Suspense>
      )}
    </>
  );
}
