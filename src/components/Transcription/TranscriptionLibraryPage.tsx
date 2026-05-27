import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Clock3,
  FolderOpen,
  Search,
  Trash2,
} from 'lucide-react';
import { Theme, TranscriptionListEntry } from '../../types';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { HexGrid } from '../Shared/HexGrid';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { ScanLine } from '../Shared/ScanLine';
import { useToast } from '../Toast/ToastContext';
import { useTranscriptionTheme } from './transcriptionTheme';
import { DeleteTranscriptionDialog } from './DeleteTranscriptionDialog';
import {
  getCachedTranscriptionLibrary,
  setCachedTranscriptionLibrary,
} from '../../utils/transcriptionPrefetch';

type TranscriptionLibraryFilter = 'all' | 'global' | 'case';

interface TranscriptionLibraryPageProps {
  theme: Theme;
  onBack: () => void;
  onOpenTranscription: (transcriptionFolderPath: string) => void;
}

function formatRelativeTime(timestamp: number) {
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Updated just now';
  if (diffHours < 24) return `Updated ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `Updated ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return `Updated ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))}`;
}

export function TranscriptionLibraryPage({
  theme,
  onBack,
  onOpenTranscription,
}: TranscriptionLibraryPageProps) {
  const t = useTranscriptionTheme(theme);
  const toast = useToast();
  const [items, setItems] = useState<TranscriptionListEntry[]>(
    () => getCachedTranscriptionLibrary() ?? []
  );
  const [loading, setLoading] = useState(() => !getCachedTranscriptionLibrary());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TranscriptionLibraryFilter>('all');
  const [entryPendingDelete, setEntryPendingDelete] = useState<TranscriptionListEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = async () => {
    if (!window.electronAPI?.listTranscriptions) {
      setLoading(false);
      return;
    }

    if (!getCachedTranscriptionLibrary()) {
      setLoading(true);
    }
    try {
      const list = await window.electronAPI.listTranscriptions();
      setItems(list);
      setCachedTranscriptionLibrary(list);
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'loading transcriptions' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((entry) => {
      if (filter === 'global' && entry.casePath) return false;
      if (filter === 'case' && !entry.casePath) return false;
      if (!normalizedQuery) return true;
      return `${entry.title} ${entry.caseName ?? ''} ${entry.excerpt ?? ''}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [filter, items, query]);

  const panelClassName = t.isPastel
    ? 'border-purple-200/40 bg-white/72 text-gray-800 shadow-[0_24px_80px_rgba(216,180,254,0.18)]'
    : 'border-cyber-purple-500/25 bg-gray-950/65 text-white shadow-[0_24px_80px_rgba(15,23,42,0.65)]';
  const mutedTextClassName = t.isPastel ? 'text-gray-600' : 'text-gray-300';
  const compactInsetSurfaceClassName = t.isPastel
    ? 'border-purple-200/28 bg-white/74'
    : 'border-white/10 bg-white/5';
  const secondaryButtonClassName = t.isPastel
    ? 'border-purple-200/60 bg-white/85 text-gray-700 hover:border-purple-300 hover:bg-white'
    : 'border-white/10 bg-white/5 text-gray-200 hover:border-cyber-cyan-400/45 hover:bg-white/10';

  const confirmDelete = async () => {
    if (!entryPendingDelete || !window.electronAPI?.deleteTranscription) return;

    setDeleting(true);
    try {
      await window.electronAPI.deleteTranscription(entryPendingDelete.transcriptionFolderPath);
      toast.success('Transcription deleted');
      setEntryPendingDelete(null);
      await loadItems();
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'deleting transcription' }));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${t.bg}`}>
      <HexGrid theme={theme} density={24} />
      <ScanLine theme={theme} speed={12} />
      <div className={`relative z-10 flex min-h-screen flex-col ${t.body}`}>
        <header className="border-b border-white/10 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition-colors ${secondaryButtonClassName}`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${t.button}`}>
                <AudioLines className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>
                  Transcription Library
                </p>
                <h1 className={`text-xl font-bold md:text-2xl ${t.heading}`}>Saved Workspaces</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 md:py-10">
          <section className={`grid gap-4 rounded-[32px] border p-6 md:p-7 ${panelClassName}`}>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
              <div className={`rounded-[24px] border p-4 ${compactInsetSurfaceClassName}`}>
                <label htmlFor="transcription-library-search" className="text-sm font-semibold">
                  Search workspaces
                </label>
                <div className="mt-3 flex items-center gap-3 rounded-[20px] border px-4 py-3">
                  <Search className={`h-5 w-5 ${t.primary}`} />
                  <input
                    id="transcription-library-search"
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by title, case, or excerpt"
                    className="w-full bg-transparent text-sm outline-none"
                    aria-label="Search transcriptions"
                  />
                </div>
              </div>

              <div className={`rounded-[24px] border p-4 ${compactInsetSurfaceClassName}`}>
                <p className="text-sm font-semibold">Storage scope</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['all', 'global', 'case'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                        filter === value ? t.button : secondaryButtonClassName
                      }`}
                    >
                      {value === 'all'
                        ? 'All'
                        : value === 'global'
                          ? 'Vault'
                          : 'Case linked'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-[24px] border p-4 ${compactInsetSurfaceClassName}`}>
                <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Visible</p>
                <p className="mt-2 text-3xl font-bold">{filteredItems.length}</p>
                <p className={`mt-1 text-sm ${mutedTextClassName}`}>Workspace results</p>
              </div>
            </div>
          </section>

          {loading ? (
            <section className={`rounded-[30px] border p-10 text-center ${panelClassName}`}>
              <p className={`text-sm uppercase tracking-[0.28em] ${t.primary}`}>Loading library</p>
              <p className={`mt-4 text-base ${mutedTextClassName}`}>
                Pulling saved transcription work into the command center.
              </p>
            </section>
          ) : filteredItems.length === 0 ? (
            <section className={`rounded-[32px] border p-10 md:p-14 ${panelClassName}`}>
              <div className="mx-auto max-w-2xl text-center">
                <div className={`mx-auto w-fit rounded-3xl p-5 ${t.button}`}>
                  <AudioLines className="h-10 w-10 text-white" />
                </div>
                <h3 className={`mt-6 text-3xl font-bold ${t.heading}`}>Nothing matches this view yet.</h3>
                <p className={`mt-4 text-base leading-7 ${mutedTextClassName}`}>
                  Create a new transcription workspace or widen the current search and filter controls.
                </p>
              </div>
            </section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredItems.map((entry, index) => (
                <HolographicEffect
                  key={entry.transcriptionFolderPath}
                  className="rounded-[28px]"
                  intensity={t.isPastel ? 0.12 : 0.22}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.04 * index }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] border p-5 ${panelClassName}`}
                  >
                    <button
                      type="button"
                      onClick={() => setEntryPendingDelete(entry)}
                      className={`absolute right-4 top-4 z-20 rounded-xl p-2 transition-opacity md:opacity-0 md:group-hover:opacity-100 ${
                        t.isPastel
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                      }`}
                      aria-label={`Delete transcription ${entry.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenTranscription(entry.transcriptionFolderPath)}
                      className="relative z-10 flex h-full flex-col gap-4 text-left"
                    >
                      <div className={`rounded-[22px] border p-4 ${compactInsetSurfaceClassName}`}>
                        <div className="flex items-start gap-3">
                          <div className={`rounded-2xl p-3 ${t.button}`}>
                            <AudioLines className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-2 pr-8">
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                                  entry.casePath
                                    ? t.isPastel
                                      ? 'border-emerald-200/60 bg-emerald-50/90 text-emerald-700'
                                      : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                                    : t.isPastel
                                      ? 'border-cyan-200/60 bg-cyan-50/90 text-cyan-700'
                                      : 'border-cyber-cyan-400/20 bg-cyber-cyan-500/10 text-cyber-cyan-300'
                                }`}
                              >
                                {entry.casePath ? 'Case linked' : 'Vault'}
                              </span>
                              <span
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                                  t.isPastel
                                    ? 'border-purple-200/60 bg-white/80 text-purple-600'
                                    : 'border-white/10 bg-black/20 text-gray-200'
                                }`}
                              >
                                {entry.status}
                              </span>
                            </div>
                            <h4 className={`line-clamp-2 text-lg font-bold leading-6 ${t.heading}`}>{entry.title}</h4>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-[22px] border p-3 ${compactInsetSurfaceClassName}`}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className={`rounded-[18px] px-4 py-3 ${t.isPastel ? 'bg-white/85' : 'bg-black/25'}`}>
                            <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Sources</p>
                            <p className="mt-2 text-xl font-bold">{entry.sourceCount}</p>
                          </div>
                          <div className={`rounded-[18px] px-4 py-3 ${t.isPastel ? 'bg-white/85' : 'bg-black/25'}`}>
                            <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Updated</p>
                            <div className={`mt-2 flex items-center gap-2 text-sm ${mutedTextClassName}`}>
                              <Clock3 className="h-4 w-4" />
                              <span>{formatRelativeTime(entry.modified)}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`mt-3 rounded-[18px] px-4 py-3 ${t.isPastel ? 'bg-white/82' : 'bg-black/20'}`}>
                          <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Excerpt</p>
                          <p className={`mt-2 line-clamp-3 text-sm ${mutedTextClassName}`}>
                            {entry.excerpt || 'No transcript excerpt yet.'}
                          </p>
                        </div>

                        <div className={`mt-3 rounded-[18px] px-4 py-3 ${t.isPastel ? 'bg-white/82' : 'bg-black/20'}`}>
                          <div className="flex items-start gap-3">
                            <FolderOpen className={`mt-0.5 h-4 w-4 ${t.primary}`} />
                            <div>
                              <p className="text-sm font-semibold">Context</p>
                              <p className={`text-sm ${mutedTextClassName}`}>
                                {entry.caseName || 'Vault global storage'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`mt-auto rounded-[20px] border px-4 py-3 ${compactInsetSurfaceClassName}`}>
                        <div className="inline-flex items-center gap-2 text-sm font-semibold">
                          <span>Open workspace</span>
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </button>
                  </motion.div>
                </HolographicEffect>
              ))}
            </section>
          )}
        </main>
      </div>

      <DeleteTranscriptionDialog
        isOpen={!!entryPendingDelete}
        theme={theme}
        entry={entryPendingDelete}
        deleting={deleting}
        onClose={() => {
          if (!deleting) {
            setEntryPendingDelete(null);
          }
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
