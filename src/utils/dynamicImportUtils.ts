const DYNAMIC_IMPORT_FAILURE_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
] as const;

export function isDynamicImportFetchFailure(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const normalized = message.toLowerCase();
  return DYNAMIC_IMPORT_FAILURE_PATTERNS.some((pattern) =>
    normalized.includes(pattern.toLowerCase()),
  );
}

/**
 * Retries dynamic imports once when Vite HMR invalidates a stale module URL.
 */
export async function importModuleWithRetry<T>(
  importFn: () => Promise<T>,
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    if (!isDynamicImportFetchFailure(error)) {
      throw error;
    }
    return importFn();
  }
}
