import * as path from 'path';

export type FileConverterCategory = 'image' | 'pdf' | 'video' | 'gif';

export type FileConverterOutputFormat =
  | 'png'
  | 'jpeg'
  | 'webp'
  | 'tiff'
  | 'pdf'
  | 'gif'
  | 'mp4'
  | 'webm';

const IMAGE_INPUT = ['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.tif', '.bmp', '.gif'] as const;
const PDF_INPUT = ['.pdf'] as const;
const VIDEO_INPUT = ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.wmv', '.flv'] as const;

const EXT_TO_CATEGORY: Record<string, FileConverterCategory> = {
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.webp': 'image',
  '.tiff': 'image',
  '.tif': 'image',
  '.bmp': 'image',
  '.gif': 'gif',
  '.pdf': 'pdf',
  '.mp4': 'video',
  '.mov': 'video',
  '.mkv': 'video',
  '.webm': 'video',
  '.avi': 'video',
  '.wmv': 'video',
  '.flv': 'video',
};

const CONVERSION_MATRIX: Record<FileConverterCategory, FileConverterOutputFormat[]> = {
  image: ['png', 'jpeg', 'webp', 'tiff', 'pdf', 'gif', 'mp4'],
  gif: ['png', 'jpeg', 'webp', 'gif', 'mp4', 'webm'],
  pdf: ['png', 'jpeg', 'webp', 'tiff', 'pdf'],
  video: ['mp4', 'webm', 'gif', 'png', 'jpeg'],
};

export function getExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function detectFileConverterCategory(filePath: string): FileConverterCategory | null {
  const ext = getExtension(filePath);
  return EXT_TO_CATEGORY[ext] ?? null;
}

export function getSupportedInputExtensions(): string[] {
  return [...IMAGE_INPUT, ...PDF_INPUT, ...VIDEO_INPUT];
}

export function getOutputFormatsForCategory(category: FileConverterCategory): FileConverterOutputFormat[] {
  return CONVERSION_MATRIX[category] ?? [];
}

export function getOutputFormatsForPath(sourcePath: string): FileConverterOutputFormat[] {
  const category = detectFileConverterCategory(sourcePath);
  if (!category) {
    return [];
  }
  return getOutputFormatsForCategory(category);
}

export function isConversionSupported(
  sourcePath: string,
  outputFormat: FileConverterOutputFormat
): boolean {
  return getOutputFormatsForPath(sourcePath).includes(outputFormat);
}

export function outputFormatToExtension(format: FileConverterOutputFormat): string {
  switch (format) {
    case 'jpeg':
      return '.jpg';
    case 'tiff':
      return '.tif';
    default:
      return `.${format}`;
  }
}

export function isConvertibleFile(filePath: string): boolean {
  return detectFileConverterCategory(filePath) !== null;
}

export function getConverterCapabilities() {
  return {
    inputExtensions: getSupportedInputExtensions(),
    matrix: CONVERSION_MATRIX,
  };
}
