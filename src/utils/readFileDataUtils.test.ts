import { describe, expect, it } from 'vitest';
import {
  isReadFileDataPathResult,
  resolveReadFileDataUrl,
  resolveReadFileMimeType,
  resolveVaultBackgroundUrl,
  toVaultFileUrl,
} from './readFileDataUtils';

describe('readFileDataUtils', () => {
  it('detects file-path responses', () => {
    expect(isReadFileDataPathResult({ type: 'file-path', path: '/a.png', mimeType: 'image/png', fileName: 'a.png' })).toBe(true);
    expect(isReadFileDataPathResult({ data: 'abc', mimeType: 'image/png', fileName: 'a.png' })).toBe(false);
  });

  it('builds data URLs for base64 payloads', () => {
    const url = resolveReadFileDataUrl({
      data: 'Zm9v',
      mimeType: 'image/png',
      fileName: 'a.png',
    });
    expect(url).toBe('data:image/png;base64,Zm9v');
  });

  it('uses vault-file protocol for large file payloads', () => {
    const url = resolveReadFileDataUrl({
      type: 'file-path',
      path: 'C:\\vault\\large.png',
      mimeType: 'image/png',
      fileName: 'large.png',
    });
    expect(url).toBe(`vault-file://${encodeURIComponent('C:\\vault\\large.png')}`);
  });

  it('resolves octet-stream mime types from file extension', () => {
    expect(resolveReadFileMimeType('application/octet-stream', '/x/image.jpeg')).toBe('image/jpeg');
  });

  it('passes through http paths in toVaultFileUrl', () => {
    expect(toVaultFileUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
  });

  it('builds vault-file URLs for background paths without IPC', () => {
    expect(resolveVaultBackgroundUrl('/vault/case/.case-background.jpg')).toBe(
      `vault-file://${encodeURIComponent('/vault/case/.case-background.jpg')}`,
    );
    expect(resolveVaultBackgroundUrl(undefined)).toBeUndefined();
  });
});
