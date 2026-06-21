import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranscriptionDocument } from './useTranscriptionDocument';
import { mockElectronAPI } from '../test-utils/mocks';
import type { TranscriptionDocument } from '../types';

function makeDocument(): TranscriptionDocument {
  return {
    id: 'transcription-1',
    title: 'Test',
    version: 1,
    createdAt: 1,
    updatedAt: 1,
    casePath: null,
    transcriptionFolderPath: '/vault/transcriptions/transcription-1',
    status: 'draft',
    progress: {
      stage: 'idle',
      current: 0,
      total: 0,
      percentage: 0,
      statusMessage: 'Ready',
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
  };
}

describe('useTranscriptionDocument', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.electronAPI = mockElectronAPI;
    mockElectronAPI.readTranscription.mockResolvedValue(makeDocument());
    mockElectronAPI.saveTranscription.mockImplementation(async (doc) => doc);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not autosave when updateDocument returns the same reference', async () => {
    const { result } = renderHook(() =>
      useTranscriptionDocument('/vault/transcriptions/transcription-1')
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateDocument((previous) => previous);
    });

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(mockElectronAPI.saveTranscription).not.toHaveBeenCalled();
  });
});
