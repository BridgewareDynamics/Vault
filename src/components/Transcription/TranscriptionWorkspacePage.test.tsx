import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../Toast/ToastContext';
import { TranscriptionWorkspacePage } from './TranscriptionWorkspacePage';
import { mockElectronAPI } from '../../test-utils/mocks';
import { TranscriptionDocument } from '../../types';
import { SettingsProvider } from '../../utils/settingsContext';

function makeDocument(overrides: Partial<TranscriptionDocument> = {}): TranscriptionDocument {
  return {
    id: 'transcription-1',
    title: 'Interview Transcript',
    version: 1,
    createdAt: 1,
    updatedAt: 1,
    casePath: '/vault/Case Alpha',
    transcriptionFolderPath: '/vault/transcriptions/transcription-1',
    status: 'draft',
    progress: {
      stage: 'idle',
      current: 0,
      total: 0,
      percentage: 0,
      statusMessage: 'Ready to transcribe',
    },
    settings: {
      model: 'Parakeet TDT 0.6B v2 - bfloat16',
      precision: 'bfloat16',
      device: 'cuda',
      outputFormat: 'txt',
      includeTimestamps: true,
      segmentLength: 90,
      segmentDuration: 10,
      curateText: true,
      batchRecursive: false,
    },
    sources: [
      {
        id: 'source-1',
        fileName: 'interview.mp4',
        originalPath: '/vault/Case Alpha/interview.mp4',
        mediaType: 'video',
        origin: 'vault',
        casePath: '/vault/Case Alpha',
      },
    ],
    transcriptText: 'Transcript body',
    segments: [
      {
        start: 0,
        end: 5,
        text: 'Transcript body',
      },
    ],
    summary: 'Transcript body',
    ...overrides,
  };
}

describe('TranscriptionWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = mockElectronAPI;
    mockElectronAPI.readTranscription.mockResolvedValue(makeDocument());
    mockElectronAPI.saveTranscription.mockImplementation(async (doc) => doc);
    mockElectronAPI.getTranscriptionEngineStatus.mockResolvedValue({
      available: true,
      running: true,
      pythonCommand: 'python',
    });
    mockElectronAPI.listTranscriptionModels.mockResolvedValue([
      {
        key: 'Parakeet TDT 0.6B v2 - bfloat16',
        name: 'Parakeet TDT 0.6B v2',
        modelId: 'nvidia/parakeet-tdt-0.6b-v2',
        precision: 'bfloat16',
        modelType: 'parakeet',
        defaultSegmentLength: 90,
        supportsTimestamps: true,
      },
    ]);
    mockElectronAPI.runTranscription.mockResolvedValue(
      makeDocument({
        status: 'completed',
        progress: {
          stage: 'completed',
          current: 1,
          total: 1,
          percentage: 100,
          statusMessage: 'Completed',
        },
        transcriptText: 'Completed transcript',
        segments: [{ start: 0, end: 4, text: 'Completed transcript' }],
        summary: 'Completed transcript',
      })
    );
    mockElectronAPI.getSettings.mockResolvedValue({
      hardwareAcceleration: true,
      ramLimitMB: 2048,
      fullscreen: false,
      extractionQuality: 'high',
      thumbnailSize: 200,
      performanceMode: 'auto',
      showOnboarding: true,
      theme: 'brideware-purple',
    });
  });

  const renderWorkspace = () =>
    render(
      <SettingsProvider>
        <ToastProvider>
          <TranscriptionWorkspacePage
            theme="brideware-purple"
            transcriptionFolderPath="/vault/transcriptions/transcription-1"
            onBack={vi.fn()}
            onHome={vi.fn()}
          />
        </ToastProvider>
      </SettingsProvider>
    );

  it('renders transcript text and segments from the loaded document', async () => {
    renderWorkspace();

    await waitFor(() => {
      expect(mockElectronAPI.readTranscription).toHaveBeenCalledWith(
        '/vault/transcriptions/transcription-1'
      );
    });

    expect(await screen.findByDisplayValue('Transcript body')).toBeInTheDocument();
    expect(screen.getByText(/0\.00s\s*[–-]\s*5\.00s/)).toBeInTheDocument();
    expect(screen.getAllByText('Transcript body').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Transcript text')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /engine/i })).toBeInTheDocument();
  });

  it('runs transcription for the selected source', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const runButton = await screen.findByRole('button', {
      name: /transcribe/i,
    });
    await user.click(runButton);

    await waitFor(() => {
      expect(mockElectronAPI.runTranscription).toHaveBeenCalledWith(
        expect.objectContaining({
          transcriptionFolderPath: '/vault/transcriptions/transcription-1',
          sourcePath: '/vault/Case Alpha/interview.mp4',
        })
      );
    });

    expect(await screen.findByDisplayValue('Completed transcript')).toBeInTheDocument();
  });
});
