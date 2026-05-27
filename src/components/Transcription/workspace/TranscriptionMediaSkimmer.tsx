import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { AudioLines, Pause, Play, RotateCcw } from 'lucide-react';
import type { TranscriptionMediaSelection, TranscriptionMediaType } from '../../../types';
import type { TranscriptionWorkspaceUi } from './useTranscriptionWorkspaceUi';
import {
  MIN_MEDIA_SELECTION_SECONDS,
  buildVaultMediaUrl,
  clamp,
  formatMediaTimestamp,
} from '../../../utils/transcriptionSegmentDefaults';

export interface TranscriptionMediaSkimmerSelection {
  startSeconds: number;
  endSeconds: number;
  totalDurationSeconds: number;
  selectionDurationSeconds: number;
}

export interface TranscriptionMediaSkimmerProps {
  ui: TranscriptionWorkspaceUi;
  mediaPath: string | null;
  mediaType: TranscriptionMediaType;
  sourceId: string | null;
  savedSelection?: TranscriptionMediaSelection | null;
  onSelectionChange: (selection: TranscriptionMediaSkimmerSelection) => void;
}

function selectionMatchesSource(
  saved: TranscriptionMediaSelection | null | undefined,
  sourceId: string | null,
  totalDuration: number
) {
  if (!saved || !sourceId || saved.sourceId !== sourceId || totalDuration <= 0) {
    return false;
  }

  return (
    saved.totalDurationSeconds === totalDuration &&
    saved.startSeconds >= 0 &&
    saved.endSeconds > saved.startSeconds &&
    saved.endSeconds <= totalDuration + 0.05
  );
}

export function TranscriptionMediaSkimmer({
  ui,
  mediaPath,
  mediaType,
  sourceId,
  savedSelection,
  onSelectionChange,
}: TranscriptionMediaSkimmerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  const mediaUrl = useMemo(
    () => (mediaPath ? buildVaultMediaUrl(mediaPath) : null),
    [mediaPath]
  );

  const selectionDuration = Math.max(0, endSeconds - startSeconds);

  const emitSelection = useCallback(
    (start: number, end: number, total: number) => {
      onSelectionChange({
        startSeconds: start,
        endSeconds: end,
        totalDurationSeconds: total,
        selectionDurationSeconds: Math.max(0, end - start),
      });
    },
    [onSelectionChange]
  );

  const applyRange = useCallback(
    (start: number, end: number, total: number, notify = true) => {
      const safeTotal = Math.max(total, MIN_MEDIA_SELECTION_SECONDS);
      const minGap = Math.min(MIN_MEDIA_SELECTION_SECONDS, safeTotal);
      const nextStart = clamp(start, 0, Math.max(0, safeTotal - minGap));
      const nextEnd = clamp(end, nextStart + minGap, safeTotal);
      setStartSeconds(nextStart);
      setEndSeconds(nextEnd);
      if (notify) {
        emitSelection(nextStart, nextEnd, safeTotal);
      }
    },
    [emitSelection]
  );

  useEffect(() => {
    setTotalDuration(0);
    setStartSeconds(0);
    setEndSeconds(0);
    setIsPlaying(false);
    setLoadError(null);
    setIsDragging(null);
  }, [mediaPath, sourceId]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleLoadedMetadata = () => {
      const duration = Number.isFinite(media.duration) ? media.duration : 0;
      if (duration <= 0) {
        setLoadError('Could not read media duration.');
        return;
      }

      setLoadError(null);
      setTotalDuration(duration);

      if (selectionMatchesSource(savedSelection, sourceId, duration)) {
        applyRange(savedSelection!.startSeconds, savedSelection!.endSeconds, duration);
        return;
      }

      applyRange(0, duration, duration);
    };

    const handleError = () => {
      setLoadError('Preview unavailable for this file.');
      setTotalDuration(0);
    };

    const handleTimeUpdate = () => {
      if (!isPlaying) return;
      if (media.currentTime >= endSeconds - 0.05) {
        media.pause();
        media.currentTime = startSeconds;
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('error', handleError);
    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('ended', handleEnded);

    if (media.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('error', handleError);
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('ended', handleEnded);
    };
  }, [applyRange, endSeconds, isPlaying, savedSelection, sourceId, mediaUrl]);

  const seekToFraction = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || totalDuration <= 0) return 0;
      const rect = track.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return ratio * totalDuration;
    },
    [totalDuration]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const time = seekToFraction(event.clientX);
      if (isDragging === 'start') {
        applyRange(Math.min(time, endSeconds - MIN_MEDIA_SELECTION_SECONDS), endSeconds, totalDuration);
      } else {
        applyRange(startSeconds, Math.max(time, startSeconds + MIN_MEDIA_SELECTION_SECONDS), totalDuration);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [applyRange, endSeconds, isDragging, seekToFraction, startSeconds, totalDuration]);

  const togglePlayback = async () => {
    const media = mediaRef.current;
    if (!media || totalDuration <= 0) return;

    if (isPlaying) {
      media.pause();
      setIsPlaying(false);
      return;
    }

    if (media.currentTime < startSeconds || media.currentTime >= endSeconds) {
      media.currentTime = startSeconds;
    }

    try {
      await media.play();
      setIsPlaying(true);
    } catch {
      setLoadError('Playback was blocked. Click play again.');
    }
  };

  const handleUseFullLength = () => {
    if (totalDuration <= 0) return;
    applyRange(0, totalDuration, totalDuration);
    const media = mediaRef.current;
    if (media) {
      media.pause();
      media.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const startPct = totalDuration > 0 ? (startSeconds / totalDuration) * 100 : 0;
  const endPct = totalDuration > 0 ? (endSeconds / totalDuration) * 100 : 0;
  const playheadPct =
    totalDuration > 0 && mediaRef.current
      ? (mediaRef.current.currentTime / totalDuration) * 100
      : startPct;

  if (!mediaPath) {
    return (
      <div className={`rounded-xl border p-3 text-xs ${ui.inset}`}>
        <p className={`font-semibold ${ui.t.muted}`}>Select a media source in Pipeline to preview and set segment bounds.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 rounded-xl border p-3 ${ui.inset}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${ui.t.primary}`}>Source clip</p>
          <p className={`mt-0.5 text-[11px] ${ui.t.muted}`}>
            Drag handles to segment · {formatMediaTimestamp(selectionDuration)} selected
          </p>
        </div>
        <button
          type="button"
          onClick={handleUseFullLength}
          disabled={totalDuration <= 0}
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold ${ui.surface}`}
        >
          <RotateCcw className="h-3 w-3" />
          Full length
        </button>
      </div>

      {mediaType === 'video' ? (
        <video
          ref={mediaRef as RefObject<HTMLVideoElement>}
          src={mediaUrl ?? undefined}
          className="aspect-video w-full rounded-lg border border-white/10 bg-black/50 object-contain"
          preload="metadata"
          playsInline
          muted
        />
      ) : (
        <>
          <div
            className={`flex aspect-[5/1] items-center justify-center rounded-lg border border-white/10 bg-black/40`}
          >
            <AudioLines className={`h-8 w-8 ${ui.t.muted}`} />
          </div>
          <audio
            ref={mediaRef as RefObject<HTMLAudioElement>}
            src={mediaUrl ?? undefined}
            className="sr-only"
            preload="metadata"
          />
        </>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void togglePlayback()}
          disabled={totalDuration <= 0 || !!loadError}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ui.t.button}`}
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5 text-white" /> : <Play className="h-3.5 w-3.5 text-white" />}
        </button>

        <div className="min-w-0 flex-1">
          <div
            ref={trackRef}
            className={`relative h-8 cursor-pointer rounded-lg border ${ui.surface}`}
            role="slider"
            aria-label="Media segment range"
            aria-valuemin={0}
            aria-valuemax={Math.round(totalDuration)}
            aria-valuenow={Math.round(selectionDuration)}
          >
            <div className="absolute inset-x-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-black/30" />
            <div
              className={`absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full ${ui.t.button}`}
              style={{
                left: `${startPct}%`,
                width: `${Math.max(0, endPct - startPct)}%`,
              }}
            />
            <div
              className="pointer-events-none absolute top-1/2 h-2 w-0.5 -translate-y-1/2 rounded-full bg-white/80"
              style={{ left: `${playheadPct}%` }}
            />
            <button
              type="button"
              className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-cyber-cyan-400 shadow"
              style={{ left: `${startPct}%` }}
              onPointerDown={(event) => {
                event.preventDefault();
                setIsDragging('start');
              }}
              aria-label="Segment start"
            />
            <button
              type="button"
              className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-cyber-purple-400 shadow"
              style={{ left: `${endPct}%` }}
              onPointerDown={(event) => {
                event.preventDefault();
                setIsDragging('end');
              }}
              aria-label="Segment end"
            />
          </div>
          <div className={`mt-1 flex justify-between text-[10px] tabular-nums ${ui.t.muted}`}>
            <span>{formatMediaTimestamp(startSeconds)}</span>
            <span>{formatMediaTimestamp(endSeconds)}</span>
            <span>{formatMediaTimestamp(totalDuration)}</span>
          </div>
        </div>
      </div>

      {loadError ? <p className="text-[11px] text-red-400">{loadError}</p> : null}
    </div>
  );
}
