import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { app } from 'electron';

const MARKER_FILE_NAME = '.vault-archive.json';

export interface ArchiveMarker {
  version: string;
  createdAt: number;
  lastModified: number;
  caseCount?: number;
  archiveId: string;
}

/**
 * Get the path to the marker file in an archive directory
 */
function getMarkerPath(archivePath: string): string {
  return path.join(archivePath, MARKER_FILE_NAME);
}

/**
 * Create a new archive marker file
 */
export async function createArchiveMarker(archivePath: string): Promise<ArchiveMarker> {
  const markerPath = getMarkerPath(archivePath);
  const now = Date.now();
  const appVersion = app.getVersion();
  
  const marker: ArchiveMarker = {
    version: appVersion,
    createdAt: now,
    lastModified: now,
    caseCount: 0,
    archiveId: randomUUID(),
  };

  await fs.writeFile(markerPath, JSON.stringify(marker, null, 2), 'utf-8');
  return marker;
}

/**
 * Read and validate the archive marker file
 */
export async function readArchiveMarker(archivePath: string): Promise<ArchiveMarker | null> {
  try {
    const markerPath = getMarkerPath(archivePath);
    const data = await fs.readFile(markerPath, 'utf-8');
    const marker = JSON.parse(data) as ArchiveMarker;
    
    // Validate required fields
    if (!marker.version || !marker.createdAt || !marker.lastModified || !marker.archiveId) {
      return null;
    }
    
    return marker;
  } catch (error) {
    // Marker file doesn't exist or is invalid
    return null;
  }
}

/**
 * Update the archive marker file with new metadata
 */
export async function updateArchiveMarker(
  archivePath: string,
  updates: Partial<Omit<ArchiveMarker, 'version' | 'createdAt' | 'archiveId'>>
): Promise<ArchiveMarker> {
  const existingMarker = await readArchiveMarker(archivePath);
  
  if (!existingMarker) {
    // If marker doesn't exist, create a new one
    return await createArchiveMarker(archivePath);
  }

  const updatedMarker: ArchiveMarker = {
    ...existingMarker,
    ...updates,
    lastModified: Date.now(),
  };

  const markerPath = getMarkerPath(archivePath);
  await fs.writeFile(markerPath, JSON.stringify(updatedMarker, null, 2), 'utf-8');
  return updatedMarker;
}

/**
 * Check if a directory contains a valid archive marker file
 */
export async function isValidArchive(archivePath: string): Promise<boolean> {
  try {
    const marker = await readArchiveMarker(archivePath);
    return marker !== null;
  } catch (error) {
    return false;
  }
}

