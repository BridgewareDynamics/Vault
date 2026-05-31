import * as path from 'path';
import { existsSync } from 'fs';
import { app } from 'electron';

let cachedFfmpegPath: string | null = null;

export function resolveFfmpegPath(): string {
  if (cachedFfmpegPath && existsSync(cachedFfmpegPath)) {
    return cachedFfmpegPath;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegStatic = require('ffmpeg-static') as string | null | undefined;
    if (ffmpegStatic && existsSync(ffmpegStatic)) {
      cachedFfmpegPath = ffmpegStatic;
      return ffmpegStatic;
    }
  } catch {
    // fall through to packaged lookup
  }

  const packagedCandidates = [
    path.join(process.resourcesPath, 'ffmpeg', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'),
    path.join(app.getAppPath(), 'build', 'ffmpeg', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'),
  ];

  for (const candidate of packagedCandidates) {
    if (existsSync(candidate)) {
      cachedFfmpegPath = candidate;
      return candidate;
    }
  }

  throw new Error('FFmpeg binary not found. Reinstall the application or run npm install ffmpeg-static.');
}

export function resetFfmpegPathCache(): void {
  cachedFfmpegPath = null;
}
