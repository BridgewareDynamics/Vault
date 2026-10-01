import { useCallback, useEffect, useRef, useState } from 'react';

export interface AudioInputDevice {
  deviceId: string;
  label: string;
}

export function useAudioInputDevices(enabled: boolean) {
  const [devices, setDevices] = useState<AudioInputDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labelsUnlockedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setError('Audio devices are not available in this environment.');
      setDevices([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (enabled && !labelsUnlockedRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          labelsUnlockedRef.current = true;
        } catch {
          // enumerate may still return devices without stable ids
        }
      }

      const list = await navigator.mediaDevices.enumerateDevices();
      const inputs = list
        .filter((device) => device.kind === 'audioinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
        }));
      setDevices(inputs);
      if (inputs.length === 0) {
        setError('No microphones were detected.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not list audio devices.');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void refresh();

    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.addEventListener) {
      return;
    }

    const handleChange = () => {
      void refresh();
    };
    mediaDevices.addEventListener('devicechange', handleChange);
    return () => mediaDevices.removeEventListener('devicechange', handleChange);
  }, [enabled, refresh]);

  return { devices, loading, error, refresh };
}
