import { ErrorWithCode, ArchiveFile } from '../types';

/**
 * Type guard to check if an error has a code property
 */
export function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error instanceof Error || 'message' in error)
  );
}

/**
 * Type guard to check if an item is an ArchiveFile
 */
export function isArchiveFile(item: unknown): item is ArchiveFile {
  return (
    item !== null &&
    typeof item === 'object' &&
    'name' in item &&
    'path' in item &&
    'size' in item &&
    'modified' in item &&
    'type' in item &&
    typeof (item as Record<string, unknown>).name === 'string' &&
    typeof (item as Record<string, unknown>).path === 'string' &&
    typeof (item as Record<string, unknown>).size === 'number' &&
    typeof (item as Record<string, unknown>).modified === 'number' &&
    typeof (item as Record<string, unknown>).type === 'string'
  );
}

/**
 * Type guard to check if a value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}


