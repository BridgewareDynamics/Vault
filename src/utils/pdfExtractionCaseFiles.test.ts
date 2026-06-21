import { describe, expect, it } from 'vitest';
import {
  filterPdfsWithoutExtractionFolders,
  getPdfNamesWithExtractionFolders,
} from './pdfExtractionCaseFiles';

describe('pdfExtractionCaseFiles', () => {
  const caseEntries = [
    {
      name: 'Report-images',
      path: '/case/Report-images',
      isFolder: true,
      folderType: 'extraction' as const,
      parentPdfName: 'Report.pdf',
    },
    { name: 'Report.pdf', path: '/case/Report.pdf', isFolder: false },
    { name: 'Draft.pdf', path: '/case/Draft.pdf', isFolder: false },
    { name: 'Notes', path: '/case/Notes', isFolder: true, folderType: 'case' as const },
  ];

  it('detects PDFs linked to extraction folders', () => {
    const linked = getPdfNamesWithExtractionFolders(caseEntries);
    expect(linked.has('report.pdf')).toBe(true);
    expect(linked.has('draft.pdf')).toBe(false);
  });

  it('filters out PDFs that already have extraction folders', () => {
    const pdfs = [
      { name: 'Report.pdf', path: '/case/Report.pdf' },
      { name: 'Draft.pdf', path: '/case/Draft.pdf' },
    ];
    const pending = filterPdfsWithoutExtractionFolders(pdfs, caseEntries);
    expect(pending).toEqual([{ name: 'Draft.pdf', path: '/case/Draft.pdf' }]);
  });

  it('matches parent PDF names case-insensitively', () => {
    const entries = [
      {
        name: 'doc-images',
        path: '/case/doc-images',
        isFolder: true,
        parentPdfName: 'DOC.PDF',
      },
      { name: 'doc.pdf', path: '/case/doc.pdf', isFolder: false },
    ];
    expect(filterPdfsWithoutExtractionFolders([{ name: 'doc.pdf', path: '' }], entries)).toEqual([]);
  });
});
