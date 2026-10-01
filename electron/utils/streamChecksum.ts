import * as crypto from 'crypto';
import { createReadStream } from 'fs';

const STREAM_CHUNK_SIZE = 1024 * 1024;

/**
 * SHA-256 over a file using a read stream — same digest as buffering the whole file.
 * Returns empty string on failure (matches LocalDatabase.calculateChecksum contract).
 */
export function calculateStreamingSha256(filePath: string): Promise<string> {
  return new Promise((resolve) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath, { highWaterMark: STREAM_CHUNK_SIZE });

    stream.on('data', (chunk: Buffer | string) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', () => {
      resolve('');
    });
  });
}
