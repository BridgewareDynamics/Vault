// path: electron/__tests__/preload.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Electron APIs used in preload
const exposeInMainWorldMock = vi.fn();
const invokeMock = vi.fn();

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: exposeInMainWorldMock,
  },
  ipcRenderer: {
    invoke: invokeMock,
  },
}));

describe('preload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('exposes electronAPI on window with expected methods', async () => {
    // Importing the module should register the API on the main world
    await import('../preload');

    expect(exposeInMainWorldMock).toHaveBeenCalledTimes(1);
    const [key, api] = exposeInMainWorldMock.mock.calls[0];

    expect(key).toBe('electronAPI');
    expect(typeof api).toBe('object');

    // Check that a few representative methods exist
    expect(typeof api.selectPDFFile).toBe('function');
    expect(typeof api.selectSaveDirectory).toBe('function');
    expect(typeof api.saveFiles).toBe('function');
    expect(typeof api.listArchiveCases).toBe('function');
    expect(typeof api.extractPDFFromArchive).toBe('function');
  });

  it('delegates API calls to ipcRenderer.invoke with correct channels', async () => {
    await import('../preload');
    expect(exposeInMainWorldMock).toHaveBeenCalledTimes(1);
    const [, api] = exposeInMainWorldMock.mock.calls[0];

    // Call a couple of methods and ensure they invoke the correct IPC channels
    await api.selectPDFFile();
    await api.selectSaveDirectory();

    expect(invokeMock).toHaveBeenCalledWith('select-pdf-file');
    expect(invokeMock).toHaveBeenCalledWith('select-save-directory');
  });
});


