import path from 'path';
import fs from 'fs';

// Constants for path validation
const VALID_PDF_EXTENSIONS = ['.pdf'];

/**
 * Validates if a file path has a valid PDF extension
 */
export function isValidPDFFile(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  return VALID_PDF_EXTENSIONS.includes(ext);
}

/**
 * Validates if a path is safe (prevents path traversal attacks)
 */
export function isSafePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  // Check for path traversal patterns in the original path
  // We check the original path first, then normalize to catch resolved paths
  const dangerousPatterns = ['..', '~'];
  
  // Check original path for dangerous patterns
  for (const pattern of dangerousPatterns) {
    if (filePath.includes(pattern)) {
      return false;
    }
  }

  // Check for double slashes (but allow Windows drive letters like C:\\)
  if (filePath.includes('//')) {
    // Allow C:\\ at the start (Windows drive)
    if (!filePath.match(/^[A-Za-z]:\\/)) {
      return false;
    }
  }

  // Check for double backslashes (but allow Windows drive letters like C:\\)
  // Look for \\ that's not at the start after a drive letter
  if (filePath.includes('\\\\')) {
    // Allow C:\\ at the start (Windows drive letter)
    if (!filePath.match(/^[A-Za-z]:\\\\/)) {
      return false;
    }
    // Also check if there are more double backslashes after the drive
    const afterDrive = filePath.replace(/^[A-Za-z]:\\\\?/, '');
    if (afterDrive.includes('\\\\')) {
      return false;
    }
  }

  // Normalize and check if the normalized path differs significantly
  // (indicating path traversal was resolved)
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath !== filePath && filePath.includes('..')) {
    return false;
  }

  return true;
}

/**
 * Validates if a directory path exists and is accessible
 */
export async function isValidDirectory(dirPath: string): Promise<boolean> {
  if (!dirPath || typeof dirPath !== 'string') {
    return false;
  }

  if (!isSafePath(dirPath)) {
    return false;
  }

  try {
    const stats = await fs.promises.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Validates a folder name (for ZIP folder creation)
 */
export function isValidFolderName(folderName: string): boolean {
  if (!folderName || typeof folderName !== 'string') {
    return false;
  }

  // Check for whitespace-only strings
  if (folderName.trim().length === 0) {
    return false;
  }

  // Check for invalid characters in folder names
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(folderName)) {
    return false;
  }

  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(folderName.toUpperCase())) {
    return false;
  }

  // Check length (Windows max is 255, but we'll be conservative)
  if (folderName.length > 200) {
    return false;
  }

  return true;
}

