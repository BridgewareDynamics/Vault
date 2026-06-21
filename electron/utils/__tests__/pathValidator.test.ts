import { describe, expect, it } from 'vitest';
import * as path from 'path';
import { isSafeStorageId, isPathWithinBase } from '../pathValidator';

describe('isSafeStorageId', () => {
  it('accepts the generated bookmark id charset', () => {
    expect(isSafeStorageId('bookmark-1718900000000-ab12cd')).toBe(true);
    expect(isSafeStorageId('folder_42')).toBe(true);
    expect(isSafeStorageId('ABC-def_123')).toBe(true);
    expect(isSafeStorageId('a')).toBe(true);
  });

  it('rejects path-traversal and filesystem metacharacters', () => {
    expect(isSafeStorageId('..')).toBe(false);
    expect(isSafeStorageId('../../etc/passwd')).toBe(false);
    expect(isSafeStorageId('..\\..\\windows\\system32')).toBe(false);
    expect(isSafeStorageId('foo/bar')).toBe(false);
    expect(isSafeStorageId('foo\\bar')).toBe(false);
    expect(isSafeStorageId('foo.bar')).toBe(false);
    expect(isSafeStorageId('foo bar')).toBe(false);
    expect(isSafeStorageId('foo:bar')).toBe(false);
    expect(isSafeStorageId('foo\u0000bar')).toBe(false);
  });

  it('rejects empty, non-string, and over-long ids', () => {
    expect(isSafeStorageId('')).toBe(false);
    expect(isSafeStorageId(null)).toBe(false);
    expect(isSafeStorageId(undefined)).toBe(false);
    expect(isSafeStorageId(123)).toBe(false);
    expect(isSafeStorageId({})).toBe(false);
    expect(isSafeStorageId('a'.repeat(129))).toBe(false);
    expect(isSafeStorageId('a'.repeat(128))).toBe(true);
  });

  it('narrows the type to string for valid ids', () => {
    const value: unknown = 'valid-id';
    if (isSafeStorageId(value)) {
      // Compile-time check: value is now `string`.
      expect(value.length).toBeGreaterThan(0);
    } else {
      throw new Error('expected id to be valid');
    }
  });
});

describe('isPathWithinBase', () => {
  const base = path.resolve('/data/archive');

  it('accepts paths inside the allowed base', () => {
    expect(isPathWithinBase(path.join(base, 'case-1', 'file.pdf'), [base])).toBe(true);
    expect(isPathWithinBase(path.join(base, 'nested', 'deep', 'thumb.png'), [base])).toBe(true);
  });

  it('accepts the base directory itself', () => {
    expect(isPathWithinBase(base, [base])).toBe(true);
  });

  it('rejects paths that escape the base via traversal', () => {
    expect(isPathWithinBase(path.join(base, '..', 'secret.txt'), [base])).toBe(false);
    expect(isPathWithinBase(path.resolve('/etc/passwd'), [base])).toBe(false);
  });

  it('does not treat a sibling prefix as contained', () => {
    const sibling = path.resolve('/data/archive-evil/file.pdf');
    expect(isPathWithinBase(sibling, [base])).toBe(false);
  });

  it('matches against any of multiple allowed bases', () => {
    const userData = path.resolve('/home/user/.config/vault');
    expect(isPathWithinBase(path.join(userData, 'thumbnails', 'x.png'), [base, userData])).toBe(true);
    expect(isPathWithinBase(path.join(base, 'a.pdf'), [base, userData])).toBe(true);
  });

  it('ignores null/undefined/empty base entries', () => {
    expect(isPathWithinBase(path.join(base, 'a.pdf'), [null, undefined, '', base])).toBe(true);
    expect(isPathWithinBase(path.join(base, 'a.pdf'), [null, undefined, ''])).toBe(false);
  });

  it('rejects invalid target inputs', () => {
    expect(isPathWithinBase('', [base])).toBe(false);
    expect(isPathWithinBase(null as unknown as string, [base])).toBe(false);
    expect(isPathWithinBase(undefined as unknown as string, [base])).toBe(false);
  });
});
