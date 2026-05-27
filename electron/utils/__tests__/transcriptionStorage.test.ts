import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  saveTranscriptionDocument,
  type TranscriptionDocumentStored,
} from '../transcriptionStorage';

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
}));

function makeDocument(
  overrides: Partial<TranscriptionDocumentStored> = {}
): TranscriptionDocumentStored {
  return {
    id: 'transcription-123',
    title: 'Interview Transcript',
    version: 1,
    createdAt: 1,
    updatedAt: 1,
    casePath: null,
    transcriptionFolderPath: path.join(
      'D:/The Vault App',
      'TranscriptionLibrary',
      'transcription-123'
    ),
    status: 'draft',
    progress: {
      stage: 'idle',
      current: 0,
      total: 0,
      percentage: 0,
      statusMessage: 'Ready to transcribe',
    },
    settings: {
      model: 'Parakeet TDT 0.6B v3 - float32',
      precision: 'float32',
      device: 'cuda',
      outputFormat: 'txt',
      includeTimestamps: true,
      segmentLength: 90,
      segmentDuration: 10,
      curateText: true,
      batchRecursive: false,
    },
    sources: [],
    transcriptText: '',
    segments: [],
    summary: '',
    ...overrides,
  };
}

describe('transcriptionStorage.saveTranscriptionDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves a global transcription into a case transcriptions folder when casePath is set', async () => {
    const casePath = path.join('D:/The Vault App', 'Case Alpha');
    const currentPath = path.join(
      'D:/The Vault App',
      'TranscriptionLibrary',
      'transcription-123'
    );
    const expectedPath = path.join(casePath, '.transcriptions', 'transcription-123');
    const doc = makeDocument({
      casePath,
      transcriptionFolderPath: currentPath,
    });

    const savedDoc = await saveTranscriptionDocument(doc);

    expect(fs.mkdir).toHaveBeenCalledWith(
      path.join(casePath, '.transcriptions'),
      { recursive: true }
    );
    expect(fs.rename).toHaveBeenCalledWith(currentPath, expectedPath);
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(expectedPath, 'transcription.vault-transcription.json'),
      expect.stringContaining(`"casePath": ${JSON.stringify(casePath)}`),
      'utf8'
    );
    expect(savedDoc.transcriptionFolderPath).toBe(expectedPath);
    expect(savedDoc.casePath).toBe(casePath);
  });

  it('moves a case-linked transcription back to the global library when casePath is cleared', async () => {
    const currentCasePath = path.join('D:/The Vault App', 'Case Alpha');
    const currentPath = path.join(
      currentCasePath,
      '.transcriptions',
      'transcription-123'
    );
    const expectedPath = path.join(
      'D:/The Vault App',
      'TranscriptionLibrary',
      'transcription-123'
    );
    const doc = makeDocument({
      casePath: null,
      transcriptionFolderPath: currentPath,
    });

    const savedDoc = await saveTranscriptionDocument(doc);

    expect(fs.mkdir).toHaveBeenCalledWith(
      path.join('D:/The Vault App', 'TranscriptionLibrary'),
      { recursive: true }
    );
    expect(fs.rename).toHaveBeenCalledWith(currentPath, expectedPath);
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(expectedPath, 'transcription.vault-transcription.json'),
      expect.stringContaining('"casePath": null'),
      'utf8'
    );
    expect(savedDoc.transcriptionFolderPath).toBe(expectedPath);
    expect(savedDoc.casePath).toBeNull();
  });
});
