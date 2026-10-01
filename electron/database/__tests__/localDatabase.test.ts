import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * REAL better-sqlite3 tests for {@link LocalDatabase}. These open an actual
 * on-disk SQLite database in a temporary `userData` directory (no mocked
 * better-sqlite3) so the schema, pragmas, parameterized queries and
 * soft-delete semantics are exercised end-to-end. Only Electron's `app` and the
 * logger are mocked.
 */

// Mutable holder so each test points `app.getPath('userData')` at a fresh temp
// dir. Defined via vi.hoisted so it is available inside the mock factory.
const electronState = vi.hoisted(() => ({ userData: '' }));

vi.mock('electron', () => ({
  app: {
    isReady: () => true,
    isPackaged: false,
    getPath: (name: string) => {
      if (name === 'userData') return electronState.userData;
      return electronState.userData;
    },
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

const now = () => Date.now();

const resetSingleton = () => {
  (LocalDatabase as unknown as { instance: LocalDatabase | null }).instance = null;
};

async function makeDb(): Promise<{ db: LocalDatabase; userData: string }> {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-db-'));
  electronState.userData = userData;
  resetSingleton();
  const db = LocalDatabase.getInstance();
  await db.initialize();
  return { db, userData };
}

describe('LocalDatabase (real better-sqlite3)', () => {
  let db: LocalDatabase;
  let userData: string;

  beforeEach(async () => {
    ({ db, userData } = await makeDb());
  });

  afterEach(() => {
    try {
      db.close();
    } catch {
      /* already closed */
    }
    resetSingleton();
    fs.rmSync(userData, { recursive: true, force: true });
  });

  it('initializes an on-disk database file with WAL journaling enabled', () => {
    expect(db.isInitialized()).toBe(true);
    expect(fs.existsSync(db.getDatabasePath())).toBe(true);

    const raw = db.getRawDatabase();
    const journalMode = raw.pragma('journal_mode', { simple: true });
    expect(String(journalMode).toLowerCase()).toBe('wal');

    const busyTimeout = raw.pragma('busy_timeout', { simple: true });
    expect(Number(busyTimeout)).toBe(5000);

    const foreignKeys = raw.pragma('foreign_keys', { simple: true });
    expect(Number(foreignKeys)).toBe(1);
  });

  describe('case operations', () => {
    it('creates, reads, updates and soft-deletes a case', () => {
      const created = db.createCase({
        id: 'case-1',
        name: 'Case One',
        path: '/archive/case-one',
        description: 'first',
        local_modified_at: 1000,
        created_at: 1000,
      });

      expect(created.id).toBe('case-1');
      expect(created.name).toBe('Case One');
      expect(created.sync_version).toBe(1);

      expect(db.getCaseById('case-1')?.name).toBe('Case One');
      expect(db.getCaseByPath('/archive/case-one')?.id).toBe('case-1');
      expect(db.getCases().map((c) => c.id)).toEqual(['case-1']);

      db.updateCase('/archive/case-one', { description: 'updated', category_tag_id: 'tag-1' });
      expect(db.getCaseById('case-1')?.description).toBe('updated');
      expect(db.getCaseById('case-1')?.category_tag_id).toBe('tag-1');

      db.deleteCase('/archive/case-one');
      expect(db.getCaseById('case-1')).toBeNull();
      expect(db.getCaseByPath('/archive/case-one')).toBeNull();
      expect(db.getCases()).toHaveLength(0);

      // Soft delete: the row still physically exists with deleted_at set.
      const row = db
        .getRawDatabase()
        .prepare('SELECT deleted_at FROM cases WHERE id = ?')
        .get('case-1') as { deleted_at: number | null };
      expect(row.deleted_at).toBeGreaterThan(0);
    });

    it('orders cases by name and excludes deleted ones', () => {
      db.createCase({ id: 'b', name: 'Bravo', path: '/a/bravo', local_modified_at: 1, created_at: 1 });
      db.createCase({ id: 'a', name: 'Alpha', path: '/a/alpha', local_modified_at: 1, created_at: 1 });
      db.createCase({ id: 'c', name: 'Charlie', path: '/a/charlie', local_modified_at: 1, created_at: 1 });
      db.deleteCase('/a/charlie');

      expect(db.getCases().map((c) => c.name)).toEqual(['Alpha', 'Bravo']);
    });
  });

  describe('file operations', () => {
    beforeEach(() => {
      db.createCase({
        id: 'case-1',
        name: 'Case One',
        path: '/archive/case-one',
        local_modified_at: 1000,
        created_at: 1000,
      });
    });

    it('creates root-level and nested files and only returns root files via getFiles', () => {
      db.createFile({
        id: 'folder-1',
        case_id: 'case-1',
        name: 'extraction',
        path: '/archive/case-one/extraction',
        size: 0,
        type: 'other',
        is_folder: 1,
        checksum: '',
        local_modified_at: 1000,
        created_at: 1000,
      });

      db.createFile({
        id: 'file-root',
        case_id: 'case-1',
        name: 'root.pdf',
        path: '/archive/case-one/root.pdf',
        size: 10,
        type: 'pdf',
        checksum: 'abc',
        local_modified_at: 1000,
        created_at: 1000,
      });

      db.createFile({
        id: 'file-nested',
        case_id: 'case-1',
        name: 'page-1.png',
        path: '/archive/case-one/extraction/page-1.png',
        size: 20,
        type: 'image',
        parent_folder_id: 'folder-1',
        checksum: 'def',
        local_modified_at: 1000,
        created_at: 1000,
      });

      const rootFiles = db.getFiles('/archive/case-one');
      const rootIds = rootFiles.map((f) => f.id).sort();
      expect(rootIds).toEqual(['file-root', 'folder-1']);
      // Folders sort before files (is_folder DESC).
      expect(rootFiles[0].is_folder).toBe(1);

      expect(db.getFileById('file-nested')?.parent_folder_id).toBe('folder-1');
      expect(db.getFileByPath('/archive/case-one/root.pdf')?.id).toBe('file-root');
    });

    it('updates and soft-deletes a file', () => {
      db.createFile({
        id: 'file-1',
        case_id: 'case-1',
        name: 'a.pdf',
        path: '/archive/case-one/a.pdf',
        size: 10,
        type: 'pdf',
        checksum: 'old',
        local_modified_at: 1000,
        created_at: 1000,
      });

      db.updateFile('/archive/case-one/a.pdf', {
        name: 'renamed.pdf',
        path: '/archive/case-one/renamed.pdf',
        size: 99,
        checksum: 'new',
      });

      expect(db.getFileByPath('/archive/case-one/a.pdf')).toBeNull();
      const updated = db.getFileByPath('/archive/case-one/renamed.pdf');
      expect(updated?.name).toBe('renamed.pdf');
      expect(updated?.size).toBe(99);
      expect(updated?.checksum).toBe('new');

      db.deleteFile('/archive/case-one/renamed.pdf');
      expect(db.getFileByPath('/archive/case-one/renamed.pdf')).toBeNull();
      expect(db.getFiles('/archive/case-one')).toHaveLength(0);
    });

    it('returns an empty array for files of an unknown case', () => {
      expect(db.getFiles('/archive/does-not-exist')).toEqual([]);
    });
  });

  describe('category tag operations', () => {
    it('creates, lists and soft-deletes category tags', () => {
      const tag = db.createCategoryTag({ id: 'tag-1', name: 'Urgent', color: '#f00' });
      expect(tag.name).toBe('Urgent');
      expect(db.getCategoryTags().map((t) => t.name)).toEqual(['Urgent']);

      db.createCategoryTag({ id: 'tag-2', name: 'Archive', color: null });
      expect(db.getCategoryTags().map((t) => t.name)).toEqual(['Archive', 'Urgent']);

      db.deleteCategoryTag('tag-1');
      expect(db.getCategoryTags().map((t) => t.name)).toEqual(['Archive']);
    });
  });

  describe('sync metadata operations', () => {
    it('sets, upserts and reads sync metadata', () => {
      expect(db.getSyncMetadata('archive_id')).toBeNull();

      db.setSyncMetadata('archive_id', 'id-1');
      expect(db.getSyncMetadata('archive_id')).toBe('id-1');

      // ON CONFLICT upsert path.
      db.setSyncMetadata('archive_id', 'id-2');
      expect(db.getSyncMetadata('archive_id')).toBe('id-2');
    });

    it('tracks migration completion via metadata', () => {
      expect(db.isMigrationCompleted()).toBe(false);
      db.markMigrationCompleted();
      expect(db.isMigrationCompleted()).toBe(true);
      db.clearMigrationFlag();
      expect(db.isMigrationCompleted()).toBe(false);
    });
  });

  describe('parameterized queries are not vulnerable to SQL injection', () => {
    it('treats a malicious case path as a literal value, not SQL', () => {
      db.createCase({
        id: 'case-1',
        name: 'Case One',
        path: '/archive/case-one',
        local_modified_at: 1,
        created_at: 1,
      });

      // A classic injection payload supplied where a path is expected. With
      // parameterized statements this is just a (non-matching) literal and must
      // never drop the table or return rows.
      const malicious = "/archive/case-one'; DROP TABLE cases;--";
      expect(db.getCaseByPath(malicious)).toBeNull();

      // The table and the legitimate row are still intact.
      expect(db.getCaseByPath('/archive/case-one')?.id).toBe('case-1');
      const tableExists = db
        .getRawDatabase()
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cases'")
        .get();
      expect(tableExists).toBeTruthy();
    });
  });

  describe('lifecycle guards', () => {
    it('throws when querying before initialization', () => {
      const fresh = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-db-uninit-'));
      electronState.userData = fresh;
      resetSingleton();
      const uninitialized = LocalDatabase.getInstance();
      try {
        expect(() => uninitialized.getCases()).toThrow('Database not initialized');
      } finally {
        resetSingleton();
        fs.rmSync(fresh, { recursive: true, force: true });
      }
    });

    it('generates a deterministic 32-char id from a path', () => {
      const id1 = db.generateId('/archive/case-one');
      const id2 = db.generateId('/archive/case-one');
      const id3 = db.generateId('/archive/case-two');
      expect(id1).toHaveLength(32);
      expect(id1).toBe(id2);
      expect(id1).not.toBe(id3);
    });
  });
});
