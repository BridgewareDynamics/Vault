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

export const TRANSCRIPTION_JSON_FILENAME = 'transcription.vault-transcription.json';
export const TRANSCRIPTION_ASSETS_DIR = 'assets';
export const TRANSCRIPTION_TEXT_FILENAME = 'transcript.txt';
export const TRANSCRIPTION_SEGMENTS_FILENAME = 'segments.json';

export type TranscriptionDocumentStatus =
  | 'draft'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type TranscriptionMediaType = 'audio' | 'video';
export type TranscriptionOutputFormat = 'txt' | 'srt' | 'vtt' | 'json';

export interface TranscriptionMediaSelectionStored {
  sourceId: string;
  startSeconds: number;
  endSeconds: number;
  totalDurationSeconds: number;
}

export interface TranscriptionEngineSettingsStored {
  model: string;
  precision: string;
  device: 'cpu' | 'cuda';
  outputFormat: TranscriptionOutputFormat;
  includeTimestamps: boolean;
  segmentLength: number;
  segmentDuration: number;
  curateText: boolean;
  batchRecursive: boolean;
  mediaSelection?: TranscriptionMediaSelectionStored | null;
}

export interface TranscriptionProgressStored {
  stage: 'idle' | 'booting' | 'queued' | 'processing' | 'saving' | 'completed' | 'failed' | 'cancelled';
  current: number;
  total: number;
  percentage: number;
  statusMessage?: string;
}

export interface TranscriptionSegmentStored {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionSourceStored {
  id: string;
  fileName: string;
  originalPath: string;
  storedPath?: string;
  relativePath?: string;
  mediaType: TranscriptionMediaType;
  origin: 'vault' | 'local';
  casePath?: string | null;
}

export interface TranscriptionDocumentStored {
  id: string;
  title: string;
  version: 1;
  createdAt: number;
  updatedAt: number;
  casePath: string | null;
  transcriptionFolderPath: string;
  status: TranscriptionDocumentStatus;
  progress: TranscriptionProgressStored;
  settings: TranscriptionEngineSettingsStored;
  sources: TranscriptionSourceStored[];
  transcriptText: string;
  transcriptFilePath?: string;
  segments: TranscriptionSegmentStored[];
  segmentsFilePath?: string;
  summary?: string;
  lastError?: string;
}

export interface TranscriptionListEntryStored {
  id: string;
  title: string;
  transcriptionFolderPath: string;
  casePath: string | null;
  caseName?: string;
  modified: number;
  sourceCount: number;
  status: TranscriptionDocumentStatus;
  excerpt?: string;
}

export interface SavedTranscriptionOutputs {
  transcriptFilePath: string;
  segmentsFilePath: string;
}

export const PREFERRED_PARAKEET_MODEL_KEY = 'Parakeet TDT 0.6B v3 - float32';
export const LEGACY_PARAKEET_MODEL_KEY = 'Parakeet TDT 0.6B v2 - bfloat16';

export function normalizeTranscriptionEngineSettings(
  settings: TranscriptionEngineSettingsStored
): TranscriptionEngineSettingsStored {
  const usesLegacyParakeetV2 =
    settings.model.includes('0.6B v2') || settings.model === LEGACY_PARAKEET_MODEL_KEY;

  if (!usesLegacyParakeetV2) {
    return settings;
  }

  return {
    ...settings,
    model: PREFERRED_PARAKEET_MODEL_KEY,
    precision: 'float32',
  };
}

export function buildDefaultTranscriptionSettings(): TranscriptionEngineSettingsStored {
  return {
    model: PREFERRED_PARAKEET_MODEL_KEY,
    precision: 'float32',
    device: 'cuda',
    outputFormat: 'txt',
    includeTimestamps: true,
    segmentLength: 90,
    segmentDuration: 10,
    curateText: true,
    batchRecursive: false,
  };
}

export function buildDefaultTranscriptionProgress(): TranscriptionProgressStored {
  return {
    stage: 'idle',
    current: 0,
    total: 0,
    percentage: 0,
    statusMessage: 'Ready to transcribe',
  };
}

const VIDEO_EXTENSIONS = new Set([
  '.asf',
  '.avi',
  '.mkv',
  '.mov',
  '.mp4',
  '.webm',
  '.wmv',
]);

export function detectTranscriptionMediaType(filePath: string): TranscriptionMediaType {
  const ext = path.extname(filePath).toLowerCase();
  if (VIDEO_EXTENSIONS.has(ext)) {
    return 'video';
  }

  return 'audio';
}

export async function getTranscriptionLibraryPath(): Promise<string> {
  const archiveDrive = await getArchiveDrive();
  if (!archiveDrive) {
    throw new Error('Vault directory not set');
  }

  const libraryPath = path.join(archiveDrive, 'TranscriptionLibrary');
  await fs.mkdir(libraryPath, { recursive: true });
  return libraryPath;
}

export function getCaseTranscriptionsPath(casePath: string): string {
  return path.join(casePath, '.transcriptions');
}

export function getTranscriptionFolderPath(basePath: string, transcriptionId: string): string {
  return path.join(basePath, transcriptionId);
}

export function getTranscriptionJsonPath(transcriptionFolderPath: string): string {
  return path.join(transcriptionFolderPath, TRANSCRIPTION_JSON_FILENAME);
}

export function getTranscriptionAssetsPath(transcriptionFolderPath: string): string {
  return path.join(transcriptionFolderPath, TRANSCRIPTION_ASSETS_DIR);
}

export function createEmptyTranscriptionDocument(
  title: string,
  transcriptionFolderPath: string,
  casePath: string | null
): TranscriptionDocumentStored {
  const now = Date.now();

  return {
    id: path.basename(transcriptionFolderPath),
    title,
    version: 1,
    createdAt: now,
    updatedAt: now,
    casePath,
    transcriptionFolderPath,
    status: 'draft',
    progress: buildDefaultTranscriptionProgress(),
    settings: buildDefaultTranscriptionSettings(),
    sources: [],
    transcriptText: '',
    segments: [],
    summary: '',
  };
}

function summarizeTranscript(transcriptText: string): string {
  const collapsed = transcriptText.replace(/\s+/g, ' ').trim();
  if (!collapsed) return '';
  if (collapsed.length <= 220) return collapsed;
  return `${collapsed.slice(0, 217)}...`;
}

export async function readTranscriptionDocument(
  transcriptionFolderPath: string
): Promise<TranscriptionDocumentStored> {
  if (!isSafePath(transcriptionFolderPath)) {
    throw new Error('Invalid transcription folder path');
  }

  const jsonPath = getTranscriptionJsonPath(transcriptionFolderPath);
  const raw = await fs.readFile(jsonPath, 'utf8');
  const doc = JSON.parse(raw) as TranscriptionDocumentStored;
  doc.transcriptionFolderPath = transcriptionFolderPath;
  doc.settings = normalizeTranscriptionEngineSettings(
    doc.settings ?? buildDefaultTranscriptionSettings()
  );
  return doc;
}

export async function writeTranscriptionDocument(
  doc: TranscriptionDocumentStored
): Promise<void> {
  if (!isSafePath(doc.transcriptionFolderPath)) {
    throw new Error('Invalid transcription folder path');
  }

  doc.updatedAt = Date.now();
  doc.summary = summarizeTranscript(doc.transcriptText);

  const jsonPath = getTranscriptionJsonPath(doc.transcriptionFolderPath);
  await fs.mkdir(doc.transcriptionFolderPath, { recursive: true });
  await fs.mkdir(getTranscriptionAssetsPath(doc.transcriptionFolderPath), { recursive: true });
  await fs.writeFile(jsonPath, JSON.stringify(doc, null, 2), 'utf8');
}

export async function saveTranscriptionDocument(
  doc: TranscriptionDocumentStored
): Promise<TranscriptionDocumentStored> {
  let nextFolderPath = doc.transcriptionFolderPath;
  const nextCasePath = doc.casePath ?? null;

  if (nextCasePath) {
    if (!isSafePath(nextCasePath)) {
      throw new Error('Invalid case path');
    }
    const transcriptionsPath = getCaseTranscriptionsPath(nextCasePath);
    await fs.mkdir(transcriptionsPath, { recursive: true });
    nextFolderPath = getTranscriptionFolderPath(transcriptionsPath, doc.id);
  } else {
    const libraryPath = await getTranscriptionLibraryPath();
    nextFolderPath = getTranscriptionFolderPath(libraryPath, doc.id);
  }

  const currentPath = path.normalize(doc.transcriptionFolderPath);
  const targetPath = path.normalize(nextFolderPath);
  if (currentPath !== targetPath) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.rename(currentPath, targetPath);
  }

  const nextDoc: TranscriptionDocumentStored = {
    ...doc,
    casePath: nextCasePath,
    transcriptionFolderPath: nextFolderPath,
  };

  await writeTranscriptionDocument(nextDoc);
  return nextDoc;
}

async function scanTranscriptionFolder(
  transcriptionFolderPath: string,
  casePath: string | null,
  caseName?: string
): Promise<TranscriptionListEntryStored | null> {
  const jsonPath = getTranscriptionJsonPath(transcriptionFolderPath);
  if (!existsSync(jsonPath)) return null;

  try {
    const [raw, stats] = await Promise.all([
      fs.readFile(jsonPath, 'utf8'),
      fs.stat(jsonPath),
    ]);
    const id = extractJsonStringField(raw, 'id') ?? path.basename(transcriptionFolderPath);
    const title = extractJsonStringField(raw, 'title') ?? 'Untitled Transcript';
    const docCasePath = extractJsonNullableStringField(raw, 'casePath');
    const status = (extractJsonStringField(raw, 'status') ??
      'draft') as TranscriptionDocumentStatus;
    const summary = extractJsonStringField(raw, 'summary') ?? '';

    return {
      id,
      title,
      transcriptionFolderPath,
      casePath: docCasePath ?? casePath,
      caseName,
      modified: stats.mtimeMs,
      sourceCount: countTopLevelArrayObjects(raw, 'sources'),
      status,
      excerpt: summary,
    };
  } catch (error) {
    logger.warn(`Failed to read transcription at ${transcriptionFolderPath}:`, error);
    return null;
  }
}

export async function listTranscriptionsInDirectory(
  basePath: string,
  casePath: string | null,
  caseName?: string
): Promise<TranscriptionListEntryStored[]> {
  if (!isSafePath(basePath)) return [];

  try {
    const entries = await fs.readdir(basePath, { withFileTypes: true });
    const folders = entries.filter(
      (entry) => entry.isDirectory() && !entry.name.startsWith('.')
    );
    const results = await mapWithConcurrency(folders, LIST_SCAN_CONCURRENCY, async (entry) => {
      const transcriptionFolderPath = path.join(basePath, entry.name);
      return scanTranscriptionFolder(transcriptionFolderPath, casePath, caseName);
    });

    return results.sort((a, b) => b.modified - a.modified);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function listAllTranscriptions(): Promise<TranscriptionListEntryStored[]> {
  const libraryPath = await getTranscriptionLibraryPath();
  const archiveDrive = await getArchiveDrive();

  const [globalTranscriptions, caseTranscriptions] = await Promise.all([
    listTranscriptionsInDirectory(libraryPath, null),
    archiveDrive
      ? scanCaseTranscriptions(archiveDrive)
      : Promise.resolve([] as TranscriptionListEntryStored[]),
  ]);

  const combined = [...globalTranscriptions, ...caseTranscriptions];
  combined.sort((a, b) => b.modified - a.modified);
  return combined;
}

async function scanCaseTranscriptions(
  archiveDrive: string
): Promise<TranscriptionListEntryStored[]> {
  try {
    const entries = await fs.readdir(archiveDrive, { withFileTypes: true });
    const caseFolders = entries.filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        entry.name !== 'MapLibrary' &&
        entry.name !== 'TextLibrary' &&
        entry.name !== 'TranscriptionLibrary'
    );

    const caseResults = await mapWithConcurrency(
      caseFolders,
      LIST_SCAN_CONCURRENCY,
      async (entry) => {
        const casePath = path.join(archiveDrive, entry.name);
        const transcriptionsPath = getCaseTranscriptionsPath(casePath);
        return listTranscriptionsInDirectory(transcriptionsPath, casePath, entry.name);
      }
    );

    return caseResults.flat();
  } catch (error) {
    logger.warn('Failed to scan case transcriptions:', error);
    return [];
  }
}

export async function listCaseTranscriptions(
  casePath: string
): Promise<TranscriptionListEntryStored[]> {
  if (!isSafePath(casePath)) {
    throw new Error('Invalid case path');
  }

  const transcriptionsPath = getCaseTranscriptionsPath(casePath);
  await fs.mkdir(transcriptionsPath, { recursive: true });
  const caseName = path.basename(casePath);
  return listTranscriptionsInDirectory(transcriptionsPath, casePath, caseName);
}

export async function createTranscription(
  title: string,
  casePath?: string | null
): Promise<TranscriptionDocumentStored> {
  const transcriptionId = randomUUID();
  let transcriptionFolderPath: string;
  let resolvedCasePath: string | null = null;

  if (casePath) {
    if (!isSafePath(casePath)) {
      throw new Error('Invalid case path');
    }
    const transcriptionsPath = getCaseTranscriptionsPath(casePath);
    await fs.mkdir(transcriptionsPath, { recursive: true });
    transcriptionFolderPath = getTranscriptionFolderPath(
      transcriptionsPath,
      transcriptionId
    );
    resolvedCasePath = casePath;
  } else {
    const libraryPath = await getTranscriptionLibraryPath();
    transcriptionFolderPath = getTranscriptionFolderPath(libraryPath, transcriptionId);
  }

  await fs.mkdir(getTranscriptionAssetsPath(transcriptionFolderPath), {
    recursive: true,
  });
  const doc = createEmptyTranscriptionDocument(
    title,
    transcriptionFolderPath,
    resolvedCasePath
  );
  doc.id = transcriptionId;
  await writeTranscriptionDocument(doc);
  return doc;
}

export async function deleteTranscription(
  transcriptionFolderPath: string
): Promise<void> {
  if (!isSafePath(transcriptionFolderPath)) {
    throw new Error('Invalid transcription folder path');
  }

  await fs.rm(transcriptionFolderPath, { recursive: true, force: true });
}

export async function renameTranscription(
  transcriptionFolderPath: string,
  newTitle: string
): Promise<TranscriptionDocumentStored> {
  const doc = await readTranscriptionDocument(transcriptionFolderPath);
  doc.title = newTitle;
  await writeTranscriptionDocument(doc);
  return doc;
}

export async function copySourceToTranscriptionAssets(
  transcriptionFolderPath: string,
  sourcePath: string,
  sourceId: string
): Promise<{
  relativePath: string;
  storedPath: string;
  fileName: string;
  mediaType: TranscriptionMediaType;
}> {
  if (!isSafePath(transcriptionFolderPath) || !isSafePath(sourcePath)) {
    throw new Error('Invalid path');
  }

  const fileName = path.basename(sourcePath);
  const ext = path.extname(fileName);
  const destFileName = `${sourceId}${ext}`;
  const assetsPath = getTranscriptionAssetsPath(transcriptionFolderPath);
  await fs.mkdir(assetsPath, { recursive: true });
  const storedPath = path.join(assetsPath, destFileName);
  await fs.copyFile(sourcePath, storedPath);

  return {
    relativePath: path.join(TRANSCRIPTION_ASSETS_DIR, destFileName),
    storedPath,
    fileName,
    mediaType: detectTranscriptionMediaType(sourcePath),
  };
}

export async function writeTranscriptOutputs(
  transcriptionFolderPath: string,
  transcriptText: string,
  segments: TranscriptionSegmentStored[]
): Promise<SavedTranscriptionOutputs> {
  if (!isSafePath(transcriptionFolderPath)) {
    throw new Error('Invalid transcription folder path');
  }

  await fs.mkdir(transcriptionFolderPath, { recursive: true });
  const transcriptFilePath = path.join(
    transcriptionFolderPath,
    TRANSCRIPTION_TEXT_FILENAME
  );
  const segmentsFilePath = path.join(
    transcriptionFolderPath,
    TRANSCRIPTION_SEGMENTS_FILENAME
  );

  await fs.writeFile(transcriptFilePath, transcriptText, 'utf8');
  await fs.writeFile(segmentsFilePath, JSON.stringify(segments, null, 2), 'utf8');

  return {
    transcriptFilePath,
    segmentsFilePath,
  };
}
