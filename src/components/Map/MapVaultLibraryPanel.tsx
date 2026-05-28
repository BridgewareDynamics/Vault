import { type DragEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  Eye,
  FileText,
  FolderOpen,
  ImageIcon,
  Link2,
  Loader2,
  Move,
  PlaySquare,
  X,
} from 'lucide-react';
import { ArchiveCase, ArchiveFile, Theme } from '../../types';
import { ArchiveFileViewer } from '../Archive/ArchiveFileViewer';
import { useMapTheme } from './mapTheme';
import {
  createPendingMapAttachment,
  detectMapAttachmentType,
  MAP_VAULT_DRAG_MIME,
  PendingMapAttachment,
} from './mapAttachmentUtils';

interface MapVaultLibraryPanelProps {
  isOpen: boolean;
  linkedCasePath?: string | null;
  theme: Theme;
  onClose: () => void;
  onAttachFile: (attachment: PendingMapAttachment) => void;
}

interface CaseLibraryEntry {
  name: string;
  path: string;
  size: number;
  modified: number;
  isFolder?: boolean;
  folderType?: 'extraction' | 'case';
  parentPdfName?: string;
  categoryTagId?: string;
}

interface PreviewAsset {
  src: string;
  mimeType: string;
}

function mapCaseLibraryEntry(item: CaseLibraryEntry): ArchiveFile {
  return {
    name: item.name,
    path: item.path,
    size: item.size,
    modified: item.modified,
    type: item.isFolder ? 'other' : detectMapAttachmentType(item.path),
    isFolder: item.isFolder,
    folderType: item.folderType,
    parentPdfName: item.parentPdfName,
    categoryTagId: item.categoryTagId,
  };
}

function sortLibraryEntries(items: ArchiveFile[]): ArchiveFile[] {
  return [...items].sort((a, b) => {
    if (Boolean(a.isFolder) !== Boolean(b.isFolder)) {
      return a.isFolder ? -1 : 1;
    }

    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

function getFolderSegments(rootPath: string, folderPath: string): string[] {
  if (!rootPath || !folderPath || rootPath === folderPath) {
    return [];
  }

  return folderPath
    .slice(rootPath.length)
    .split(/[\\/]/)
    .filter(Boolean);
}

function getParentFolderPath(folderPath: string): string {
  return folderPath.replace(/[\\/][^\\/]+$/, '');
}

function getEntryIcon(entry: ArchiveFile) {
  if (entry.isFolder) {
    return FolderOpen;
  }

  if (entry.type === 'image') {
    return ImageIcon;
  }

  if (entry.type === 'video') {
    return PlaySquare;
  }

  return FileText;
}

export function MapVaultLibraryPanel({
  isOpen,
  linkedCasePath,
  theme,
  onClose,
  onAttachFile,
}: MapVaultLibraryPanelProps) {
  const t = useMapTheme(theme);
  const [cases, setCases] = useState<ArchiveCase[]>([]);
  const [selectedCasePath, setSelectedCasePath] = useState<string | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<ArchiveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<ArchiveFile | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<PreviewAsset | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [viewerFile, setViewerFile] = useState<ArchiveFile | null>(null);

  const selectedCase = useMemo(
    () => cases.find((item) => item.path === selectedCasePath) ?? null,
    [cases, selectedCasePath]
  );
  const folderSegments = selectedCase && currentFolderPath
    ? getFolderSegments(selectedCase.path, currentFolderPath)
    : [];

  const loadFolder = useCallback(async (folderPath: string) => {
    if (!window.electronAPI?.listCaseFiles) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.listCaseFiles(folderPath);
      const mapped = sortLibraryEntries(result.map((item) => mapCaseLibraryEntry(item)));
      setEntries(mapped);
      setCurrentFolderPath(folderPath);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load folder');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const openCase = useCallback(
    async (casePath: string) => {
      setSelectedCasePath(casePath);
      await loadFolder(casePath);
    },
    [loadFolder]
  );

  const initializePanel = useCallback(async () => {
    if (!window.electronAPI?.listArchiveCases) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const archiveCases = await window.electronAPI.listArchiveCases();
      const sortedCases = [...archiveCases].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      setCases(sortedCases);

      if (linkedCasePath && sortedCases.some((item) => item.path === linkedCasePath)) {
        setSelectedCasePath(linkedCasePath);
        const result = await window.electronAPI.listCaseFiles(linkedCasePath);
        setEntries(sortLibraryEntries(result.map((item) => mapCaseLibraryEntry(item))));
        setCurrentFolderPath(linkedCasePath);
      } else {
        setSelectedCasePath(null);
        setCurrentFolderPath(null);
        setEntries([]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load Vault library');
      setCases([]);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [linkedCasePath]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void initializePanel();
  }, [initializePanel, isOpen]);

  useEffect(() => {
    if (!selectedCasePath) {
      setSelectedPreviewFile(null);
      setPreviewThumbnail(null);
      setPreviewAsset(null);
      return;
    }

    if (entries.length === 0) {
      setSelectedPreviewFile(null);
      setPreviewThumbnail(null);
      setPreviewAsset(null);
      return;
    }

    const availableFiles = entries.filter((entry) => !entry.isFolder);
    if (availableFiles.length === 0) {
      setSelectedPreviewFile(null);
      setPreviewThumbnail(null);
      setPreviewAsset(null);
      return;
    }

    if (
      selectedPreviewFile &&
      availableFiles.some((entry) => entry.path === selectedPreviewFile.path)
    ) {
      return;
    }

    setSelectedPreviewFile(availableFiles[0]);
  }, [entries, selectedCasePath, selectedPreviewFile]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview(file: ArchiveFile) {
      setPreviewLoading(true);
      setPreviewThumbnail(null);
      setPreviewAsset(null);

      try {
        if (file.type === 'image' && window.electronAPI?.readFileData) {
          const data = await window.electronAPI.readFileData(file.path);
          if (!cancelled) {
            setPreviewAsset({
              src: `data:${data.mimeType};base64,${data.data}`,
              mimeType: data.mimeType,
            });
          }
        } else if (file.type === 'video') {
          if (!cancelled) {
            setPreviewAsset({
              src: file.path.startsWith('http')
                ? file.path
                : `vault-video://${encodeURIComponent(file.path)}`,
              mimeType: 'video/mp4',
            });
          }
        } else if (file.type === 'pdf') {
          let thumbnail = null;
          if (window.electronAPI?.readPDFThumbnail) {
            thumbnail = await window.electronAPI.readPDFThumbnail(file.path);
          }
          if (!thumbnail && window.electronAPI?.getFileThumbnail) {
            thumbnail = await window.electronAPI.getFileThumbnail(file.path);
          }
          if (!cancelled) {
            setPreviewThumbnail(thumbnail || null);
          }
        } else if (window.electronAPI?.getFileThumbnail) {
          const thumbnail = await window.electronAPI.getFileThumbnail(file.path);
          if (!cancelled) {
            setPreviewThumbnail(thumbnail || null);
          }
        }
      } catch {
        if (!cancelled) {
          setPreviewThumbnail(null);
          setPreviewAsset(null);
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }

    if (!selectedPreviewFile) {
      setPreviewLoading(false);
      setPreviewThumbnail(null);
      setPreviewAsset(null);
      return () => {
        cancelled = true;
      };
    }

    void loadPreview(selectedPreviewFile);
    return () => {
      cancelled = true;
    };
  }, [selectedPreviewFile]);

  if (!isOpen) {
    return null;
  }

  const handleAttach = (file: ArchiveFile) => {
    const attachmentType = file.type === 'audio' ? 'other' : file.type;
    onAttachFile(
      createPendingMapAttachment({
        sourcePath: file.path,
        origin: 'vault',
        fileName: file.name,
        type: attachmentType,
      })
    );
  };

  const handleFileDragStart = (event: DragEvent<HTMLLIElement>, file: ArchiveFile) => {
    const attachmentType = file.type === 'audio' ? 'other' : file.type;
    const payload = createPendingMapAttachment({
      sourcePath: file.path,
      origin: 'vault',
      fileName: file.name,
      type: attachmentType,
    });

    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(MAP_VAULT_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.setData('text/plain', file.path);
  };

  const handlePreviewDragStart = (event: DragEvent<HTMLDivElement>, file: ArchiveFile) => {
    const attachmentType = file.type === 'audio' ? 'other' : file.type;
    const payload = createPendingMapAttachment({
      sourcePath: file.path,
      origin: 'vault',
      fileName: file.name,
      type: attachmentType,
    });

    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(MAP_VAULT_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.setData('text/plain', file.path);
  };

  const handleNavigateUp = async () => {
    if (!selectedCase || !currentFolderPath) {
      return;
    }

    if (currentFolderPath === selectedCase.path) {
      setSelectedCasePath(null);
      setCurrentFolderPath(null);
      setEntries([]);
      setError(null);
      return;
    }

    const parentPath = getParentFolderPath(currentFolderPath);
    if (!parentPath || parentPath.length < selectedCase.path.length) {
      await loadFolder(selectedCase.path);
      return;
    }

    await loadFolder(parentPath);
  };

  const renderPreviewBody = () => {
    if (!selectedPreviewFile) {
      return (
        <div className={`flex h-full items-center justify-center text-center text-sm ${t.muted}`}>
          Select a Vault file to preview it here, then drag it into the block or attach it directly.
        </div>
      );
    }

    if (previewLoading) {
      return (
        <div className={`flex h-full items-center justify-center gap-2 text-sm ${t.muted}`}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading preview...
        </div>
      );
    }

    if (selectedPreviewFile.type === 'image' && previewAsset) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <img
            src={previewAsset.src}
            alt={selectedPreviewFile.name}
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
          />
        </div>
      );
    }

    if (selectedPreviewFile.type === 'video' && previewAsset) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <video
            src={previewAsset.src}
            controls
            className="max-h-full max-w-full rounded-xl border border-white/10 bg-black/60"
          />
        </div>
      );
    }

    if (previewThumbnail) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <img
            src={previewThumbnail}
            alt={`${selectedPreviewFile.name} preview`}
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
          />
        </div>
      );
    }

    const PreviewIcon = getEntryIcon(selectedPreviewFile);

    return (
      <div className={`flex h-full flex-col items-center justify-center gap-4 text-center ${t.muted}`}>
        <PreviewIcon className="w-16 h-16" />
        <div>
          <p className="text-sm font-medium text-white">{selectedPreviewFile.name}</p>
          <p className="text-xs mt-1">Preview unavailable for this file type, but it can still be dragged or attached.</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`w-full max-w-3xl xl:flex-1 xl:max-w-none max-h-[92vh] min-h-[560px] rounded-2xl border-2 shadow-2xl flex flex-col overflow-hidden ${t.card}`}
    >
      <header
        className={`flex items-start justify-between gap-4 px-5 py-4 border-b shrink-0 ${
          t.isPastel ? 'border-pink-200/30' : 'border-white/10'
        }`}
      >
        <div>
          <h3 className="text-lg font-bold">Vault Case Library</h3>
          <p className={`text-sm mt-1 ${t.muted}`}>
            Browse case folders and drag PDFs or attach them directly to this block.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 shrink-0"
          aria-label="Close Vault case library"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-5 py-4 shrink-0 space-y-4">
          {selectedCase ? (
            <div
              className={`rounded-xl border px-4 py-3 ${
                t.isPastel
                  ? 'bg-purple-50/60 border-purple-200/40'
                  : 'bg-cyber-purple-950/30 border-cyber-purple-500/30'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.22em] opacity-70">Current Case</p>
                  <p className="text-sm font-semibold truncate">{selectedCase.name}</p>
                  <p className={`text-xs mt-1 truncate ${t.muted}`}>
                    {[selectedCase.name, ...folderSegments].join(' / ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCasePath(null);
                    setCurrentFolderPath(null);
                    setEntries([]);
                    setSelectedPreviewFile(null);
                    setPreviewThumbnail(null);
                    setPreviewAsset(null);
                    setError(null);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border shrink-0 ${t.card}`}
                >
                  All cases
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-xl border px-4 py-3 ${
                t.isPastel
                  ? 'bg-purple-50/60 border-purple-200/40'
                  : 'bg-cyber-purple-950/30 border-cyber-purple-500/30'
              }`}
            >
              <p className="text-sm font-medium">Choose a case to browse its library.</p>
              <p className={`text-xs mt-1 ${t.muted}`}>
                Linked maps open their assigned case automatically. Once inside, click a file to preview it and drag it into the block.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {!selectedCase ? (
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
            {loading ? (
              <div className={`flex h-full items-center justify-center gap-2 py-10 ${t.muted}`}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Vault library...
              </div>
            ) : cases.length === 0 ? (
              <p className={`text-sm py-6 text-center ${t.muted}`}>
                No Vault cases were found yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {cases.map((caseItem) => (
                  <li key={caseItem.path}>
                    <button
                      type="button"
                      onClick={() => void openCase(caseItem.path)}
                      className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border text-left ${t.card} ${t.cardHover}`}
                    >
                      <FolderOpen className={`w-5 h-5 shrink-0 ${t.primary}`} />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{caseItem.name}</span>
                        {caseItem.description && (
                          <span className={`block truncate text-[11px] ${t.muted}`}>
                            {caseItem.description}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 px-5 pb-5 overflow-hidden">
            <div className="grid h-full min-h-0 grid-cols-1 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-4">
              <section className={`min-h-0 rounded-2xl border flex flex-col overflow-hidden ${t.card}`}>
                <div className="shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => void handleNavigateUp()}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${t.card}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {currentFolderPath === selectedCase.path ? 'Back to cases' : 'Up one folder'}
                  </button>
                  <span className={`text-xs ${t.muted}`}>{entries.length} item{entries.length === 1 ? '' : 's'}</span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
                  {loading ? (
                    <div className={`flex h-full items-center justify-center gap-2 text-sm ${t.muted}`}>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading folder...
                    </div>
                  ) : entries.length === 0 ? (
                    <p className={`text-sm py-8 text-center ${t.muted}`}>
                      This folder is empty.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {entries.map((entry) => {
                        const EntryIcon = getEntryIcon(entry);
                        const isSelected = !entry.isFolder && selectedPreviewFile?.path === entry.path;

                        return (
                          <li
                            key={entry.path}
                            draggable={!entry.isFolder}
                            onDragStart={
                              entry.isFolder
                                ? undefined
                                : (event) => handleFileDragStart(event, entry)
                            }
                            className={`rounded-xl border px-4 py-3 transition-colors ${
                              isSelected
                                ? t.isPastel
                                  ? 'border-purple-300 bg-purple-50/70'
                                  : 'border-cyber-cyan-400/50 bg-cyber-cyan-500/10'
                                : t.card
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={
                                  entry.isFolder
                                    ? () => void loadFolder(entry.path)
                                    : () => setSelectedPreviewFile(entry)
                                }
                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                              >
                                <EntryIcon
                                  className={`w-5 h-5 shrink-0 ${
                                    entry.isFolder ? t.primary : isSelected ? t.primary : t.muted
                                  }`}
                                />
                                <div className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium">{entry.name}</span>
                                  <span className={`block text-[11px] ${t.muted}`}>
                                    {entry.isFolder
                                      ? 'Open folder'
                                      : 'Click to preview, drag to attach'}
                                  </span>
                                </div>
                              </button>
                              {!entry.isFolder && (
                                <>
                                  <Move className={`w-4 h-4 shrink-0 ${t.muted}`} />
                                  <button
                                    type="button"
                                    onClick={() => handleAttach(entry)}
                                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${t.button}`}
                                    aria-label={`Attach ${entry.name}`}
                                  >
                                    <Link2 className="w-4 h-4" />
                                    Attach
                                  </button>
                                </>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>

              <section className={`min-h-0 rounded-2xl border flex flex-col overflow-hidden ${t.card}`}>
                <div className="shrink-0 px-4 py-3 border-b border-white/10 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Preview</p>
                    <p className={`text-xs mt-1 ${t.muted}`}>
                      Preview the file here, then drag it into the block or attach it directly.
                    </p>
                  </div>
                  {selectedPreviewFile && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAttach(selectedPreviewFile)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${t.button}`}
                        aria-label={`Attach ${selectedPreviewFile.name}`}
                      >
                        <Link2 className="w-4 h-4" />
                        Attach
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewerFile(selectedPreviewFile)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${t.card}`}
                      >
                        <Eye className="w-4 h-4" />
                        Open preview
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                  <div
                    draggable={Boolean(selectedPreviewFile)}
                    onDragStart={
                      selectedPreviewFile
                        ? (event) => handlePreviewDragStart(event, selectedPreviewFile)
                        : undefined
                    }
                    className={`h-full min-h-[320px] rounded-2xl border p-4 flex flex-col gap-4 ${
                      t.isPastel
                        ? 'bg-white/80 border-pink-200/40'
                        : 'bg-black/30 border-white/10'
                    }`}
                  >
                    {selectedPreviewFile && (
                      <div className="shrink-0 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{selectedPreviewFile.name}</p>
                          <p className={`text-xs mt-1 ${t.muted}`}>
                            Drag this preview into the block attachments area or press Attach.
                          </p>
                        </div>
                        <Move className={`w-4 h-4 shrink-0 ${t.muted}`} />
                      </div>
                    )}

                    <div className="flex-1 min-h-0 overflow-auto">
                      {renderPreviewBody()}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {viewerFile && (
        <ArchiveFileViewer
          file={viewerFile}
          files={[viewerFile]}
          onClose={() => setViewerFile(null)}
          overlayZIndex={80}
        />
      )}
    </div>
  );
}
