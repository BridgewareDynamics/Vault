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
 * Validates that an identifier is safe to use as a filename component.
 *
 * Storage identifiers (e.g. bookmark IDs) are interpolated directly into file
 * paths. Allowing only an explicit alphanumeric/`-`/`_` charset prevents path
 * traversal (`..`, `/`, `\`) and other filesystem metacharacters from reaching
 * `path.join`. Generated IDs (e.g. `bookmark-<ts>-<rand>`) match this charset,
 * so legitimate callers are unaffected.
 */
export function isSafeStorageId(id: unknown): id is string {
  if (!id || typeof id !== 'string') {
    return false;
  }
  // Bound the length to avoid pathologically long filenames.
  if (id.length > 128) {
    return false;
  }
  return /^[A-Za-z0-9_-]+$/.test(id);
}

/**
 * Confirms that a resolved path is contained within one of the allowed base
 * directories. This is defense-in-depth on top of {@link isSafePath}: even if a
 * traversal token slips through, the operation is rejected unless it resolves
 * inside an expected root (e.g. the archive drive or userData directory).
 *
 * @param targetPath The path to check (may be relative or absolute).
 * @param allowedBaseDirs One or more base directories the path must live under.
 */
export function isPathWithinBase(
  targetPath: string,
  allowedBaseDirs: Array<string | null | undefined>,
): boolean {
  if (!targetPath || typeof targetPath !== 'string') {
    return false;
  }

  // Windows paths are case-insensitive; normalize casing for comparison there
  // so a base of `D:\Archive` still matches a target of `d:\archive\file`.
  const normalizeCase = (p: string): string =>
    process.platform === 'win32' ? p.toLowerCase() : p;

  const resolvedTarget = normalizeCase(path.resolve(targetPath));

  for (const baseDir of allowedBaseDirs) {
    if (!baseDir || typeof baseDir !== 'string') {
      continue;
    }
    const resolvedBase = normalizeCase(path.resolve(baseDir));
    if (resolvedTarget === resolvedBase) {
      return true;
    }
    // Compare against the base dir plus a trailing separator so that a base of
    // `/data/archive` does not match a sibling like `/data/archive-evil`.
    const baseWithSep = resolvedBase.endsWith(path.sep)
      ? resolvedBase
      : resolvedBase + path.sep;
    if (resolvedTarget.startsWith(baseWithSep)) {
      return true;
    }
  }

  return false;
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

