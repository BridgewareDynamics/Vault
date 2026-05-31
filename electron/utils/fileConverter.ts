import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { isSafePath } from './pathValidator';
import { resolveFfmpegPath } from './ffmpegResolver';
import {
  detectFileConverterCategory,
  isConversionSupported,
  outputFormatToExtension,
  type FileConverterOutputFormat,
} from './fileFormatRegistry';

export interface FileConverterOptions {
  sourcePath: string;
  outputFormat: FileConverterOutputFormat;
  outputDirectory?: string;
  quality?: number;
  dpi?: number;
  /** Pre-rendered PDF pages from renderer (base64 JPEG/PNG data URLs). */
  renderedPages?: Array<{ pageNumber: number; imageData: string }>;
}

export interface FileConverterProgressEvent {
  percent: number;
  statusMessage: string;
  phase: 'preparing' | 'converting' | 'finalizing' | 'complete';
  cancellable: boolean;
}

export interface FileConverterJobResult {
  success: boolean;
  outputPath?: string;
  outputPaths?: string[];
  error?: string;
}

type ProgressCallback = (event: FileConverterProgressEvent) => void;

let activeProcess: ChildProcessWithoutNullStreams | null = null;

export function cancelActiveFileConversion(): void {
  if (activeProcess) {
    activeProcess.kill('SIGTERM');
    activeProcess = null;
  }
}

function emitProgress(onProgress: ProgressCallback | undefined, event: FileConverterProgressEvent): void {
  onProgress?.(event);
}

function stripDataUrlPrefix(dataUrl: string): Buffer {
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  return Buffer.from(base64, 'base64');
}

async function convertImageWithSharp(
  sourcePath: string,
  outputPath: string,
  outputFormat: FileConverterOutputFormat,
  quality: number,
  onProgress?: ProgressCallback
): Promise<void> {
  emitProgress(onProgress, {
    percent: 10,
    statusMessage: 'Reading source image…',
    phase: 'preparing',
    cancellable: false,
  });

  const inputBuffer = await fs.readFile(sourcePath);
  let pipeline = sharp(inputBuffer);

  emitProgress(onProgress, {
    percent: 40,
    statusMessage: 'Converting image…',
    phase: 'converting',
    cancellable: false,
  });

  switch (outputFormat) {
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 6 });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'tiff':
      pipeline = pipeline.tiff({ compression: 'lzw' });
      break;
    case 'gif':
      pipeline = pipeline.gif();
      break;
    default:
      throw new Error(`Sharp cannot produce ${outputFormat} output`);
  }

  await pipeline.toFile(outputPath);

  emitProgress(onProgress, {
    percent: 100,
    statusMessage: 'Conversion complete',
    phase: 'complete',
    cancellable: false,
  });
}

async function convertImagesToPdf(
  imagePaths: string[],
  outputPath: string,
  onProgress?: ProgressCallback
): Promise<void> {
  emitProgress(onProgress, {
    percent: 15,
    statusMessage: 'Building PDF…',
    phase: 'converting',
    cancellable: false,
  });

  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    const imageBytes = await fs.readFile(imagePath);
    const ext = path.extname(imagePath).toLowerCase();

    let embedded;
    if (ext === '.png') {
      embedded = await pdfDoc.embedPng(imageBytes);
    } else {
      embedded = await pdfDoc.embedJpg(imageBytes);
    }

    const page = pdfDoc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });

    emitProgress(onProgress, {
      percent: 20 + Math.round(((i + 1) / imagePaths.length) * 70),
      statusMessage: `Adding page ${i + 1} of ${imagePaths.length}…`,
      phase: 'converting',
      cancellable: false,
    });
  }

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);

  emitProgress(onProgress, {
    percent: 100,
    statusMessage: 'PDF created',
    phase: 'complete',
    cancellable: false,
  });
}

async function convertPdfPagesToImages(
  renderedPages: Array<{ pageNumber: number; imageData: string }>,
  outputDirectory: string,
  outputFormat: FileConverterOutputFormat,
  quality: number,
  onProgress?: ProgressCallback
): Promise<string[]> {
  const outputPaths: string[] = [];
  const ext = outputFormatToExtension(outputFormat);

  for (let i = 0; i < renderedPages.length; i++) {
    const page = renderedPages[i];
    const outputPath = path.join(outputDirectory, `page-${page.pageNumber}${ext}`);
    const buffer = stripDataUrlPrefix(page.imageData);

    let pipeline = sharp(buffer);
    switch (outputFormat) {
      case 'png':
        pipeline = pipeline.png();
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'tiff':
        pipeline = pipeline.tiff({ compression: 'lzw' });
        break;
      default:
        throw new Error(`Unsupported PDF page output format: ${outputFormat}`);
    }

    await pipeline.toFile(outputPath);
    outputPaths.push(outputPath);

    emitProgress(onProgress, {
      percent: Math.round(((i + 1) / renderedPages.length) * 100),
      statusMessage: `Saved page ${page.pageNumber} of ${renderedPages.length}`,
      phase: 'converting',
      cancellable: false,
    });
  }

  return outputPaths;
}

function parseFfmpegTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 3) {
    return 0;
  }
  const hours = parseFloat(parts[0]) || 0;
  const minutes = parseFloat(parts[1]) || 0;
  const seconds = parseFloat(parts[2]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

async function runFfmpeg(
  args: string[],
  onProgress?: ProgressCallback,
  durationSeconds?: number
): Promise<void> {
  const ffmpegPath = resolveFfmpegPath();

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { windowsHide: true });
    activeProcess = proc;

    emitProgress(onProgress, {
      percent: 5,
      statusMessage: 'Starting FFmpeg…',
      phase: 'converting',
      cancellable: true,
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      const timeMatch = text.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (timeMatch && durationSeconds && durationSeconds > 0) {
        const current = parseFfmpegTimeToSeconds(timeMatch[1]);
        const percent = Math.min(99, Math.round((current / durationSeconds) * 100));
        emitProgress(onProgress, {
          percent,
          statusMessage: `Encoding… ${percent}%`,
          phase: 'converting',
          cancellable: true,
        });
      }
    });

    proc.on('error', (error) => {
      activeProcess = null;
      reject(error);
    });

    proc.on('close', (code) => {
      activeProcess = null;
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code ?? 'unknown'}`));
      }
    });
  });
}

async function probeMediaDuration(sourcePath: string): Promise<number | undefined> {
  try {
    const ffmpegPath = resolveFfmpegPath();
    const result = await new Promise<string>((resolve, reject) => {
      const proc = spawn(ffmpegPath, ['-i', sourcePath, '-f', 'null', '-'], { windowsHide: true });
      let stderr = '';
      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      proc.on('close', () => resolve(stderr));
      proc.on('error', reject);
    });

    const durationMatch = result.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/);
    if (durationMatch) {
      return parseFfmpegTimeToSeconds(durationMatch[1]);
    }
  } catch {
    return undefined;
  }
  return undefined;
}

async function convertWithFfmpeg(
  sourcePath: string,
  outputPath: string,
  outputFormat: FileConverterOutputFormat,
  onProgress?: ProgressCallback
): Promise<void> {
  const duration = await probeMediaDuration(sourcePath);
  const args: string[] = ['-y', '-i', sourcePath];

  switch (outputFormat) {
    case 'mp4':
      args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-b:a', '128k');
      break;
    case 'webm':
      args.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus');
      break;
    case 'gif':
      args.push('-vf', 'fps=10,scale=640:-1:flags=lanczos', '-loop', '0');
      break;
    case 'png':
      args.push('-frames:v', '1');
      break;
    case 'jpeg':
      args.push('-frames:v', '1', '-q:v', '2');
      break;
    default:
      throw new Error(`FFmpeg cannot produce ${outputFormat} from this source`);
  }

  args.push(outputPath);
  await runFfmpeg(args, onProgress, duration);

  emitProgress(onProgress, {
    percent: 100,
    statusMessage: 'Conversion complete',
    phase: 'complete',
    cancellable: false,
  });
}

function buildOutputPath(
  sourcePath: string,
  outputFormat: FileConverterOutputFormat,
  outputDirectory?: string
): string {
  const baseName = path.basename(sourcePath, path.extname(sourcePath));
  const ext = outputFormatToExtension(outputFormat);
  const dir = outputDirectory ?? path.dirname(sourcePath);
  return path.join(dir, `${baseName}-converted${ext}`);
}

export async function convertFile(
  options: FileConverterOptions,
  onProgress?: ProgressCallback
): Promise<FileConverterJobResult> {
  const { sourcePath, outputFormat, outputDirectory, quality = 85, renderedPages } = options;

  if (!isSafePath(sourcePath)) {
    return { success: false, error: 'Invalid source path' };
  }

  if (outputDirectory && !isSafePath(outputDirectory)) {
    return { success: false, error: 'Invalid output directory' };
  }

  if (!isConversionSupported(sourcePath, outputFormat)) {
    return { success: false, error: 'Conversion not supported for this file type pair' };
  }

  const category = detectFileConverterCategory(sourcePath);
  if (!category) {
    return { success: false, error: 'Unsupported source file type' };
  }

  try {
    emitProgress(onProgress, {
      percent: 0,
      statusMessage: 'Preparing conversion…',
      phase: 'preparing',
      cancellable: true,
    });

    const outDir = outputDirectory ?? (await fs.mkdtemp(path.join(os.tmpdir(), 'vault-convert-')));

    if (category === 'pdf') {
      if (!renderedPages || renderedPages.length === 0) {
        return {
          success: false,
          error: 'PDF conversion requires rendered pages from the renderer process',
        };
      }

      if (outputFormat === 'pdf') {
        const tempImages: string[] = [];
        for (const page of renderedPages) {
          const tempPath = path.join(outDir, `temp-page-${page.pageNumber}.jpg`);
          await fs.writeFile(tempPath, stripDataUrlPrefix(page.imageData));
          tempImages.push(tempPath);
        }
        const outputPath = buildOutputPath(sourcePath, outputFormat, outDir);
        await convertImagesToPdf(tempImages, outputPath, onProgress);
        return { success: true, outputPath, outputPaths: [outputPath] };
      }

      const outputPaths = await convertPdfPagesToImages(
        renderedPages,
        outDir,
        outputFormat,
        quality,
        onProgress
      );
      return {
        success: true,
        outputPath: outputPaths[0],
        outputPaths,
      };
    }

    const outputPath = buildOutputPath(sourcePath, outputFormat, outDir);

    if (category === 'image' || category === 'gif') {
      if (outputFormat === 'pdf') {
        await convertImagesToPdf([sourcePath], outputPath, onProgress);
      } else if (outputFormat === 'mp4' || outputFormat === 'webm') {
        await convertWithFfmpeg(sourcePath, outputPath, outputFormat, onProgress);
      } else {
        await convertImageWithSharp(sourcePath, outputPath, outputFormat, quality, onProgress);
      }
    } else if (category === 'video') {
      await convertWithFfmpeg(sourcePath, outputPath, outputFormat, onProgress);
    }

    return { success: true, outputPath, outputPaths: [outputPath] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}
