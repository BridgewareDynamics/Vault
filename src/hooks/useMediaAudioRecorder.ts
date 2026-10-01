import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioRecorderQuality,
  AudioStudioInputOptions,
  bitrateForQuality,
  formatRecorderDuration,
  gainPercentToValue,
  resolveRecordingMimeType,
  volumePercentToValue,
  isMediaDeviceNotFoundError,
  normalizeMediaDeviceError,
} from '../utils/audioRecorder';

export type RecorderStatus = 'idle' | 'arming' | 'recording' | 'paused' | 'stopped' | 'error';

interface UseMediaAudioRecorderOptions {
  deviceId: string | null;
  quality: AudioRecorderQuality;
  inputOptions: AudioStudioInputOptions;
  sessionActive: boolean;
  onResolvedDeviceId?: (deviceId: string) => void;
}

interface AudioGraphNodes {
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  inputGain: GainNode;
  monitorGain: GainNode;
  analyser: AnalyserNode;
  destination: MediaStreamAudioDestinationNode;
  rawStream: MediaStream;
}

export function useMediaAudioRecorder({
  deviceId,
  quality,
  inputOptions,
  sessionActive,
  onResolvedDeviceId,
}: UseMediaAudioRecorderOptions) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [level, setLevel] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState('');

  const graphRef = useRef<AudioGraphNodes | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pausedAccumRef = useRef(0);
  const pauseStartedRef = useRef<number | null>(null);
  const inputOptionsRef = useRef(inputOptions);
  inputOptionsRef.current = inputOptions;
  const statusRef = useRef(status);
  statusRef.current = status;

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

  const teardownGraph = useCallback(() => {
    stopMeter();
    stopTimer();
    const graph = graphRef.current;
    if (graph) {
      graph.rawStream.getTracks().forEach((track) => track.stop());
      void graph.context.close().catch(() => {});
      graphRef.current = null;
    }
    recorderRef.current = null;
  }, [stopMeter, stopTimer]);

  const applyGainValues = useCallback((graph: AudioGraphNodes, options: AudioStudioInputOptions) => {
    graph.inputGain.gain.value = gainPercentToValue(options.inputGainPercent);
    graph.monitorGain.gain.value = volumePercentToValue(options.monitorVolumePercent);
    try {
      graph.inputGain.disconnect(graph.monitorGain);
    } catch {
      // monitor path not wired yet
    }
    try {
      graph.monitorGain.disconnect();
    } catch {
      // destination not wired yet
    }
    if (options.monitorEnabled && options.monitorVolumePercent > 0) {
      graph.inputGain.connect(graph.monitorGain);
      graph.monitorGain.connect(graph.context.destination);
    }
  }, []);

  const startMeter = useCallback((analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    let lastUiUpdate = 0;

    const tick = (now: number) => {
      if (!graphRef.current) {
        return;
      }
      analyser.getByteFrequencyData(data);
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

  const acquireMicStream = useCallback(
    async (options: AudioStudioInputOptions, preferredDeviceId: string | null) => {
      const base: MediaTrackConstraints = {
        echoCancellation: options.echoCancellation,
        noiseSuppression: options.noiseSuppression,
        autoGainControl: options.autoGainControl,
      };

      const withDevice = preferredDeviceId
        ? { ...base, deviceId: { ideal: preferredDeviceId } }
        : base;

      try {
        return await navigator.mediaDevices.getUserMedia({ audio: withDevice });
      } catch (err) {
        if (!preferredDeviceId || !isMediaDeviceNotFoundError(err)) {
          throw err;
        }
        return navigator.mediaDevices.getUserMedia({ audio: base });
      }
    },
    []
  );

  const buildGraph = useCallback(
    async (options: AudioStudioInputOptions) => {
      const rawStream = await acquireMicStream(options, deviceId);
      const resolvedId = rawStream.getAudioTracks()[0]?.getSettings().deviceId;
      if (resolvedId && resolvedId !== deviceId) {
        onResolvedDeviceId?.(resolvedId);
      }
      const context = new AudioContext();
      const source = context.createMediaStreamSource(rawStream);
      const inputGain = context.createGain();
      const monitorGain = context.createGain();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      const destination = context.createMediaStreamDestination();

      source.connect(inputGain);
      inputGain.connect(analyser);
      inputGain.connect(destination);

      const graph: AudioGraphNodes = {
        context,
        source,
        inputGain,
        monitorGain,
        analyser,
        destination,
        rawStream,
      };

      applyGainValues(graph, options);
      return graph;
    },
    [acquireMicStream, applyGainValues, deviceId, onResolvedDeviceId]
  );

  const armStream = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setError(null);
        setStatus('arming');
      }
      try {
        teardownGraph();
        const graph = await buildGraph(inputOptionsRef.current);
        graphRef.current = graph;
        startMeter(graph.analyser);
        if (!options?.silent) {
          setStatus('idle');
        }
        return graph;
      } catch (err) {
        setError(normalizeMediaDeviceError(err));
        setStatus('error');
        teardownGraph();
        return null;
      }
    },
    [buildGraph, startMeter, teardownGraph]
  );

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    applyGainValues(graph, inputOptions);
  }, [
    inputOptions.inputGainPercent,
    inputOptions.monitorVolumePercent,
    inputOptions.monitorEnabled,
    applyGainValues,
    inputOptions,
  ]);

  useEffect(() => {
    if (!sessionActive) {
      teardownGraph();
      setStatus('idle');
      setRecordedBlob(null);
      setDurationSec(0);
      setLevel(0);
      setError(null);
      return;
    }

    const isLive =
      statusRef.current === 'recording' || statusRef.current === 'paused';
    if (isLive) {
      return;
    }

    void armStream();
    return () => {
      teardownGraph();
    };
  }, [
    sessionActive,
    deviceId,
    inputOptions.echoCancellation,
    inputOptions.noiseSuppression,
    inputOptions.autoGainControl,
    armStream,
    teardownGraph,
  ]);

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

  const startRecording = useCallback(async () => {
    setRecordedBlob(null);
    chunksRef.current = [];
    pausedAccumRef.current = 0;
    pauseStartedRef.current = null;

    let graph = graphRef.current;
    if (!graph || graph.rawStream.getAudioTracks().every((track) => track.readyState === 'ended')) {
      graph = await armStream();
    }
    if (!graph) {
      return;
    }

    const selectedMime = resolveRecordingMimeType();
    if (!selectedMime) {
      setError('This environment does not support audio recording.');
      setStatus('error');
      return;
    }

    try {
      const recorder = new MediaRecorder(graph.destination.stream, {
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
    const recorder = recorderRef.current;
    if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
      recorder.stop();
    }
    chunksRef.current = [];
    setRecordedBlob(null);
    setDurationSec(0);
    startedAtRef.current = null;
    pausedAccumRef.current = 0;
    pauseStartedRef.current = null;
    setStatus(graphRef.current ? 'idle' : 'idle');
  }, []);

  const supportsPause =
    typeof MediaRecorder !== 'undefined' &&
    typeof MediaRecorder.prototype.pause === 'function';

  const isLive = status === 'recording' || status === 'paused';

  return {
    status,
    error,
    durationLabel: formatRecorderDuration(durationSec),
    durationSec,
    level,
    recordedBlob,
    mimeType,
    supportsPause,
    isLive,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    refreshStream: armStream,
  };
}
