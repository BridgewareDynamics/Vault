import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * REAL filesystem + better-sqlite3 tests for the {@link FileSystemWatcher}
 * checksum optimization (P1-6): when a file's size and mtime are unchanged the
 * watcher must reuse the stored SHA-256 instead of recomputing it, and it must
 * recompute (and update) the checksum when size or mtime changes.
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
import { FileSystemWatcher } from '../watcher';

const resetSingleton = () => {
  (LocalDatabase as unknown as { instance: LocalDatabase | null }).instance = null;
};

// Reach into the private async sync method without re-implementing it.
type SyncFn = (filePath: string, parentDir: string) => Promise<boolean>;
function syncFile(watcher: FileSystemWatcher, filePath: string, parentDir: string) {
  return (watcher as unknown as { syncFileToDatabase: SyncFn }).syncFileToDatabase(
    filePath,
    parentDir,
  );
}

describe('FileSystemWatcher checksum reuse (real fs + better-sqlite3)', () => {
  let db: LocalDatabase;
  let watcher: FileSystemWatcher;
  let userData: string;
  let archiveDir: string;
  let casePath: string;
  let filePath: string;

  beforeEach(async () => {
    userData = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-watch-ud-'));
    archiveDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-watch-archive-'));
    electronState.userData = userData;
    resetSingleton();
    db = LocalDatabase.getInstance();
    await db.initialize();

    casePath = path.join(archiveDir, 'Case A');
    fs.mkdirSync(casePath, { recursive: true });
    db.createCase({
      id: db.generateId(casePath),
      name: 'Case A',
      path: casePath,
      local_modified_at: 1000,
      created_at: 1000,
    });

    filePath = path.join(casePath, 'evidence.png');
    fs.writeFileSync(filePath, 'original-content');

    watcher = new FileSystemWatcher(db);
    // The watcher only resolves the archive root in start(); inject it directly
    // so we can exercise the sync path without spinning up fs.watch.
    (watcher as unknown as { archiveDrive: string }).archiveDrive = archiveDir;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      db.close();
    } catch {
      /* already closed */
    }
    resetSingleton();
    fs.rmSync(userData, { recursive: true, force: true });
    fs.rmSync(archiveDir, { recursive: true, force: true });
  });

  it('computes the checksum once when first syncing a new file', async () => {
    const spy = vi.spyOn(db, 'calculateChecksum');

    const synced = await syncFile(watcher, filePath, casePath);

    expect(synced).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);

    const row = db.getFileByPath(filePath);
    expect(row).not.toBeNull();
    expect(row?.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it('reuses the stored checksum when size and mtime are unchanged', async () => {
    await syncFile(watcher, filePath, casePath);
    const original = db.getFileByPath(filePath);

    const spy = vi.spyOn(db, 'calculateChecksum');
    const synced = await syncFile(watcher, filePath, casePath);

    expect(synced).toBe(true);
    // The expensive recompute must be skipped on the unchanged-content path.
    expect(spy).not.toHaveBeenCalled();
    expect(db.getFileByPath(filePath)?.checksum).toBe(original?.checksum);
  });

  it('recomputes the checksum when the file content (size + mtime) changes', async () => {
    await syncFile(watcher, filePath, casePath);
    const original = db.getFileByPath(filePath);

    // Change the content (new size) and bump mtime so the optimization's
    // size+mtime guard correctly detects a real modification.
    fs.writeFileSync(filePath, 'brand-new-and-longer-content');
    const future = new Date(Date.now() + 10_000);
    fs.utimesSync(filePath, future, future);

    const spy = vi.spyOn(db, 'calculateChecksum');
    const synced = await syncFile(watcher, filePath, casePath);

    expect(synced).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);

    const updated = db.getFileByPath(filePath);
    expect(updated?.checksum).not.toBe(original?.checksum);
    expect(updated?.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(updated?.size).toBe(fs.statSync(filePath).size);
  });

  it('recomputes when only the mtime changes (size identical)', async () => {
    await syncFile(watcher, filePath, casePath);

    // Rewrite identical-length but different bytes, then bump mtime: size is the
    // same, so only the mtime change should trigger a recompute.
    const same = db.getFileByPath(filePath);
    fs.writeFileSync(filePath, 'changed-content!'.padEnd('original-content'.length, 'x').slice(0, 'original-content'.length));
    const future = new Date(Date.now() + 20_000);
    fs.utimesSync(filePath, future, future);

    const spy = vi.spyOn(db, 'calculateChecksum');
    await syncFile(watcher, filePath, casePath);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(db.getFileByPath(filePath)?.checksum).not.toBe(same?.checksum);
  });
});
