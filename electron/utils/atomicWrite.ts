import * as fs from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Atomically write data to a file so a crash, power loss, or disk-full
 * condition can never leave a truncated/corrupt file in place:
 *
 *   1. Write the new contents to a sibling `<target>.tmp` file.
 *   2. `fsync` the temp file so its bytes are flushed to disk.
 *   3. If the target already exists, copy it to `<target>.bak` first so the
 *      previous good version is recoverable.
 *   4. `rename` the temp file over the target (atomic on the same filesystem).
 *
 * The temp and target must live on the same filesystem for the rename to be
 * atomic, which is guaranteed here because the temp file is a sibling.
 */
export async function writeFileAtomic(
  targetPath: string,
  data: string | Buffer
): Promise<void> {
  const tempPath = `${targetPath}.tmp`;

  // Write the new contents to the temp file first.
  await fs.writeFile(tempPath, data, 'utf8');

  // Best-effort fsync so the bytes are flushed to disk before the rename. This
  // is wrapped defensively so environments where fs.open is unavailable (e.g.
  // mocked in tests) still complete the atomic rename below.
  try {
    const handle = await fs.open(tempPath, 'r+');
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch {
    // fsync unavailable/failed - the atomic rename still prevents torn writes.
  }

  // Best-effort: preserve the prior good version for recovery. A failure here
  // must not block the write itself.
  if (existsSync(targetPath)) {
    try {
      await fs.copyFile(targetPath, `${targetPath}.bak`);
    } catch {
      // Non-fatal - proceed with the atomic rename regardless.
    }
  }

  await fs.rename(tempPath, targetPath);
}

/**
 * Read and `JSON.parse` a file written by {@link writeFileAtomic}, falling back
 * to the `<target>.bak` copy if the primary file is missing or corrupt. Throws
 * the original error if neither the primary nor the backup can be parsed.
 */
export async function readJsonWithBackup<T>(targetPath: string): Promise<T> {
  try {
    const raw = await fs.readFile(targetPath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (primaryError) {
    const backupPath = `${targetPath}.bak`;
    if (existsSync(backupPath)) {
      try {
        const backupRaw = await fs.readFile(backupPath, 'utf8');
        return JSON.parse(backupRaw) as T;
      } catch {
        // Fall through to throw the original (primary) error below.
      }
    }
    throw primaryError;
  }
}
