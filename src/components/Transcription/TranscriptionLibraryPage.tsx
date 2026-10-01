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
import type { ModuleChromeProps } from '../../types/detachableModules';
import { ModuleChromeButtons } from '../Shared/ModuleChromeButtons';
import { isLightTheme } from '../../theme/themeSemantics';
import {
  getCachedTranscriptionLibrary,
  isTranscriptionLibraryCacheFresh,
  prefetchTranscriptionLibrary,
  setCachedTranscriptionLibrary,
} from '../../utils/transcriptionPrefetch';

type TranscriptionLibraryFilter = 'all' | 'global' | 'case';

interface TranscriptionLibraryPageProps extends ModuleChromeProps {
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
  hostMode,
  onPopOut,
  onReattach,
  popOutDisabled,
  isPastel: isPastelProp,
}: TranscriptionLibraryPageProps) {
  const t = useTranscriptionTheme(theme);
  const isPastel = isPastelProp ?? isLightTheme(theme);
  const toast = useToast();
  const [items, setItems] = useState<TranscriptionListEntry[]>(
    () => getCachedTranscriptionLibrary() ?? []
  );
  const [loading, setLoading] = useState(() => !getCachedTranscriptionLibrary());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TranscriptionLibraryFilter>('all');
  const [entryPendingDelete, setEntryPendingDelete] = useState<TranscriptionListEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = async (options?: { force?: boolean }) => {
    if (!window.electronAPI?.listTranscriptions) {
      setLoading(false);
      return;
    }

    if (!options?.force && isTranscriptionLibraryCacheFresh()) {
      setItems(getCachedTranscriptionLibrary() ?? []);
      setLoading(false);
      return;
    }

    if (!getCachedTranscriptionLibrary()) {
      setLoading(true);
    }

    try {
      const list = await prefetchTranscriptionLibrary({ force: options?.force });
      if (list) {
        setItems(list);
        setCachedTranscriptionLibrary(list);
      }
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'loading transcripts' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-time load on mount
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

  const confirmDelete = async () => {
    if (!entryPendingDelete || !window.electronAPI?.deleteTranscription) return;

    setDeleting(true);
    try {
      await window.electronAPI.deleteTranscription(entryPendingDelete.transcriptionFolderPath);
      toast.success('Transcript deleted');
      setEntryPendingDelete(null);
      await loadItems({ force: true });
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'deleting transcript' }));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${t.bg}`}>
      <HexGrid theme={theme} density={24} />
      <ScanLine theme={theme} speed={12} />
      <div className={`relative z-10 flex min-h-screen flex-col ${t.body}`}>
        <header className={`border-b backdrop-blur-xl ${t.headerBorder}`}>
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition-colors ${t.secondaryButton}`}
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back</span>
              </button>
              <ModuleChromeButtons
                featureLabel="Transcript"
                hostMode={hostMode}
                onPopOut={onPopOut}
                onReattach={onReattach}
                popOutDisabled={popOutDisabled}
                isPastel={isPastel}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${t.button}`}>
                <AudioLines className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>
                  Transcript Library
                </p>
                <h1 className={`text-xl font-bold md:text-2xl ${t.heading}`}>Saved Workspaces</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 md:py-10">
          <section className={`grid gap-4 rounded-[32px] border p-6 md:p-7 ${t.panel}`}>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
              <div className={`rounded-[24px] border p-4 ${t.compactInsetSurface}`}>
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
                    aria-label="Search transcripts"
                  />
                </div>
              </div>

              <div className={`rounded-[24px] border p-4 ${t.compactInsetSurface}`}>
                <p className="text-sm font-semibold">Storage scope</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['all', 'global', 'case'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                        filter === value ? t.button : t.secondaryButton
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

              <div className={`rounded-[24px] border p-4 ${t.compactInsetSurface}`}>
                <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Visible</p>
                <p className="mt-2 text-3xl font-bold">{filteredItems.length}</p>
                <p className={`mt-1 text-sm ${t.mutedText}`}>Workspace results</p>
              </div>
            </div>
          </section>

          {loading ? (
            <section className={`rounded-[30px] border p-10 text-center ${t.panel}`}>
              <p className={`text-sm uppercase tracking-[0.28em] ${t.primary}`}>Loading library</p>
              <p className={`mt-4 text-base ${t.mutedText}`}>
                Pulling saved transcript work into the command center.
              </p>
            </section>
          ) : filteredItems.length === 0 ? (
            <section className={`rounded-[32px] border p-10 md:p-14 ${t.panel}`}>
              <div className="mx-auto max-w-2xl text-center">
                <div className={`mx-auto w-fit rounded-3xl p-5 ${t.button}`}>
                  <AudioLines className="h-10 w-10 text-white" />
                </div>
                <h3 className={`mt-6 text-3xl font-bold ${t.heading}`}>Nothing matches this view yet.</h3>
                <p className={`mt-4 text-base leading-7 ${t.mutedText}`}>
                  Create a new transcript workspace or widen the current search and filter controls.
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
                    className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] border p-5 ${t.panel}`}
                  >
                    <button
                      type="button"
                      onClick={() => setEntryPendingDelete(entry)}
                        className={`absolute right-4 top-4 z-20 rounded-xl p-2 transition-opacity md:opacity-0 md:group-hover:opacity-100 ${t.dangerIconBtn}`}
                      aria-label={`Delete transcript ${entry.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenTranscription(entry.transcriptionFolderPath)}
                      className="relative z-10 flex h-full flex-col gap-4 text-left"
                    >
                      <div className={`rounded-[22px] border p-4 ${t.compactInsetSurface}`}>
                        <div className="flex items-start gap-3">
                          <div className={`rounded-2xl p-3 ${t.button}`}>
                            <AudioLines className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-2 pr-8">
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                                  entry.casePath ? t.badgeCase : t.badgeVault
                                }`}
                              >
                                {entry.casePath ? 'Case linked' : 'Vault'}
                              </span>
                              <span
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${t.eyebrowBadge}`}
                              >
                                {entry.status}
                              </span>
                            </div>
                            <h4 className={`line-clamp-2 text-lg font-bold leading-6 ${t.heading}`}>{entry.title}</h4>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-[22px] border p-3 ${t.compactInsetSurface}`}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className={`rounded-[18px] px-4 py-3 ${t.statBox}`}>
                            <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Sources</p>
                            <p className="mt-2 text-xl font-bold">{entry.sourceCount}</p>
                          </div>
                          <div className={`rounded-[18px] px-4 py-3 ${t.statBox}`}>
                            <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Updated</p>
                            <div className={`mt-2 flex items-center gap-2 text-sm ${t.mutedText}`}>
                              <Clock3 className="h-4 w-4" />
                              <span>{formatRelativeTime(entry.modified)}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`mt-3 rounded-[18px] px-4 py-3 ${t.metaBox}`}>
                          <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Excerpt</p>
                          <p className={`mt-2 line-clamp-3 text-sm ${t.mutedText}`}>
                            {entry.excerpt || 'No transcript excerpt yet.'}
                          </p>
                        </div>

                        <div className={`mt-3 rounded-[18px] px-4 py-3 ${t.metaBox}`}>
                          <div className="flex items-start gap-3">
                            <FolderOpen className={`mt-0.5 h-4 w-4 ${t.primary}`} />
                            <div>
                              <p className="text-sm font-semibold">Context</p>
                              <p className={`text-sm ${t.mutedText}`}>
                                {entry.caseName || 'Vault global storage'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`mt-auto rounded-[20px] border px-4 py-3 ${t.compactInsetSurface}`}>
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
