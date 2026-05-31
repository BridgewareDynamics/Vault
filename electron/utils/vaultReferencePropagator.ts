import * as fs from 'fs/promises';
import * as path from 'path';
import type { LocalDatabase } from '../database/localDatabase';
import { isSafePath } from './pathValidator';
import * as mapStorage from './mapStorage';
import * as transcriptionStorage from './transcriptionStorage';

interface MapAttachmentLike {
  id: string;
  fileName: string;
  relativePath: string;
  vaultPath: string;
  type: string;
  thumbnailPath?: string;
}

interface MapBlockLike {
  id: string;
  attachments?: MapAttachmentLike[];
  [key: string]: unknown;
}

interface MapDocumentLike {
  id: string;
  blocks: MapBlockLike[];
  [key: string]: unknown;
}

interface TranscriptionSourceLike {
  id: string;
  fileName: string;
  originalPath: string;
  storedPath?: string;
  relativePath?: string;
  [key: string]: unknown;
}

interface TranscriptionDocumentLike {
  id: string;
  sources: TranscriptionSourceLike[];
  [key: string]: unknown;
}

export interface VaultReferencePropagationResult {
  updatedMaps: string[];
  updatedTranscriptions: string[];
}

function normalizeForCompare(filePath: string): string {
  return path.normalize(filePath).toLowerCase();
}

function updateAttachmentPaths(
  attachment: MapAttachmentLike,
  oldPath: string,
  newPath: string,
  newFileName: string
): boolean {
  const normalizedOld = normalizeForCompare(oldPath);
  const vaultMatch = normalizeForCompare(attachment.vaultPath) === normalizedOld;
  const relativeMatch = normalizeForCompare(attachment.relativePath) === normalizedOld;

  if (!vaultMatch && !relativeMatch) {
    return false;
  }

  attachment.vaultPath = newPath;
  attachment.relativePath = newPath;
  attachment.fileName = newFileName;
  return true;
}

async function propagateMapReferences(
  casePath: string,
  oldPath: string,
  newPath: string,
  newFileName: string
): Promise<string[]> {
  const updatedMaps: string[] = [];
  const mapsPath = path.join(casePath, '.maps');

  let mapFolders: string[] = [];
  try {
    const entries = await fs.readdir(mapsPath, { withFileTypes: true });
    mapFolders = entries.filter((e) => e.isDirectory()).map((e) => path.join(mapsPath, e.name));
  } catch {
    return updatedMaps;
  }

  for (const mapFolder of mapFolders) {
    if (!isSafePath(mapFolder)) {
      continue;
    }

    try {
      const doc = (await mapStorage.readMapDocument(mapFolder)) as unknown as MapDocumentLike;
      let changed = false;

      for (const block of doc.blocks ?? []) {
        for (const attachment of block.attachments ?? []) {
          if (updateAttachmentPaths(attachment, oldPath, newPath, newFileName)) {
            changed = true;
          }
        }
      }

      if (changed) {
        await mapStorage.writeMapDocument(doc as never);
        updatedMaps.push(mapFolder);
      }
    } catch {
      // skip unreadable maps
    }
  }

  return updatedMaps;
}

async function propagateTranscriptionReferencesInFolder(
  folderPath: string,
  oldPath: string,
  newPath: string,
  newFileName: string
): Promise<string[]> {
  const updated: string[] = [];

  let entries: string[] = [];
  try {
    const dirEntries = await fs.readdir(folderPath, { withFileTypes: true });
    entries = dirEntries.filter((e) => e.isDirectory()).map((e) => path.join(folderPath, e.name));
  } catch {
    return updated;
  }

  for (const transcriptionFolder of entries) {
    try {
      const doc = (await transcriptionStorage.readTranscriptionDocument(
        transcriptionFolder
      )) as unknown as TranscriptionDocumentLike;
      let changed = false;
      const normalizedOld = normalizeForCompare(oldPath);

      for (const source of doc.sources ?? []) {
        const originalMatch = normalizeForCompare(source.originalPath) === normalizedOld;
        const storedMatch = source.storedPath
          ? normalizeForCompare(source.storedPath) === normalizedOld
          : false;

        if (originalMatch || storedMatch) {
          if (originalMatch) {
            source.originalPath = newPath;
          }
          if (storedMatch && source.storedPath) {
            source.storedPath = newPath;
          }
          source.fileName = newFileName;
          changed = true;
        }
      }

      if (changed) {
        await transcriptionStorage.writeTranscriptionDocument(doc as never);
        updated.push(transcriptionFolder);
      }
    } catch {
      // skip
    }
  }

  return updated;
}

export async function propagateVaultFileReferenceUpdate(
  casePath: string | null,
  oldPath: string,
  newPath: string,
  newFileName: string,
  db: LocalDatabase | null
): Promise<VaultReferencePropagationResult> {
  if (!isSafePath(oldPath) || !isSafePath(newPath)) {
    throw new Error('Invalid path for reference propagation');
  }

  const updatedMaps: string[] = [];
  const updatedTranscriptions: string[] = [];

  if (casePath && isSafePath(casePath)) {
    updatedMaps.push(...(await propagateMapReferences(casePath, oldPath, newPath, newFileName)));
    updatedTranscriptions.push(
      ...(await propagateTranscriptionReferencesInFolder(
        path.join(casePath, '.transcriptions'),
        oldPath,
        newPath,
        newFileName
      ))
    );
  }

  if (db) {
    try {
      const libraryMaps = await mapStorage.listAllMaps();
      for (const entry of libraryMaps) {
        try {
          const doc = (await mapStorage.readMapDocument(entry.mapFolderPath)) as unknown as MapDocumentLike;
          let changed = false;
          for (const block of doc.blocks ?? []) {
            for (const attachment of block.attachments ?? []) {
              if (updateAttachmentPaths(attachment, oldPath, newPath, newFileName)) {
                changed = true;
              }
            }
          }
          if (changed) {
            await mapStorage.writeMapDocument(doc as never);
            updatedMaps.push(entry.mapFolderPath);
          }
        } catch {
          // skip
        }
      }
    } catch {
      // library scan optional
    }

    try {
      const libraryTranscriptions = await transcriptionStorage.listAllTranscriptions();
      for (const entry of libraryTranscriptions) {
        try {
          const doc = (await transcriptionStorage.readTranscriptionDocument(
            entry.transcriptionFolderPath
          )) as unknown as TranscriptionDocumentLike;
          let changed = false;
          const normalizedOld = normalizeForCompare(oldPath);

          for (const source of doc.sources ?? []) {
            const originalMatch = normalizeForCompare(source.originalPath) === normalizedOld;
            const storedMatch = source.storedPath
              ? normalizeForCompare(source.storedPath) === normalizedOld
              : false;
            if (originalMatch || storedMatch) {
              if (originalMatch) {
                source.originalPath = newPath;
              }
              if (storedMatch && source.storedPath) {
                source.storedPath = newPath;
              }
              source.fileName = newFileName;
              changed = true;
            }
          }

          if (changed) {
            await transcriptionStorage.writeTranscriptionDocument(doc as never);
            updatedTranscriptions.push(entry.transcriptionFolderPath);
          }
        } catch {
          // skip
        }
      }
    } catch {
      // optional
    }
  }

  return { updatedMaps, updatedTranscriptions };
}
