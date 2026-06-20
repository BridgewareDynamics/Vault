import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { getArchiveDrive } from './archiveConfig';
import { isSafePath } from './pathValidator';
import { logger } from './logger';
import {
  countTopLevelArrayObjects,
  extractJsonNullableStringField,
  extractJsonStringField,
  LIST_SCAN_CONCURRENCY,
  mapWithConcurrency,
} from './listScanUtils';

export const MAP_JSON_FILENAME = 'map.vault-map.json';
export const MAP_ASSETS_DIR = 'assets';

export type MapFileType = 'image' | 'pdf' | 'video' | 'other';

export function detectMapFileType(filePath: string): MapFileType {
  const ext = path.extname(filePath).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  if (ext === '.pdf') return 'pdf';
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return 'other';
}

export async function getMapLibraryPath(): Promise<string> {
  const archiveDrive = await getArchiveDrive();
  if (!archiveDrive) {
    throw new Error('Vault directory not set');
  }
  const mapLibraryPath = path.join(archiveDrive, 'MapLibrary');
  await fs.mkdir(mapLibraryPath, { recursive: true });
  return mapLibraryPath;
}

export function getCaseMapsPath(casePath: string): string {
  return path.join(casePath, '.maps');
}

export function getMapFolderPath(basePath: string, mapId: string): string {
  return path.join(basePath, mapId);
}

export function getMapJsonPath(mapFolderPath: string): string {
  return path.join(mapFolderPath, MAP_JSON_FILENAME);
}

export function getMapAssetsPath(mapFolderPath: string): string {
  return path.join(mapFolderPath, MAP_ASSETS_DIR);
}

export interface MapDocumentStored {
  id: string;
  title: string;
  version: 1;
  createdAt: number;
  updatedAt: number;
  casePath: string | null;
  mapFolderPath: string;
  blocks: unknown[];
  edges: unknown[];
  viewport: { x: number; y: number; zoom: number };
  layoutMode: 'timeline-vertical';
  defaultEdgeStyle: 'solid' | 'dotted';
  defaultEdgeAppearance?: {
    colorMode?: 'theme' | 'custom' | 'linked-blocks';
    strokeColor?: string;
    glowColor?: string;
  };
}

export interface MapListEntryStored {
  id: string;
  title: string;
  mapFolderPath: string;
  casePath: string | null;
  caseName?: string;
  modified: number;
  blockCount: number;
}

export function createEmptyMapDocument(title: string, mapFolderPath: string, casePath: string | null): MapDocumentStored {
  const now = Date.now();
  return {
    id: path.basename(mapFolderPath),
    title,
    version: 1,
    createdAt: now,
    updatedAt: now,
    casePath,
    mapFolderPath,
    blocks: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    layoutMode: 'timeline-vertical',
    defaultEdgeStyle: 'solid',
    defaultEdgeAppearance: {
      colorMode: 'theme',
    },
  };
}

export async function readMapDocument(mapFolderPath: string): Promise<MapDocumentStored> {
  if (!isSafePath(mapFolderPath)) {
    throw new Error('Invalid map folder path');
  }
  const jsonPath = getMapJsonPath(mapFolderPath);
  const raw = await fs.readFile(jsonPath, 'utf8');
  const doc = JSON.parse(raw) as MapDocumentStored;
  doc.mapFolderPath = mapFolderPath;
  return doc;
}

export async function writeMapDocument(doc: MapDocumentStored): Promise<void> {
  if (!isSafePath(doc.mapFolderPath)) {
    throw new Error('Invalid map folder path');
  }
  doc.updatedAt = Date.now();
  const jsonPath = getMapJsonPath(doc.mapFolderPath);
  await fs.mkdir(doc.mapFolderPath, { recursive: true });
  await fs.mkdir(getMapAssetsPath(doc.mapFolderPath), { recursive: true });
  await fs.writeFile(jsonPath, JSON.stringify(doc, null, 2), 'utf8');
}

export async function saveMapDocument(doc: MapDocumentStored): Promise<MapDocumentStored> {
  let nextFolderPath = doc.mapFolderPath;
  const nextCasePath = doc.casePath ?? null;

  if (nextCasePath) {
    if (!isSafePath(nextCasePath)) {
      throw new Error('Invalid case path');
    }
    const mapsPath = getCaseMapsPath(nextCasePath);
    await fs.mkdir(mapsPath, { recursive: true });
    nextFolderPath = getMapFolderPath(mapsPath, doc.id);
  } else {
    const libraryPath = await getMapLibraryPath();
    nextFolderPath = getMapFolderPath(libraryPath, doc.id);
  }

  const currentPath = path.normalize(doc.mapFolderPath);
  const targetPath = path.normalize(nextFolderPath);

  if (currentPath !== targetPath) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.rename(currentPath, targetPath);
  }

  const nextDoc: MapDocumentStored = {
    ...doc,
    casePath: nextCasePath,
    mapFolderPath: nextFolderPath,
  };

  await writeMapDocument(nextDoc);
  return nextDoc;
}

async function scanMapFolder(mapFolderPath: string, casePath: string | null, caseName?: string): Promise<MapListEntryStored | null> {
  const jsonPath = getMapJsonPath(mapFolderPath);
  if (!existsSync(jsonPath)) return null;
  try {
    const [raw, stats] = await Promise.all([
      fs.readFile(jsonPath, 'utf8'),
      fs.stat(jsonPath),
    ]);
    const id = extractJsonStringField(raw, 'id') ?? path.basename(mapFolderPath);
    const title = extractJsonStringField(raw, 'title') ?? 'Untitled Map';
    const docCasePath = extractJsonNullableStringField(raw, 'casePath');
    return {
      id,
      title,
      mapFolderPath,
      casePath: docCasePath ?? casePath,
      caseName,
      modified: stats.mtimeMs,
      blockCount: countTopLevelArrayObjects(raw, 'blocks'),
    };
  } catch (error) {
    logger.warn(`Failed to read map at ${mapFolderPath}:`, error);
    return null;
  }
}

export async function listMapsInDirectory(basePath: string, casePath: string | null, caseName?: string): Promise<MapListEntryStored[]> {
  if (!isSafePath(basePath)) return [];
  try {
    const entries = await fs.readdir(basePath, { withFileTypes: true });
    const folders = entries.filter(
      (entry) => entry.isDirectory() && !entry.name.startsWith('.')
    );
    const results = await mapWithConcurrency(folders, LIST_SCAN_CONCURRENCY, async (entry) => {
      const mapFolderPath = path.join(basePath, entry.name);
      return scanMapFolder(mapFolderPath, casePath, caseName);
    });
    return results.sort((a, b) => b.modified - a.modified);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function listAllMaps(): Promise<MapListEntryStored[]> {
  const libraryPath = await getMapLibraryPath();
  const archiveDrive = await getArchiveDrive();

  const [globalMaps, caseMaps] = await Promise.all([
    listMapsInDirectory(libraryPath, null),
    archiveDrive ? scanCaseMaps(archiveDrive) : Promise.resolve([] as MapListEntryStored[]),
  ]);

  const combined = [...globalMaps, ...caseMaps];
  combined.sort((a, b) => b.modified - a.modified);
  return combined;
}

async function scanCaseMaps(archiveDrive: string): Promise<MapListEntryStored[]> {
  try {
    const entries = await fs.readdir(archiveDrive, { withFileTypes: true });
    const caseFolders = entries.filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        entry.name !== 'MapLibrary' &&
        entry.name !== 'TextLibrary'
    );

    const caseResults = await mapWithConcurrency(
      caseFolders,
      LIST_SCAN_CONCURRENCY,
      async (entry) => {
        const casePath = path.join(archiveDrive, entry.name);
        const mapsPath = getCaseMapsPath(casePath);
        return listMapsInDirectory(mapsPath, casePath, entry.name);
      }
    );

    return caseResults.flat();
  } catch (error) {
    logger.warn('Failed to scan case maps:', error);
    return [];
  }
}

export async function listCaseMaps(casePath: string): Promise<MapListEntryStored[]> {
  if (!isSafePath(casePath)) {
    throw new Error('Invalid case path');
  }
  const mapsPath = getCaseMapsPath(casePath);
  await fs.mkdir(mapsPath, { recursive: true });
  const caseName = path.basename(casePath);
  return listMapsInDirectory(mapsPath, casePath, caseName);
}

export async function createMap(title: string, casePath?: string | null): Promise<MapDocumentStored> {
  const mapId = randomUUID();
  let mapFolderPath: string;
  let resolvedCasePath: string | null = null;

  if (casePath) {
    if (!isSafePath(casePath)) {
      throw new Error('Invalid case path');
    }
    const mapsPath = getCaseMapsPath(casePath);
    await fs.mkdir(mapsPath, { recursive: true });
    mapFolderPath = getMapFolderPath(mapsPath, mapId);
    resolvedCasePath = casePath;
  } else {
    const libraryPath = await getMapLibraryPath();
    mapFolderPath = getMapFolderPath(libraryPath, mapId);
  }

  await fs.mkdir(getMapAssetsPath(mapFolderPath), { recursive: true });
  const doc = createEmptyMapDocument(title, mapFolderPath, resolvedCasePath);
  doc.id = mapId;
  await writeMapDocument(doc);
  return doc;
}

export async function deleteMap(mapFolderPath: string): Promise<void> {
  if (!isSafePath(mapFolderPath)) {
    throw new Error('Invalid map folder path');
  }
  await fs.rm(mapFolderPath, { recursive: true, force: true });
}

export async function renameMap(mapFolderPath: string, newTitle: string): Promise<MapDocumentStored> {
  const doc = await readMapDocument(mapFolderPath);
  doc.title = newTitle;
  await writeMapDocument(doc);
  return doc;
}

export async function copyAttachmentToMapAssets(
  mapFolderPath: string,
  sourcePath: string,
  attachmentId: string
): Promise<{ relativePath: string; vaultPath: string; fileName: string; type: MapFileType }> {
  if (!isSafePath(mapFolderPath) || !isSafePath(sourcePath)) {
    throw new Error('Invalid path');
  }
  const fileName = path.basename(sourcePath);
  const ext = path.extname(fileName);
  const destFileName = `${attachmentId}${ext}`;
  const assetsPath = getMapAssetsPath(mapFolderPath);
  await fs.mkdir(assetsPath, { recursive: true });
  const vaultPath = path.join(assetsPath, destFileName);
  await fs.copyFile(sourcePath, vaultPath);
  return {
    relativePath: path.join(MAP_ASSETS_DIR, destFileName),
    vaultPath,
    fileName,
    type: detectMapFileType(sourcePath),
  };
}

export async function exportMapToDirectory(mapFolderPath: string, destDirectory: string): Promise<string> {
  if (!isSafePath(mapFolderPath) || !isSafePath(destDirectory)) {
    throw new Error('Invalid path');
  }
  const doc = await readMapDocument(mapFolderPath);
  const exportFolderName = `${doc.title.replace(/[<>:"/\\|?*]/g, '_')}_${doc.id.slice(0, 8)}`;
  const exportPath = path.join(destDirectory, exportFolderName);
  await fs.cp(mapFolderPath, exportPath, { recursive: true });
  return exportPath;
}

export async function saveMapPng(mapFolderPath: string, pngBase64: string, destFilePath?: string): Promise<string> {
  const base64Data = pngBase64.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  let outputPath = destFilePath;
  if (!outputPath) {
    const doc = await readMapDocument(mapFolderPath);
    const safeTitle = doc.title.replace(/[<>:"/\\|?*]/g, '_');
    outputPath = path.join(mapFolderPath, `${safeTitle}_export.png`);
  }
  if (!isSafePath(outputPath)) {
    throw new Error('Invalid output path');
  }
  await fs.writeFile(outputPath, buffer);
  return outputPath;
}
