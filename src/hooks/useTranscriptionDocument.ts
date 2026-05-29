import { useCallback, useEffect, useRef, useState } from 'react';
import { TranscriptionDocument } from '../types';
import { logger } from '../utils/logger';

const AUTOSAVE_MS = 700;

interface UseTranscriptionDocumentOptions {
  initialDocument?: TranscriptionDocument | null;
}

export function useTranscriptionDocument(
  initialTranscriptionFolderPath: string | null,
  options?: UseTranscriptionDocumentOptions
) {
  const [document, setDocument] = useState<TranscriptionDocument | null>(
    () => options?.initialDocument ?? null
  );
  const [loading, setLoading] = useState(() => {
    if (options?.initialDocument) return false;
    return Boolean(initialTranscriptionFolderPath);
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTranscription = useCallback(async (transcriptionFolderPath: string) => {
    if (!window.electronAPI?.readTranscription) return;
    setLoading(true);
    try {
      const doc = await window.electronAPI.readTranscription(transcriptionFolderPath);
      setDocument(doc);
      setDirty(false);
    } catch (error) {
      logger.error('Failed to load transcription:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialTranscriptionFolderPath) {
      return;
    }
    if (options?.initialDocument) {
      setDocument(options.initialDocument);
      setDirty(false);
      setLoading(false);
      return;
    }
    void loadTranscription(initialTranscriptionFolderPath);
  }, [initialTranscriptionFolderPath, loadTranscription, options?.initialDocument]);

  const persist = useCallback(async (doc: TranscriptionDocument) => {
    if (!window.electronAPI?.saveTranscription) return;
    setSaving(true);
    try {
      const savedDoc = await window.electronAPI.saveTranscription(doc);
      setDocument(savedDoc);
      setDirty(false);
      return savedDoc;
    } finally {
      setSaving(false);
    }
  }, []);

  const scheduleSave = useCallback(
    (doc: TranscriptionDocument) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        void persist(doc).catch((error) =>
          logger.error('Autosave for transcription failed:', error)
        );
      }, AUTOSAVE_MS);
    },
    [persist]
  );

  const updateDocument = useCallback(
    (
      updater: (previous: TranscriptionDocument) => TranscriptionDocument,
      options?: { skipAutosave?: boolean }
    ) => {
      setDocument((previous) => {
        if (!previous) return previous;
        const next = updater(previous);
        if (next === previous) {
          return previous;
        }
        setDirty(true);
        if (!options?.skipAutosave) {
          scheduleSave(next);
        }
        return next;
      });
    },
    [scheduleSave]
  );

  const saveNow = useCallback(
    async (nextDocument?: TranscriptionDocument) => {
      const documentToSave = nextDocument ?? document;
      if (!documentToSave) return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      await persist(documentToSave);
    },
    [document, persist]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    document,
    setDocument,
    loading,
    saving,
    dirty,
    loadTranscription,
    updateDocument,
    saveNow,
    setDirty,
  };
}
