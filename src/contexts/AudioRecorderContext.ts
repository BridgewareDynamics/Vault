import { createContext, useContext } from 'react';
import { useAudioInputDevices } from '../hooks/useAudioInputDevices';
import { useMediaAudioRecorder } from '../hooks/useMediaAudioRecorder';
import { AudioRecorderQuality, AudioStudioInputOptions } from '../utils/audioRecorder';

export type StudioPanelMode = 'closed' | 'open' | 'minimized';

export interface AudioRecorderContextValue {
  panelMode: StudioPanelMode;
  isPanelOpen: boolean;
  isMinimized: boolean;
  isSessionActive: boolean;
  openStudio: () => void;
  minimizeStudio: () => void;
  expandStudio: () => void;
  closeStudio: () => void;
  inputOptions: AudioStudioInputOptions;
  setInputOptions: (updater: (prev: AudioStudioInputOptions) => AudioStudioInputOptions) => void;
  quality: AudioRecorderQuality;
  setQuality: (quality: AudioRecorderQuality) => void;
  selectedCasePath: string | null;
  selectedCaseName: string | null;
  setSelectedCase: (path: string | null, name: string | null) => void;
  fileName: string;
  setFileName: (name: string) => void;
  showCaseDialog: boolean;
  setShowCaseDialog: (open: boolean) => void;
  devices: ReturnType<typeof useAudioInputDevices>['devices'];
  devicesLoading: boolean;
  devicesError: string | null;
  refreshDevices: () => Promise<void>;
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  recorder: ReturnType<typeof useMediaAudioRecorder>;
  saving: boolean;
  handleSave: () => Promise<void>;
  handleStopFromDock: () => void;
  effectiveFileName: string;
  canSave: boolean;
}

export const AudioRecorderContext = createContext<AudioRecorderContextValue | undefined>(undefined);

export function useAudioRecorderStudio(): AudioRecorderContextValue {
  const ctx = useContext(AudioRecorderContext);
  if (!ctx) {
    throw new Error('useAudioRecorderStudio must be used within AudioRecorderProvider');
  }
  return ctx;
}

export function useAudioRecorderPortal(): Pick<
  AudioRecorderContextValue,
  | 'openStudio'
  | 'minimizeStudio'
  | 'expandStudio'
  | 'closeStudio'
  | 'panelMode'
  | 'isSessionActive'
  | 'isMinimized'
  | 'recorder'
  | 'handleStopFromDock'
> {
  const ctx = useContext(AudioRecorderContext);
  if (!ctx) {
    return {
      panelMode: 'closed',
      isSessionActive: false,
      isMinimized: false,
      openStudio: () => window.dispatchEvent(new CustomEvent('open-audio-recorder')),
      minimizeStudio: () => {},
      expandStudio: () => {},
      closeStudio: () => {},
      recorder: {
        status: 'idle',
        durationLabel: '00:00',
        durationSec: 0,
        level: 0,
        recordedBlob: null,
        mimeType: '',
        error: null,
        isLive: false,
        supportsPause: false,
        startRecording: async () => {},
        pauseRecording: () => {},
        resumeRecording: () => {},
        stopRecording: () => {},
        resetRecording: () => {},
        refreshStream: async () => null,
      } as AudioRecorderContextValue['recorder'],
      handleStopFromDock: () => {},
    };
  }
  return ctx;
}
