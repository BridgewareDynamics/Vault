#!/usr/bin/env node
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

function resolveFfmpegStaticPath() {
  if (process.env.FFMPEG_BIN && existsSync(process.env.FFMPEG_BIN)) {
    return process.env.FFMPEG_BIN;
  }

  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (typeof ffmpegStatic === 'string' && existsSync(ffmpegStatic)) {
      return ffmpegStatic;
    }
  } catch (error) {
    console.warn('[verify-ffmpeg] ffmpeg-static not resolvable:', error);
  }

  const nodeModulesBinary = path.join(
    projectRoot,
    'node_modules',
    'ffmpeg-static',
    process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
  );
  if (existsSync(nodeModulesBinary)) {
    return nodeModulesBinary;
  }

  return null;
}

function verifyPackagedCandidate() {
  const candidate = path.join(
    projectRoot,
    'build',
    'ffmpeg',
    process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
  );
  if (existsSync(candidate)) {
    console.log('[verify-ffmpeg] packaged candidate OK:', candidate);
    return true;
  }
  return false;
}

const ffmpegPath = resolveFfmpegStaticPath();
if (ffmpegPath) {
  console.log('[verify-ffmpeg] ffmpeg-static OK:', ffmpegPath);
}

const ok = Boolean(ffmpegPath) || verifyPackagedCandidate();
if (!ok) {
  console.error(
    '[verify-ffmpeg] FFmpeg binary not found. Run: npm install ffmpeg-static (or set FFMPEG_BIN to an existing binary).'
  );
  process.exit(1);
}

console.log('[verify-ffmpeg] FFmpeg runtime verification passed.');
