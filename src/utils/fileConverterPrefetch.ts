import type { FileConverterCapabilities } from '../types';

type FileConverterModuleType = typeof import('../components/FileConverter/FileConverterModule');

let fileConverterModuleImport: Promise<{
  FileConverterModule: FileConverterModuleType['FileConverterModule'];
}> | null = null;

let caseSelectionDialogImport: Promise<unknown> | null = null;

let capabilitiesCache: FileConverterCapabilities | null = null;
let capabilitiesInflight: Promise<FileConverterCapabilities | null> | null = null;

export function loadFileConverterModule() {
  if (!fileConverterModuleImport) {
    fileConverterModuleImport = import('../components/FileConverter/FileConverterModule');
  }
  return fileConverterModuleImport;
}

export function prefetchFileConverterModule(): Promise<unknown> {
  return loadFileConverterModule();
}

export function prefetchCaseSelectionDialog(): Promise<unknown> {
  if (!caseSelectionDialogImport) {
    caseSelectionDialogImport = import('../components/Archive/CaseSelectionDialog');
  }
  return caseSelectionDialogImport;
}

export function getCachedFileConverterCapabilities(): FileConverterCapabilities | null {
  return capabilitiesCache;
}

export async function prefetchFileConverterCapabilities(): Promise<FileConverterCapabilities | null> {
  if (capabilitiesCache) {
    return capabilitiesCache;
  }

  if (!window.electronAPI?.getConverterCapabilities) {
    return null;
  }

  if (!capabilitiesInflight) {
    capabilitiesInflight = window.electronAPI
      .getConverterCapabilities()
      .then((caps) => {
        capabilitiesCache = caps;
        return caps;
      })
      .catch(() => null)
      .finally(() => {
        capabilitiesInflight = null;
      });
  }

  return capabilitiesInflight;
}

/** Warm module chunk, case picker, and IPC capabilities while the user is on Welcome. */
export function warmFileConverterEntry(): void {
  void prefetchFileConverterModule().then(() => {
    void prefetchCaseSelectionDialog();
  });
  void prefetchFileConverterCapabilities();
}
