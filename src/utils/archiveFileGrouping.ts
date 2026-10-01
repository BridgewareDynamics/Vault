import { ArchiveFile } from '../types';

export interface ArchiveFileGroup {
  type: 'group' | 'single';
  items: ArchiveFile[];
}

/**
 * Groups extraction folders with their parent PDFs for case-root grid layout.
 * Inside nested folders, callers should render a flat list instead.
 */
export function groupArchiveFilesForCaseRoot(files: ArchiveFile[]): ArchiveFileGroup[] {
  const groupedItems: ArchiveFileGroup[] = [];
  const processedPaths = new Set<string>();
  const pdfToFoldersMap = new Map<string, ArchiveFile[]>();
  const pdfFiles = files.filter((file) => !file.isFolder && file.type === 'pdf');

  files.forEach((item) => {
    if (item.isFolder && item.parentPdfName) {
      const associatedPdf = pdfFiles.find(
        (pdf) => pdf.name.toLowerCase() === item.parentPdfName!.toLowerCase(),
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

  files.forEach((item) => {
    if (processedPaths.has(item.path)) {
      return;
    }

    if (item.type === 'pdf' && !processedPaths.has(item.path)) {
      const foldersForPdf = (pdfToFoldersMap.get(item.path) || []).filter(
        (folder) => !processedPaths.has(folder.path),
      );

      if (foldersForPdf.length > 0) {
        const sortedFolders = foldersForPdf.sort((a, b) => {
          const indexA = files.findIndex((file) => file.path === a.path);
          const indexB = files.findIndex((file) => file.path === b.path);
          return indexA - indexB;
        });

        groupedItems.push({
          type: 'group',
          items: [...sortedFolders, item],
        });
        sortedFolders.forEach((folder) => processedPaths.add(folder.path));
        processedPaths.add(item.path);
      } else {
        groupedItems.push({ type: 'single', items: [item] });
        processedPaths.add(item.path);
      }
    } else if (item.isFolder && item.parentPdfName) {
      const associatedPdf = pdfFiles.find(
        (pdf) => pdf.name.toLowerCase() === item.parentPdfName!.toLowerCase(),
      );
      if (!associatedPdf || processedPaths.has(associatedPdf.path)) {
        groupedItems.push({ type: 'single', items: [item] });
        processedPaths.add(item.path);
      }
    } else if (!processedPaths.has(item.path)) {
      groupedItems.push({ type: 'single', items: [item] });
      processedPaths.add(item.path);
    }
  });

  return groupedItems;
}
