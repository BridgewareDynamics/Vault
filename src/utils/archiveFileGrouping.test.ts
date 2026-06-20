import { describe, expect, it } from 'vitest';
import { groupArchiveFilesForCaseRoot } from './archiveFileGrouping';
import { ArchiveFile } from '../types';

function pdf(name: string, path: string): ArchiveFile {
  return { name, path, size: 1, modified: 0, type: 'pdf', isFolder: false };
}

function folder(name: string, path: string, parentPdfName?: string): ArchiveFile {
  return {
    name,
    path,
    size: 0,
    modified: 0,
    type: 'other',
    isFolder: true,
    folderType: parentPdfName ? 'extraction' : 'case',
    parentPdfName,
  };
}

describe('groupArchiveFilesForCaseRoot', () => {
  it('groups extraction folders above their parent PDF', () => {
    const files = [
      folder('Report-images', '/case/Report-images', 'Report.pdf'),
      pdf('Report.pdf', '/case/Report.pdf'),
      pdf('Other.pdf', '/case/Other.pdf'),
    ];

    const groups = groupArchiveFilesForCaseRoot(files);
    expect(groups).toHaveLength(2);
    expect(groups[0].type).toBe('group');
    expect(groups[0].items.map((item) => item.name)).toEqual(['Report-images', 'Report.pdf']);
    expect(groups[1].items[0].name).toBe('Other.pdf');
  });

  it('preserves backend order for standalone files', () => {
    const files = [pdf('A.pdf', '/a'), pdf('B.pdf', '/b')];
    const groups = groupArchiveFilesForCaseRoot(files);
    expect(groups.map((group) => group.items[0].name)).toEqual(['A.pdf', 'B.pdf']);
  });
});
