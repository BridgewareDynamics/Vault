import { useCallback, useEffect, useRef, useState } from 'react';
import { MapBlock, MapDocument, MapEdge } from '../types';
import { buildChronology } from '../utils/mapChronology';
import { getMapBlockSize, relayoutDocument } from '../utils/mapLayout';
import { buildMapEdges } from '../utils/mapEdgeRouting';
import { logger } from '../utils/logger';
import { normalizeMapEdgeAppearance } from '../components/Map/mapEdgeAppearance';
import {
  getCachedMapDocument,
  setCachedMapDocument,
} from '../utils/mapPrefetch';

const AUTOSAVE_MS = 700;

function normalizeBlock(rawBlock: MapBlock): MapBlock {
  const isBranch =
    rawBlock.kind === 'branch' &&
    typeof rawBlock.branchParentBlockId === 'string' &&
    (rawBlock.branchSide === 'left' || rawBlock.branchSide === 'right');

  if (isBranch) {
    return {
      ...rawBlock,
      kind: 'branch',
      chronology: undefined,
      size: getMapBlockSize({ ...rawBlock, kind: 'branch' }),
      positionLocked: false,
      branchSourceSide: rawBlock.branchSourceSide ?? rawBlock.branchSide,
      branchOrder: rawBlock.branchOrder ?? 0,
    };
  }

  return {
    ...rawBlock,
    kind: 'timeline',
    chronology:
      rawBlock.chronology ??
      buildChronology({
        tier: 'year',
        year: new Date().getFullYear(),
      }),
    size: getMapBlockSize({ ...rawBlock, kind: 'timeline' }),
  };
}

function normalizeDocument(doc: MapDocument): MapDocument {
  const blocks = Array.isArray(doc.blocks) ? doc.blocks.map(normalizeBlock) : [];
  const defaultEdgeStyle = doc.defaultEdgeStyle === 'dotted' ? 'dotted' : 'solid';
  const normalizedEdges: MapEdge[] = buildMapEdges(blocks, defaultEdgeStyle);

  return {
    ...doc,
    blocks,
    edges: normalizedEdges,
    defaultEdgeStyle,
    defaultEdgeAppearance: normalizeMapEdgeAppearance(doc.defaultEdgeAppearance),
    viewport: doc.viewport ?? { x: 0, y: 0, zoom: 1 },
    layoutMode: 'timeline-vertical',
  };
}

interface UseMapDocumentOptions {
  initialDocument?: MapDocument | null;
}

export function useMapDocument(
  initialMapFolderPath: string | null,
  options?: UseMapDocumentOptions
) {
  const [document, setDocument] = useState<MapDocument | null>(() => {
    if (options?.initialDocument) {
      return normalizeDocument(options.initialDocument);
    }
    if (initialMapFolderPath) {
      const cached = getCachedMapDocument(initialMapFolderPath);
      return cached ? normalizeDocument(cached) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (options?.initialDocument) {
      return false;
    }
    if (!initialMapFolderPath) {
      return false;
    }
    return !getCachedMapDocument(initialMapFolderPath);
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMap = useCallback(async (mapFolderPath: string) => {
    if (!window.electronAPI?.readMap) return;

    const cached = getCachedMapDocument(mapFolderPath);
    if (cached) {
      setDocument(normalizeDocument(cached));
      setDirty(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const doc = await window.electronAPI.readMap(mapFolderPath);
      const normalized = normalizeDocument(doc as MapDocument);
      setCachedMapDocument(mapFolderPath, doc as MapDocument);
      setDocument(normalized);
      setDirty(false);
    } catch (error) {
      logger.error('Failed to load map:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialMapFolderPath) {
      return;
    }
    if (options?.initialDocument) {
      const normalized = normalizeDocument(options.initialDocument);
      setCachedMapDocument(initialMapFolderPath, options.initialDocument);
      setDocument(normalized);
      setDirty(false);
      setLoading(false);
      return;
    }
    void loadMap(initialMapFolderPath);
  }, [initialMapFolderPath, loadMap, options?.initialDocument]);

  const persist = useCallback(async (doc: MapDocument) => {
    if (!window.electronAPI?.saveMap) return;
    setSaving(true);
    try {
      const savedDoc = normalizeDocument(await window.electronAPI.saveMap(doc));
      setDocument(savedDoc as MapDocument);
      setDirty(false);
      return savedDoc as MapDocument;
    } finally {
      setSaving(false);
    }
  }, []);

  const scheduleSave = useCallback(
    (doc: MapDocument) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        persist(doc).catch((err) => logger.error('Autosave failed:', err));
      }, AUTOSAVE_MS);
    },
    [persist]
  );

  const updateDocument = useCallback(
    (updater: (prev: MapDocument) => MapDocument, options?: { skipAutosave?: boolean }) => {
      setDocument((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        setDirty(true);
        if (!options?.skipAutosave) {
          scheduleSave(next);
        }
        return next;
      });
    },
    [scheduleSave]
  );

  const saveNow = useCallback(async (nextDocument?: MapDocument) => {
    const docToSave = nextDocument ?? document;
    if (!docToSave) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await persist(docToSave);
  }, [document, persist]);

  const relayout = useCallback(
    (resetLocked = false) => {
      updateDocument((prev) => relayoutDocument(prev, resetLocked));
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
    setDocument,
    loading,
    saving,
    dirty,
    loadMap,
    updateDocument,
    saveNow,
    relayout,
    setDirty,
  };
}
