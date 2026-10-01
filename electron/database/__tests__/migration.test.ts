import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * REAL data-migration tests for {@link migrateMetadataFilesToDatabase}. A small
 * fake archive directory is built on disk and migrated into a real
 * better-sqlite3 database. This guards the data-loss path: every case/file must
 * land in the DB, and re-running the migration must be idempotent (no
 * duplicate rows, no lost data).
 */

const electronState = vi.hoisted(() => ({ userData: '' }));

vi.mock('electron', () => ({
  app: {
    isReady: () => true,
    isPackaged: false,
    getPath: () => electronState.userData,
    getVersion: () => '1.0.0-test',
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  redactPath: (value: string | null | undefined) => String(value),
}));

import { LocalDatabase } from '../localDatabase';
import { migrateMetadataFilesToDatabase } from '../migration';

const resetSingleton = () => {
  (LocalDatabase as unknown as { instance: LocalDatabase | null }).instance = null;
};

function countLiveFiles(db: LocalDatabase): number {
  const row = db
    .getRawDatabase()
    .prepare('SELECT COUNT(*) AS c FROM files WHERE deleted_at IS NULL')
    .get() as { c: number };
  return row.c;
}

function buildFakeArchive(root: string): void {
  // Case A: description + two root files + a (parent-pdf) extraction folder with
  // one nested image.
  const caseA = path.join(root, 'Case A');
  fs.mkdirSync(caseA, { recursive: true });
  fs.writeFileSync(path.join(caseA, '.case-description'), 'Alpha case');
  fs.writeFileSync(path.join(caseA, 'doc.pdf'), '%PDF-1.4 doc');
  fs.writeFileSync(path.join(caseA, 'image.png'), 'PNG-bytes-A');

  const extraction = path.join(caseA, 'extraction');
  fs.mkdirSync(extraction, { recursive: true });
  fs.writeFileSync(path.join(extraction, '.parent-pdf'), 'doc.pdf');
  fs.writeFileSync(path.join(extraction, 'page-1.png'), 'PNG-bytes-page-1');

  // Case B: a single text file, no metadata.
  const caseB = path.join(root, 'Case B');
  fs.mkdirSync(caseB, { recursive: true });
  fs.writeFileSync(path.join(caseB, 'notes.txt'), 'just some notes');

  // A directory that must be ignored by the scan.
  fs.mkdirSync(path.join(root, '.bookmark-thumbnails'), { recursive: true });

  // Optional archive marker.
  fs.writeFileSync(
    path.join(root, '.vault-archive.json'),
    JSON.stringify({
      version: '1.0.0',
      createdAt: 1000,
      lastModified: 2000,
      caseCount: 2,
      archiveId: 'archive-test-id',
    }),
  );
}

describe('migrateMetadataFilesToDatabase (real fs + real better-sqlite3)', () => {
  let db: LocalDatabase;
  let userData: string;
  let archiveDir: string;

  beforeEach(async () => {
    userData = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-mig-ud-'));
    archiveDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-mig-archive-'));
    electronState.userData = userData;
    resetSingleton();
    db = LocalDatabase.getInstance();
    await db.initialize();
    buildFakeArchive(archiveDir);
  });

  afterEach(() => {
    try {
      db.close();
    } catch {
      /* already closed */
    }
    resetSingleton();
    fs.rmSync(userData, { recursive: true, force: true });
    fs.rmSync(archiveDir, { recursive: true, force: true });
  });

  it('migrates every case and file into the database', async () => {
    const result = await migrateMetadataFilesToDatabase(archiveDir, db);

    // 2 cases; files = doc.pdf + image.png + extraction folder + nested page-1
    // (Case A: 4) + notes.txt (Case B: 1) = 5.
    expect(result.cases).toBe(2);
    expect(result.files).toBe(5);

    const cases = db.getCases();
    expect(cases.map((c) => c.name).sort()).toEqual(['Case A', 'Case B']);

    const caseA = db.getCaseByPath(path.join(archiveDir, 'Case A'));
    expect(caseA?.description).toBe('Alpha case');

    // Root-level files for Case A: doc.pdf, image.png, extraction folder.
    const caseARoot = db.getFiles(path.join(archiveDir, 'Case A'));
    expect(caseARoot.map((f) => f.name).sort()).toEqual([
      'doc.pdf',
      'extraction',
      'image.png',
    ]);

    // The nested image is recorded under the extraction folder.
    const nested = db.getFileByPath(
      path.join(archiveDir, 'Case A', 'extraction', 'page-1.png'),
    );
    expect(nested).not.toBeNull();
    expect(nested?.type).toBe('image');

    // Real checksums were computed for content files (non-empty) and folders
    // carry an empty checksum.
    const docFile = db.getFileByPath(path.join(archiveDir, 'Case A', 'doc.pdf'));
    expect(docFile?.checksum).toMatch(/^[a-f0-9]{64}$/);
    const folder = db.getFileByPath(path.join(archiveDir, 'Case A', 'extraction'));
    expect(folder?.is_folder).toBe(1);
    expect(folder?.checksum).toBe('');

    // Archive marker metadata was captured.
    expect(db.getSyncMetadata('archive_id')).toBe('archive-test-id');
    expect(db.isMigrationCompleted()).toBe(true);
    expect(countLiveFiles(db)).toBe(5);
  });

  it('is idempotent: re-migrating does not duplicate or lose data', async () => {
    const first = await migrateMetadataFilesToDatabase(archiveDir, db);
    expect(first.cases).toBe(2);
    expect(first.files).toBe(5);

    const caseCountAfterFirst = db.getCases().length;
    const fileCountAfterFirst = countLiveFiles(db);
    const docChecksumAfterFirst = db.getFileByPath(
      path.join(archiveDir, 'Case A', 'doc.pdf'),
    )?.checksum;

    // Second run: nothing new is created, existing rows are updated in place.
    const second = await migrateMetadataFilesToDatabase(archiveDir, db);
    expect(second.cases).toBe(0);
    expect(second.files).toBe(0);

    expect(db.getCases().length).toBe(caseCountAfterFirst);
    expect(countLiveFiles(db)).toBe(fileCountAfterFirst);
    expect(db.getFileByPath(path.join(archiveDir, 'Case A', 'doc.pdf'))?.checksum).toBe(
      docChecksumAfterFirst,
    );
  });

  it('reports an error and does not crash when the archive drive is missing', async () => {
    const missing = path.join(archiveDir, 'no-such-dir');
    const result = await migrateMetadataFilesToDatabase(missing, db);

    expect(result.cases).toBe(0);
    expect(result.files).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(db.isMigrationCompleted()).toBe(false);
  });
});
