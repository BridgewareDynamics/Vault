import { VALID_PDF_EXTENSIONS } from './constants';
import path from 'path';

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

  // Check for path traversal patterns
  const normalizedPath = path.normalize(filePath);
  const dangerousPatterns = ['..', '~', '//'];
  
  for (const pattern of dangerousPatterns) {
    if (normalizedPath.includes(pattern)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates if a directory path is valid and safe
 */
export function isValidDirectory(dirPath: string): boolean {
  if (!dirPath || typeof dirPath !== 'string') {
    return false;
  }

  return isSafePath(dirPath);
}

/**
 * Validates a folder name (for ZIP folder creation)
 */
export function isValidFolderName(folderName: string): boolean {
  if (!folderName || typeof folderName !== 'string') {
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

/**
 * Validates a file name (for text file creation)
 * Similar to folder name validation but also checks for trailing periods/spaces
 */
export function isValidFileName(fileName: string): boolean {
  if (!fileName || typeof fileName !== 'string') {
    return false;
  }

  // Remove .txt extension if present for validation
  const nameWithoutExt = fileName.endsWith('.txt') 
    ? fileName.slice(0, -4) 
    : fileName;

  // Check for whitespace-only strings
  if (nameWithoutExt.trim().length === 0) {
    return false;
  }

  // Check for invalid characters in file names
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(nameWithoutExt)) {
    return false;
  }

  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(nameWithoutExt.toUpperCase())) {
    return false;
  }

  // Check for trailing periods or spaces (Windows doesn't allow these)
  if (nameWithoutExt.endsWith('.') || nameWithoutExt.endsWith(' ')) {
    return false;
  }

  // Check length (Windows max is 255, but we'll be conservative)
  // Account for .txt extension
  if (fileName.length > 204) {
    return false;
  }

  return true;
}



