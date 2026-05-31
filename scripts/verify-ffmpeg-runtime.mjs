#!/usr/bin/env node
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function verifyFfmpegStatic() {
  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (typeof ffmpegStatic === 'string' && existsSync(ffmpegStatic)) {
      console.log('[verify-ffmpeg] ffmpeg-static OK:', ffmpegStatic);
      return true;
    }
  } catch (error) {
    console.warn('[verify-ffmpeg] ffmpeg-static not resolvable:', error);
  }
  return false;
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

const ok = verifyFfmpegStatic() || verifyPackagedCandidate();
if (!ok) {
  console.error('[verify-ffmpeg] FFmpeg binary not found. Run npm install ffmpeg-static.');
  process.exit(1);
}

console.log('[verify-ffmpeg] FFmpeg runtime verification passed.');
