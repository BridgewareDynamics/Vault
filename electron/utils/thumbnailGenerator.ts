import * as fs from 'fs/promises';
import * as path from 'path';
import { isValidPDFFile } from './pathValidator';
import sharp from 'sharp';

const THUMBNAIL_SIZE = 200;
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];

/**
 * Get file extension
 */
function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * Check if file is an image
 */
function isImageFile(filePath: string): boolean {
  return IMAGE_EXTENSIONS.includes(getFileExtension(filePath));
}

/**
 * Check if file is a video
 */
function isVideoFile(filePath: string): boolean {
  return VIDEO_EXTENSIONS.includes(getFileExtension(filePath));
}

/**
 * Generate thumbnail for an image file using Sharp
 * Reads file into memory first to avoid keeping file handle open (especially important for WebP files)
 */
async function generateImageThumbnail(filePath: string): Promise<string> {
  let fileBuffer: Buffer | null = null;
  try {
    // Read file into memory first - this ensures the file handle is closed before Sharp processes it
    // This is especially important for WebP files which Sharp may keep handles open longer
    fileBuffer = await fs.readFile(filePath);
    
    // Process from buffer instead of file path - this prevents Sharp from keeping file handle open
    const buffer = await sharp(fileBuffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 26, g: 26, b: 46, alpha: 1 }, // #1a1a2e
      })
      .png()
      .toBuffer();

    // Clear the file buffer reference to help GC
    fileBuffer = null;
    
    const base64 = buffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    // Ensure buffer is cleared even on error
    fileBuffer = null;
    throw new Error(`Failed to generate image thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate thumbnail for a PDF file (placeholder - PDF thumbnails will be handled in renderer)
 */
async function generatePDFThumbnail(filePath: string): Promise<string> {
  // PDF thumbnails will be generated in the renderer process using pdfjs-dist
  // For now, return a placeholder
  return generatePlaceholderThumbnail('📄', '#8b5cf6');
}

/**
 * Generate thumbnail for a video file (placeholder)
 * Note: Video thumbnails are generated in the renderer process using HTML5 Video API
 * This function is kept as a fallback for cases where renderer generation fails
 */
async function generateVideoThumbnail(filePath: string): Promise<string> {
  // Video thumbnails are handled in renderer process using HTML5 Video API
  // Return placeholder as fallback
  return generatePlaceholderThumbnail('🎬', '#8b5cf6');
}

/**
 * Generate a placeholder thumbnail with an icon
 */
async function generatePlaceholderThumbnail(icon: string, color: string): Promise<string> {
  // Create a simple SVG thumbnail
  const svg = `
    <svg width="${THUMBNAIL_SIZE}" height="${THUMBNAIL_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a2e"/>
      <text x="50%" y="50%" font-size="64" text-anchor="middle" dominant-baseline="middle" fill="${color}">${icon}</text>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(svg))
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE)
    .png()
    .toBuffer();

  const base64 = buffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

/**
 * Generate thumbnail for any file type
 */
export async function generateFileThumbnail(filePath: string): Promise<string> {
  if (isImageFile(filePath)) {
    return generateImageThumbnail(filePath);
  } else if (isValidPDFFile(filePath)) {
    return generatePDFThumbnail(filePath);
  } else if (isVideoFile(filePath)) {
    return generateVideoThumbnail(filePath);
  } else {
    // Generic file icon
    return generatePlaceholderThumbnail('📄', '#6b7280');
  }
}

