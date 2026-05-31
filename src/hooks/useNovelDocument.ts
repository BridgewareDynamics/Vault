import { useCallback, useEffect, useRef, useState } from 'react';
import { NovelDocument, NovelPage } from '../types';
import { getCachedNovelDocument, setCachedNovelDocument } from '../utils/novelPrefetch';
import { normalizeNovelBookSettings } from '../components/Novel/engine/bookSizes';

const AUTOSAVE_MS = 700;

function normalizeDocument(doc: NovelDocument): NovelDocument {
  return {
    ...doc,
    pages: Array.isArray(doc.pages) ? doc.pages : [],
    settings: {
      showPageNumbers: doc.settings?.showPageNumbers ?? true,
      fontFamily: doc.settings?.fontFamily ?? 'Georgia, serif',
      fontSize: doc.settings?.fontSize ?? 12,
      ...normalizeNovelBookSettings(doc.settings ?? {}),
      coverTitle: doc.settings?.coverTitle ?? doc.title,
      coverSubtitle: doc.settings?.coverSubtitle ?? '',
      coverImageAssetId: doc.settings?.coverImageAssetId,
      coverImageRelativePath: doc.settings?.coverImageRelativePath,
    },
  };
}

interface UseNovelDocumentOptions {
  initialDocument?: NovelDocument | null;
}

export function useNovelDocument(
  initialNovelFolderPath: string | null,
  options?: UseNovelDocumentOptions
) {
  const [document, setDocument] = useState<NovelDocument | null>(() => {
    if (options?.initialDocument) {
      return normalizeDocument(options.initialDocument);
    }
    if (initialNovelFolderPath) {
      const cached = getCachedNovelDocument(initialNovelFolderPath);
      return cached ? normalizeDocument(cached) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (options?.initialDocument || !initialNovelFolderPath) return false;
    return !getCachedNovelDocument(initialNovelFolderPath);
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadNovel = useCallback(async (novelFolderPath: string) => {
    if (!window.electronAPI?.readNovel) return;

    const cached = getCachedNovelDocument(novelFolderPath);
    if (cached) {
      setDocument(normalizeDocument(cached));
      setDirty(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const doc = await window.electronAPI.readNovel(novelFolderPath);
      const normalized = normalizeDocument(doc as NovelDocument);
      setCachedNovelDocument(novelFolderPath, doc as NovelDocument);
      setDocument(normalized);
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialNovelFolderPath) return;
    if (options?.initialDocument) {
      const normalized = normalizeDocument(options.initialDocument);
      setCachedNovelDocument(initialNovelFolderPath, options.initialDocument);
      setDocument(normalized);
      setDirty(false);
      setLoading(false);
      return;
    }
    void loadNovel(initialNovelFolderPath);
  }, [initialNovelFolderPath, loadNovel, options?.initialDocument]);

  const persist = useCallback(async (doc: NovelDocument) => {
    if (!window.electronAPI?.saveNovel) return;
    setSaving(true);
    try {
      const savedDoc = normalizeDocument((await window.electronAPI.saveNovel(doc)) as NovelDocument);
      setDocument(savedDoc);
      setCachedNovelDocument(savedDoc.novelFolderPath, savedDoc);
      setDirty(false);
      return savedDoc;
    } finally {
      setSaving(false);
    }
  }, []);

  const scheduleSave = useCallback(
    (doc: NovelDocument) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void persist(doc);
      }, AUTOSAVE_MS);
    },
    [persist]
  );

  const updateDocument = useCallback(
    (updater: (prev: NovelDocument) => NovelDocument) => {
      setDocument((prev) => {
        if (!prev) return prev;
        const next = normalizeDocument(updater(prev));
        setDirty(true);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const flushSave = useCallback(async (): Promise<NovelDocument | null> => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!document) return null;
    return (await persist(document)) ?? null;
  }, [document, persist]);

  const updatePages = useCallback(
    (pages: NovelPage[]) => {
      updateDocument((prev) => ({ ...prev, pages }));
    },
    [updateDocument]
  );

  const updateSettings = useCallback(
    (settings: Partial<NovelDocument['settings']>) => {
      updateDocument((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...settings },
      }));
    },
    [updateDocument]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return {
    document,
    loading,
    saving,
    dirty,
    updateDocument,
    updatePages,
    updateSettings,
    flushSave,
    persist,
  };
}
