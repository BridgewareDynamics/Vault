import { describe, expect, it } from 'vitest';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { calculateStreamingSha256 } from '../streamChecksum';

describe('streamChecksum', () => {
  it('matches buffer-based SHA-256 for small files', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'vault-checksum-'));
    const filePath = path.join(dir, 'sample.bin');
    const payload = Buffer.from('vault streaming checksum test payload');
    await fs.writeFile(filePath, payload);

    const expected = crypto.createHash('sha256').update(payload).digest('hex');
    const streaming = await calculateStreamingSha256(filePath);

    expect(streaming).toBe(expected);

    await fs.rm(dir, { recursive: true, force: true });
  });

  it('matches buffer-based SHA-256 for multi-chunk files', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'vault-checksum-'));
    const filePath = path.join(dir, 'large.bin');
    const payload = Buffer.alloc(3 * 1024 * 1024, 0xab);
    await fs.writeFile(filePath, payload);

    const expected = crypto.createHash('sha256').update(payload).digest('hex');
    const streaming = await calculateStreamingSha256(filePath);

    expect(streaming).toBe(expected);

    await fs.rm(dir, { recursive: true, force: true });
  });

  it('returns empty string when the file is missing', async () => {
    const result = await calculateStreamingSha256('/nonexistent/vault-file.bin');
    expect(result).toBe('');
  });
});
