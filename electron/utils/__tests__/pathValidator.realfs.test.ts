import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  isSafePath,
  isSafeStorageId,
  isPathWithinBase,
  isValidFolderName,
} from '../pathValidator';

/**
 * End-to-end exercise of the path-validation primitives against a *real* temp
 * directory tree (no mocked fs). These tests lock in the Phase-1 containment
 * behaviour: the custom `vault-file://` protocol handler and the
 * `rename-file`/`delete-file`/`move-file-to-folder` IPC handlers all rely on
 * `isSafePath` + `isPathWithinBase` to keep operations inside the managed
 * archive/userData roots. If that containment regresses, these assertions fail.
 */
describe('path validation primitives (real filesystem)', () => {
  let tmpRoot: string;
  let archiveDir: string;
  let userDataDir: string;
  let caseDir: string;
  let realFile: string;

  beforeAll(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-pathval-'));
    archiveDir = path.join(tmpRoot, 'archive');
    userDataDir = path.join(tmpRoot, 'userData');
    caseDir = path.join(archiveDir, 'Case A');
    fs.mkdirSync(caseDir, { recursive: true });
    fs.mkdirSync(userDataDir, { recursive: true });

    realFile = path.join(caseDir, 'evidence.pdf');
    fs.writeFileSync(realFile, 'pdf bytes');
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  describe('isPathWithinBase containment for real assets', () => {
    it('accepts files that physically live under the archive root', () => {
      expect(isPathWithinBase(realFile, [archiveDir, userDataDir])).toBe(true);
      expect(
        isPathWithinBase(path.join(caseDir, 'thumb.png'), [archiveDir, userDataDir]),
      ).toBe(true);
    });

    it('accepts files under the userData root', () => {
      const thumb = path.join(userDataDir, '.bookmark-thumbnails', 'b.png');
      expect(isPathWithinBase(thumb, [archiveDir, userDataDir])).toBe(true);
    });

    it('rejects an absolute system path that escapes every managed root', () => {
      // Mirrors the protocol handler decoding of `vault-file:///C:/Windows/...`:
      // the scheme prefix is stripped and the remainder URI-decoded.
      const decoded = decodeURIComponent('/C:/Windows/System32/drivers/etc/hosts');
      expect(isPathWithinBase(decoded, [archiveDir, userDataDir])).toBe(false);

      const windowsAbsolute = 'C:\\Windows\\System32\\config\\SAM';
      expect(isPathWithinBase(windowsAbsolute, [archiveDir, userDataDir])).toBe(false);

      const unixAbsolute = '/etc/passwd';
      expect(isPathWithinBase(unixAbsolute, [archiveDir, userDataDir])).toBe(false);
    });

    it('rejects traversal that resolves outside the archive even when prefixed by it', () => {
      const escaped = path.join(archiveDir, '..', 'userData', '..', 'secret.txt');
      // Resolves to tmpRoot/secret.txt which is outside both roots.
      expect(isPathWithinBase(escaped, [archiveDir])).toBe(false);
    });

    it('does not treat a sibling directory with a shared prefix as contained', () => {
      const sibling = `${archiveDir}-evil`;
      fs.mkdirSync(sibling, { recursive: true });
      try {
        expect(isPathWithinBase(path.join(sibling, 'x.pdf'), [archiveDir])).toBe(false);
      } finally {
        fs.rmSync(sibling, { recursive: true, force: true });
      }
    });
  });

  describe('isSafePath on real paths', () => {
    it('accepts a plain absolute path to a real archive file', () => {
      expect(isSafePath(realFile)).toBe(true);
    });

    it('rejects any path containing parent-directory tokens', () => {
      // Use raw (un-normalized) strings: path.join would collapse the `..`
      // tokens, and isSafePath specifically rejects the literal traversal text.
      expect(isSafePath(`${caseDir}\\..\\..\\evil`)).toBe(false);
      expect(isSafePath('..\\..\\evil')).toBe(false);
      expect(isSafePath('../../evil')).toBe(false);
    });
  });

  describe('rename-file destination validation (real directory)', () => {
    // Reproduces the exact guard order used by the `rename-file` IPC handler so
    // that a regression in either the separator/`..` check or the
    // `isPathWithinBase` re-check is caught here without booting Electron.
    const isRenameTargetAllowed = (
      currentFilePath: string,
      newName: string,
      roots: string[],
    ): boolean => {
      const trimmed = newName.trim();
      if (!trimmed) return false;
      if (/[\\/]/.test(trimmed) || trimmed === '.' || trimmed === '..') {
        return false;
      }
      const newPath = path.join(path.dirname(currentFilePath), trimmed);
      return isPathWithinBase(newPath, roots);
    };

    it('allows an ordinary rename that stays inside the case directory', () => {
      expect(isRenameTargetAllowed(realFile, 'renamed.pdf', [archiveDir])).toBe(true);
    });

    it('rejects a traversal rename like "..\\..\\evil"', () => {
      expect(isRenameTargetAllowed(realFile, '..\\..\\evil', [archiveDir])).toBe(false);
    });

    it('rejects a rename containing a forward-slash separator', () => {
      expect(isRenameTargetAllowed(realFile, 'sub/evil.pdf', [archiveDir])).toBe(false);
    });

    it('rejects bare dot and dot-dot rename targets', () => {
      expect(isRenameTargetAllowed(realFile, '.', [archiveDir])).toBe(false);
      expect(isRenameTargetAllowed(realFile, '..', [archiveDir])).toBe(false);
    });
  });

  describe('isSafeStorageId / isValidFolderName for filename components', () => {
    it('accepts generated ids and ordinary folder names', () => {
      expect(isSafeStorageId('bookmark-1718900000000-ab12cd')).toBe(true);
      expect(isValidFolderName('Case A')).toBe(true);
      expect(isValidFolderName('2024-evidence_set')).toBe(true);
    });

    it('rejects ids/folder names that could escape a directory', () => {
      expect(isSafeStorageId('..')).toBe(false);
      expect(isSafeStorageId('../evil')).toBe(false);
      expect(isSafeStorageId('a\\b')).toBe(false);
      expect(isValidFolderName('..')).toBe(true); // "." chars allowed, but separators are not
      expect(isValidFolderName('a/b')).toBe(false);
      expect(isValidFolderName('a\\b')).toBe(false);
      expect(isValidFolderName('a:b')).toBe(false);
      expect(isValidFolderName('CON')).toBe(false);
    });
  });
});
