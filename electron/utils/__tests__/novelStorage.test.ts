import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as path from 'path';
import {
  createNovel,
  readNovelDocument,
  moveNovelToCase,
  exportNovelToDocx,
  exportNovelToEpub,
  type NovelDocumentStored,
} from '../novelStorage';

vi.mock('../archiveConfig', () => ({
  getArchiveDrive: vi.fn(async () => 'D:/The Vault App'),
}));

vi.mock('../pathValidator', () => ({
  isSafePath: vi.fn(() => true),
}));

vi.mock('../logger', () => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => true),
  };
});

const writeFileMock = vi.fn();
const readFileMock = vi.fn(async (..._args: unknown[]) =>
  JSON.stringify({
    id: 'novel-123',
    title: 'Test Novel',
    version: 1,
    createdAt: 1,
    updatedAt: 1,
    casePath: null,
    novelFolderPath: path.join('D:/The Vault App', 'NovelLibrary', 'novel-123'),
    settings: {
      showPageNumbers: true,
      fontFamily: 'Georgia, serif',
      fontSize: 12,
      bookSizeId: 'us-trade',
      marginMm: 19,
      coverTitle: 'Test Novel',
    },
    pages: [
      {
        id: 'cover',
        side: 'left',
        type: 'cover',
        contentHtml: '',
        images: [],
      },
      {
        id: 'page-1',
        side: 'left',
        type: 'content',
        contentHtml: '<p>Chapter one begins here.</p>',
        images: [],
      },
    ],
  } satisfies NovelDocumentStored)
);

vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  rename: vi.fn(),
  writeFile: (...args: unknown[]) => writeFileMock(...args),
  readFile: (...args: unknown[]) => readFileMock(...args),
  stat: vi.fn(async () => ({ isFile: () => true })),
  readdir: vi.fn(async () => []),
  rm: vi.fn(),
  copyFile: vi.fn(),
  cp: vi.fn(),
}));

describe('novelStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a novel in the global library by default', async () => {
    const doc = await createNovel('My Book', null);
    expect(doc.title).toBe('My Book');
    expect(doc.casePath).toBeNull();
    expect(doc.pages.length).toBeGreaterThan(0);
  });

  it('reads a novel document from disk', async () => {
    const doc = await readNovelDocument(path.join('D:/The Vault App', 'NovelLibrary', 'novel-123'));
    expect(doc.title).toBe('Test Novel');
  });

  it('assigns a novel to a case path', async () => {
    const doc = await moveNovelToCase(
      path.join('D:/The Vault App', 'NovelLibrary', 'novel-123'),
      'D:/The Vault App/Cases/Case A'
    );
    expect(doc.casePath).toBe('D:/The Vault App/Cases/Case A');
  });

  it('exports DOCX to the requested path', async () => {
    const dest = 'D:/The Vault App/Exports/test-novel.docx';
    const filePath = await exportNovelToDocx(
      path.join('D:/The Vault App', 'NovelLibrary', 'novel-123'),
      dest
    );
    expect(filePath).toBe(dest);
    expect(writeFileMock).toHaveBeenCalled();
  });

  it('exports EPUB to the requested path', async () => {
    const dest = 'D:/The Vault App/Exports/test-novel.epub';
    const filePath = await exportNovelToEpub(
      path.join('D:/The Vault App', 'NovelLibrary', 'novel-123'),
      dest
    );
    expect(filePath).toBe(dest);
    expect(writeFileMock).toHaveBeenCalled();
  });
});
