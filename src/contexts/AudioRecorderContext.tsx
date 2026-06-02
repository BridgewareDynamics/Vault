import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AudioRecorderModal } from '../components/AudioRecorder/AudioRecorderModal';

interface AudioRecorderContextValue {
  isOpen: boolean;
  openRecorder: () => void;
  closeRecorder: () => void;
}

const AudioRecorderContext = createContext<AudioRecorderContextValue | undefined>(undefined);

export function AudioRecorderProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openRecorder = useCallback(() => setIsOpen(true), []);
  const closeRecorder = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleOpen = () => openRecorder();
    window.addEventListener('open-audio-recorder', handleOpen);
    return () => window.removeEventListener('open-audio-recorder', handleOpen);
  }, [openRecorder]);

  const value = useMemo(
    () => ({ isOpen, openRecorder, closeRecorder }),
    [isOpen, openRecorder, closeRecorder]
  );

  return (
    <AudioRecorderContext.Provider value={value}>
      {children}
      <AudioRecorderModal isOpen={isOpen} onClose={closeRecorder} />
    </AudioRecorderContext.Provider>
  );
}

export function useAudioRecorderPortal(): AudioRecorderContextValue {
  const ctx = useContext(AudioRecorderContext);
  if (!ctx) {
    return {
      isOpen: false,
      openRecorder: () => {
        window.dispatchEvent(new CustomEvent('open-audio-recorder'));
      },
      closeRecorder: () => {},
    };
  }
  return ctx;
}
