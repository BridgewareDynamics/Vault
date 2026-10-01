import * as path from 'path';
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { app } from 'electron';
import { promises as fs } from 'fs';
import { resolveFfmpegPath } from './ffmpegResolver';
import { getArchiveDrive } from './archiveConfig';
import { logger } from './logger';

/**
 * Containers that can carry a fragmented MP4 layout (moov + moof fragments).
 * Chromium's <video> element refuses to play fragmented MP4 over a plain `src`
 * (that layout is only supported through Media Source Extensions), so these are
 * the candidates we inspect and, when needed, remux to a progressive file.
 */
const REMUX_CANDIDATE_EXTENSIONS = new Set(['.mp4', '.m4v', '.mov']);

export interface PrepareVideoResult {
  /** Path the renderer should serve (the original, or a cached remuxed copy). */
  path: string;
  /** True when a faststart remux was produced/served instead of the original. */
  remuxed: boolean;
}

/**
 * Cheaply detect a fragmented MP4 by scanning top-level boxes for a `moof`
 * (movie fragment) atom. Only box headers are read (16 bytes each) and we stop
 * at the first `moof`, so this is fast even for multi-GB files. A normal
 * progressive MP4 (ftyp/moov/mdat in any order) contains no top-level `moof`.
 */
export async function isFragmentedMp4(filePath: string): Promise<boolean> {
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    handle = await fs.open(filePath, 'r');

    let pos = 0;
    const header = Buffer.alloc(16);
    // A fragmented file's first `moof` sits within the opening boxes; cap the
    // scan so a pathological file can never spin here.
    for (let i = 0; i < 64 && pos + 8 <= fileSize; i++) {
      const { bytesRead } = await handle.read(header, 0, 16, pos);
      if (bytesRead < 8) break;

      let boxSize = header.readUInt32BE(0);
      const type = header.toString('latin1', 4, 8);

      if (boxSize === 1) {
        // 64-bit extended size follows the type field.
        boxSize = Number(header.readBigUInt64BE(8));
      } else if (boxSize === 0) {
        // Box extends to end of file: it is the last box.
        boxSize = fileSize - pos;
      }

      if (type === 'moof') return true;
      // Sanity: a non-ASCII type or non-advancing size means we can't trust the
      // structure; treat as not-fragmented and let normal playback try.
      if (!/^[\x20-\x7e]{4}$/.test(type) || boxSize <= 0) break;

      pos += boxSize;
    }
    return false;
  } catch (error) {
    logger.warn('[videoRemux] fragmentation check failed:', error);
    return false;
  } finally {
    await handle?.close().catch(() => {});
  }
}

/**
 * Where remuxed, playable copies are stored. Per user preference these live in
 * the chosen vault directory (the archive drive) so they travel with the vault;
 * we fall back to userData only when no vault has been configured yet. Both
 * locations are "managed roots", so the vault-video protocol will serve them.
 */
async function getCacheDir(): Promise<string> {
  let base: string | null = null;
  try {
    base = await getArchiveDrive();
  } catch {
    base = null;
  }
  if (!base) {
    base = app.getPath('userData');
  }
  return path.join(base, '.video-playback-cache');
}

/**
 * Stable cache key derived from path + size + mtime so edits to the source
 * invalidate the cached remux automatically.
 */
function cacheKeyFor(filePath: string, size: number, mtimeMs: number): string {
  return createHash('sha1').update(`${filePath}:${size}:${mtimeMs}`).digest('hex');
}

async function remuxToFaststart(sourcePath: string, outputPath: string): Promise<void> {
  const ffmpegPath = resolveFfmpegPath();
  const args = [
    '-y',
    '-i', sourcePath,
    // Stream copy: no re-encode, so this is fast and lossless. `+faststart`
    // moves the moov atom to the front; rewriting the container also flattens
    // the moof fragments into a normal progressive layout Chromium can play.
    '-c', 'copy',
    '-movflags', '+faststart',
    // Force the muxer explicitly: the output is written to a temp filename whose
    // extension ffmpeg can't map to a format on its own, so without this it
    // errors with "Unable to choose an output format".
    '-f', 'mp4',
    outputPath,
  ];

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { windowsHide: true });
    let stderrTail = '';
    proc.stderr.on('data', (chunk: Buffer) => {
      stderrTail = (stderrTail + chunk.toString()).slice(-2000);
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg remux exited with code ${code ?? 'unknown'}: ${stderrTail}`));
    });
  });
}

// De-duplicate concurrent requests for the same output (e.g. React StrictMode
// double-invokes the effect in dev, or the user reopens a still-converting
// video) so we never launch two ffmpeg processes writing the same file.
const inFlightRemuxes = new Map<string, Promise<PrepareVideoResult>>();

async function produceRemux(
  filePath: string,
  outputPath: string
): Promise<PrepareVideoResult> {
  logger.info(`[videoRemux] remuxing fragmented MP4 for playback: ${filePath}`);
  // Write to a unique temp file first (with a real `.mp4` extension) so a crash
  // mid-remux never leaves a truncated file that future runs treat as a valid
  // cache hit, and concurrent attempts can't clobber each other.
  const tempPath = `${outputPath}.${process.pid}.${Date.now()}.tmp.mp4`;
  try {
    await remuxToFaststart(filePath, tempPath);
    await fs.rename(tempPath, outputPath);
  } catch (error) {
    await fs.unlink(tempPath).catch(() => {});
    throw error;
  }

  logger.info(`[videoRemux] remux complete: ${outputPath}`);
  return { path: outputPath, remuxed: true };
}

/**
 * Ensure a video is playable in a Chromium <video> element. Non-fragmented
 * files are returned untouched; fragmented MP4s are remuxed (stream-copied) to a
 * faststart file cached in the vault directory and that cached path is returned.
 */
export async function prepareVideoForPlayback(filePath: string): Promise<PrepareVideoResult> {
  const ext = path.extname(filePath).toLowerCase();
  if (!REMUX_CANDIDATE_EXTENSIONS.has(ext)) {
    return { path: filePath, remuxed: false };
  }

  if (!(await isFragmentedMp4(filePath))) {
    return { path: filePath, remuxed: false };
  }

  const stat = await fs.stat(filePath);
  const cacheDir = await getCacheDir();
  await fs.mkdir(cacheDir, { recursive: true });
  const outputPath = path.join(cacheDir, `${cacheKeyFor(filePath, stat.size, stat.mtimeMs)}.mp4`);

  const cached = await fs.stat(outputPath).catch(() => null);
  if (cached && cached.isFile() && cached.size > 0) {
    return { path: outputPath, remuxed: true };
  }

  const existing = inFlightRemuxes.get(outputPath);
  if (existing) {
    return existing;
  }

  const work = produceRemux(filePath, outputPath).finally(() => {
    inFlightRemuxes.delete(outputPath);
  });
  inFlightRemuxes.set(outputPath, work);
  return work;
}
