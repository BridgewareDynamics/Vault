import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCachedTranscriptionEngineStatus,
  prefetchTranscriptionEngineStatus,
  setCachedTranscriptionEngineStatus,
} from './transcriptionPrefetch';

describe('transcriptionPrefetch', () => {
  beforeEach(() => {
    setCachedTranscriptionEngineStatus(null);
    window.electronAPI = {
      getTranscriptionEngineStatus: vi.fn().mockResolvedValue({
        available: true,
        running: false,
      }),
    } as unknown as Window['electronAPI'];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns cached engine status without calling IPC again', async () => {
    setCachedTranscriptionEngineStatus({
      available: true,
      running: true,
      port: 8765,
    });

    const status = await prefetchTranscriptionEngineStatus();

    expect(status?.running).toBe(true);
    expect(window.electronAPI?.getTranscriptionEngineStatus).not.toHaveBeenCalled();
    expect(getCachedTranscriptionEngineStatus()?.port).toBe(8765);
  });
});
