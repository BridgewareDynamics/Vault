import { vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock Electron app
export const mockApp = {
  isReady: vi.fn(() => true),
  isPackaged: false,
  getPath: vi.fn((name: string) => {
    if (name === 'userData') {
      return '/mock/user/data';
    }
    return '/mock/path';
  }),
  getVersion: vi.fn(() => '1.0.0'),
  whenReady: vi.fn(() => Promise.resolve()),
  on: vi.fn(),
  quit: vi.fn(),
};

// Mock BrowserWindow
export const mockBrowserWindow = {
  show: vi.fn(),
  loadURL: vi.fn(),
  loadFile: vi.fn(),
  close: vi.fn(),
  destroy: vi.fn(),
  webContents: {
    openDevTools: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
  },
  on: vi.fn(),
  once: vi.fn(),
};

export const MockBrowserWindow = vi.fn(() => mockBrowserWindow);

// Mock dialog
export const mockDialog = {
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  showMessageBox: vi.fn(),
};

// Mock ipcMain
export const mockIpcMain = {
  handle: vi.fn(),
  on: vi.fn(),
  removeHandler: vi.fn(),
  removeAllListeners: vi.fn(),
};

// Mock fs/promises
export const mockFsPromises = {
  access: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  copyFile: vi.fn(),
  unlink: vi.fn(),
  rm: vi.fn(),
  rename: vi.fn(),
};

// Mock fs (sync)
export const mockFs = {
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  statSync: vi.fn(),
  promises: mockFsPromises,
};

// Mock path
export const mockPath = {
  join: path.join,
  dirname: path.dirname,
  basename: path.basename,
  extname: path.extname,
  normalize: path.normalize,
  resolve: path.resolve,
};

// Mock JSZip
export const mockJSZip = vi.fn(() => ({
  folder: vi.fn(() => ({
    file: vi.fn(),
  })),
  generateAsync: vi.fn(() => Promise.resolve(Buffer.from('mock zip data'))),
}));

// Setup mocks before each test
export function setupElectronMocks() {
  vi.mock('electron', () => ({
    app: mockApp,
    BrowserWindow: MockBrowserWindow,
    dialog: mockDialog,
    ipcMain: mockIpcMain,
  }));

  vi.mock('fs/promises', () => mockFsPromises);
  vi.mock('fs', () => mockFs);
  vi.mock('path', () => mockPath);
  vi.mock('jszip', () => ({
    default: mockJSZip,
  }));
  vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => 'mock-uuid-1234'),
  }));
}

// Reset all mocks
export function resetElectronMocks() {
  vi.clearAllMocks();
  Object.values(mockApp).forEach((fn) => {
    if (typeof fn === 'function' && vi.isMockFunction(fn)) {
      fn.mockReset();
    }
  });
  Object.values(mockDialog).forEach((fn) => {
    if (typeof fn === 'function' && vi.isMockFunction(fn)) {
      fn.mockReset();
    }
  });
  Object.values(mockIpcMain).forEach((fn) => {
    if (typeof fn === 'function' && vi.isMockFunction(fn)) {
      fn.mockReset();
    }
  });
  Object.values(mockFsPromises).forEach((fn) => {
    if (typeof fn === 'function' && vi.isMockFunction(fn)) {
      fn.mockReset();
    }
  });
}

