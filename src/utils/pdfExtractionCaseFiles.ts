/** Case listing row shape returned by `listCaseFiles` (subset). */
export interface CaseListingEntry {
  name: string;
  path: string;
  isFolder?: boolean;
  parentPdfName?: string;
  folderType?: 'extraction' | 'case';
}

/**
 * PDF file names (lowercase) that already have a Vault extraction folder linked via
 * `.parent-pdf` / `parentPdfName` (the folder shown above the PDF in the case view).
 */
export function getPdfNamesWithExtractionFolders(entries: CaseListingEntry[]): Set<string> {
  const linkedPdfNames = new Set<string>();

  for (const entry of entries) {
    if (!entry.isFolder || !entry.parentPdfName?.trim()) {
      continue;
    }
    linkedPdfNames.add(entry.parentPdfName.trim().toLowerCase());
  }

  return linkedPdfNames;
}

export function filterPdfsWithoutExtractionFolders<T extends { name: string }>(
  pdfFiles: T[],
  caseEntries: CaseListingEntry[]
): T[] {
  const alreadyConverted = getPdfNamesWithExtractionFolders(caseEntries);
  return pdfFiles.filter((pdf) => !alreadyConverted.has(pdf.name.toLowerCase()));
}
