import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioRecorderQuality,
  bitrateForQuality,
  formatRecorderDuration,
  resolveRecordingMimeType,
} from '../utils/audioRecorder';

export type RecorderStatus = 'idle' | 'arming' | 'recording' | 'paused' | 'stopped' | 'error';

interface UseMediaAudioRecorderOptions {
  deviceId: string | null;
  quality: AudioRecorderQuality;
  enabled: boolean;
}

export function useMediaAudioRecorder({
  deviceId,
  quality,
  enabled,
}: UseMediaAudioRecorderOptions) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [level, setLevel] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pausedAccumRef = useRef(0);
  const pauseStartedRef = useRef<number | null>(null);

  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    stopMeter();
    stopTimer();
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
  }, [stopMeter, stopTimer]);

  const setupMeter = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    let lastUiUpdate = 0;

    const tick = (now: number) => {
      if (!analyserRef.current) {
        return;
      }
      analyserRef.current.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        sum += data[i];
      }
      const avg = sum / data.length / 255;
      if (now - lastUiUpdate > 80) {
        setLevel(avg);
        lastUiUpdate = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      if (!startedAtRef.current) {
        return;
      }
      const pausedExtra = pauseStartedRef.current
        ? performance.now() - pauseStartedRef.current
        : 0;
      const elapsedMs =
        performance.now() - startedAtRef.current - pausedAccumRef.current - pausedExtra;
      setDurationSec(Math.max(0, elapsedMs / 1000));
    }, 200);
  }, [stopTimer]);

  const armStream = useCallback(async () => {
    setError(null);
    setStatus('arming');
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      releaseStream();
      streamRef.current = stream;
      setupMeter(stream);
      setStatus('idle');
      return stream;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Microphone permission was denied or unavailable.';
      setError(message);
      setStatus('error');
      releaseStream();
      return null;
    }
  }, [deviceId, releaseStream, setupMeter]);

  useEffect(() => {
    if (!enabled) {
      releaseStream();
      setStatus('idle');
      setRecordedBlob(null);
      setDurationSec(0);
      setLevel(0);
      return;
    }
    void armStream();
    return () => {
      releaseStream();
    };
  }, [enabled, deviceId, armStream, releaseStream]);

  const startRecording = useCallback(async () => {
    setRecordedBlob(null);
    chunksRef.current = [];
    pausedAccumRef.current = 0;
    pauseStartedRef.current = null;

    let stream = streamRef.current;
    if (!stream || stream.getAudioTracks().every((track) => track.readyState === 'ended')) {
      stream = await armStream();
    }
    if (!stream) {
      return;
    }

    const selectedMime = resolveRecordingMimeType();
    if (!selectedMime) {
      setError('This environment does not support audio recording.');
      setStatus('error');
      return;
    }

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        audioBitsPerSecond: bitrateForQuality(quality),
      });
      recorderRef.current = recorder;
      setMimeType(selectedMime);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMime });
        setRecordedBlob(blob);
        setStatus('stopped');
        stopTimer();
      };

      recorder.onerror = () => {
        setError('Recording failed unexpectedly.');
        setStatus('error');
        stopTimer();
      };

      recorder.start(250);
      startedAtRef.current = performance.now();
      setDurationSec(0);
      startTimer();
      setStatus('recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start recording.');
      setStatus('error');
    }
  }, [armStream, quality, startTimer, stopTimer]);

  const pauseRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      return;
    }
    if (typeof recorder.pause === 'function') {
      recorder.pause();
      pauseStartedRef.current = performance.now();
      setStatus('paused');
    }
  }, []);

  const resumeRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'paused') {
      return;
    }
    if (typeof recorder.resume === 'function') {
      recorder.resume();
      if (pauseStartedRef.current) {
        pausedAccumRef.current += performance.now() - pauseStartedRef.current;
        pauseStartedRef.current = null;
      }
      setStatus('recording');
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) {
      return;
    }
    if (recorder.state === 'recording' || recorder.state === 'paused') {
      recorder.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    stopRecording();
    chunksRef.current = [];
    setRecordedBlob(null);
    setDurationSec(0);
    startedAtRef.current = null;
    pausedAccumRef.current = 0;
    pauseStartedRef.current = null;
    setStatus(streamRef.current ? 'idle' : 'idle');
  }, [stopRecording]);

  const supportsPause =
    typeof MediaRecorder !== 'undefined' &&
    typeof MediaRecorder.prototype.pause === 'function';

  return {
    status,
    error,
    durationLabel: formatRecorderDuration(durationSec),
    durationSec,
    level,
    recordedBlob,
    mimeType,
    supportsPause,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    refreshStream: armStream,
  };
}
