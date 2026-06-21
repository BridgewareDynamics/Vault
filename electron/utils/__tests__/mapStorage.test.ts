import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { saveMapDocument, type MapDocumentStored } from '../mapStorage';

vi.mock('../archiveConfig', () => ({
  getArchiveDrive: vi.fn(async () => 'D:/The Vault App'),
}));

vi.mock('../pathValidator', () => ({
  isSafePath: vi.fn(() => true),
}));

vi.mock('../logger', () => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => true),
  };
});

vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  rename: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
  rm: vi.fn(),
  copyFile: vi.fn(),
  cp: vi.fn(),
}));

function makeDocument(overrides: Partial<MapDocumentStored> = {}): MapDocumentStored {
  return {
    id: 'map-123',
    title: 'Test Map',
    version: 1,
    createdAt: 1,
    updatedAt: 1,
    casePath: null,
    mapFolderPath: path.join('D:/The Vault App', 'MapLibrary', 'map-123'),
    blocks: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    layoutMode: 'timeline-vertical',
    defaultEdgeStyle: 'solid',
    ...overrides,
  };
}

describe('mapStorage.saveMapDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves a global map into a case maps folder when casePath is set', async () => {
    const casePath = path.join('D:/The Vault App', 'Case Alpha');
    const currentPath = path.join('D:/The Vault App', 'MapLibrary', 'map-123');
    const expectedPath = path.join(casePath, '.maps', 'map-123');
    const doc = makeDocument({
      casePath,
      mapFolderPath: currentPath,
    });

    const savedDoc = await saveMapDocument(doc);

    expect(fs.mkdir).toHaveBeenCalledWith(path.join(casePath, '.maps'), { recursive: true });
    expect(fs.rename).toHaveBeenCalledWith(currentPath, expectedPath);
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(expectedPath, 'map.vault-map.json') + '.tmp',
      expect.stringContaining(`"casePath": ${JSON.stringify(casePath)}`),
      'utf8',
    );
    expect(savedDoc.mapFolderPath).toBe(expectedPath);
    expect(savedDoc.casePath).toBe(casePath);
  });

  it('moves a case-linked map back to the global library when casePath is cleared', async () => {
    const currentCasePath = path.join('D:/The Vault App', 'Case Alpha');
    const currentPath = path.join(currentCasePath, '.maps', 'map-123');
    const expectedPath = path.join('D:/The Vault App', 'MapLibrary', 'map-123');
    const doc = makeDocument({
      casePath: null,
      mapFolderPath: currentPath,
    });

    const savedDoc = await saveMapDocument(doc);

    expect(fs.mkdir).toHaveBeenCalledWith(path.join('D:/The Vault App', 'MapLibrary'), { recursive: true });
    expect(fs.rename).toHaveBeenCalledWith(currentPath, expectedPath);
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(expectedPath, 'map.vault-map.json') + '.tmp',
      expect.stringContaining('"casePath": null'),
      'utf8',
    );
    expect(savedDoc.mapFolderPath).toBe(expectedPath);
    expect(savedDoc.casePath).toBeNull();
  });
});
