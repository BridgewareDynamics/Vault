import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Clock3, FolderOpen, Search, Trash2 } from 'lucide-react';
import { NovelListEntry, Theme } from '../../types';
import { useToast } from '../Toast/ToastContext';
import { HexGrid } from '../Shared/HexGrid';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { ScanLine } from '../Shared/ScanLine';
import { useNovelTheme } from './novelTheme';
import type { ModuleChromeProps } from '../../types/detachableModules';
import { ModuleChromeButtons } from '../Shared/ModuleChromeButtons';
import { isLightTheme } from '../../theme/themeSemantics';
import {
  getCachedNovelLibrary,
  isNovelLibraryCacheFresh,
  prefetchNovelDocument,
  prefetchNovelEditorPage,
  prefetchNovelLibrary,
  setCachedNovelLibrary,
} from '../../utils/novelPrefetch';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { DeleteNovelDialog } from './DeleteNovelDialog';

type NovelLibraryFilter = 'all' | 'global' | 'case';

interface NovelLibraryPageProps extends ModuleChromeProps {
  theme: Theme;
  onBack: () => void;
  onOpenNovel: (novelFolderPath: string) => void;
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

export function NovelLibraryPage({
  theme,
  onBack,
  onOpenNovel,
  hostMode,
  onPopOut,
  onReattach,
  popOutDisabled,
  isPastel: isPastelProp,
}: NovelLibraryPageProps) {
  const t = useNovelTheme(theme);
  const isPastel = isPastelProp ?? isLightTheme(theme);
  const toast = useToast();
  const [novels, setNovels] = useState<NovelListEntry[]>(() => getCachedNovelLibrary() ?? []);
  const [loading, setLoading] = useState(() => !getCachedNovelLibrary());
  const [filter, setFilter] = useState<NovelLibraryFilter>('all');
  const [query, setQuery] = useState('');
  const [novelPendingDelete, setNovelPendingDelete] = useState<NovelListEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadNovels = async (force?: boolean) => {
    if (!window.electronAPI?.listNovels) {
      setLoading(false);
      return;
    }
    if (!force && isNovelLibraryCacheFresh()) {
      setNovels(getCachedNovelLibrary() ?? []);
      setLoading(false);
      return;
    }
    if (!getCachedNovelLibrary()) {
      setLoading(true);
    }
    try {
      const list = await prefetchNovelLibrary({ force });
      if (list) {
        setNovels(list);
        setCachedNovelLibrary(list);
      }
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'loading novels' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNovels();
    void prefetchNovelEditorPage();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return novels.filter((entry) => {
      if (filter === 'global' && entry.casePath) return false;
      if (filter === 'case' && !entry.casePath) return false;
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        (entry.caseName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [filter, novels, query]);

  const handleDelete = (entry: NovelListEntry) => {
    setNovelPendingDelete(entry);
  };

  const confirmDelete = async () => {
    if (!window.electronAPI?.deleteNovel || !novelPendingDelete) return;

    setDeleting(true);
    try {
      await window.electronAPI.deleteNovel(novelPendingDelete.novelFolderPath);
      setNovelPendingDelete(null);
      await loadNovels(true);
      toast.success('Novel deleted');
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'deleting novel' }));
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
                featureLabel="Novel"
                hostMode={hostMode}
                onPopOut={onPopOut}
                onReattach={onReattach}
                popOutDisabled={popOutDisabled}
                isPastel={isPastel}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${t.button}`}>
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>Novel Library</p>
                <h1 className={`text-xl font-bold md:text-2xl ${t.heading}`}>Saved Books</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 md:py-10">
          <section className={`grid gap-4 rounded-[32px] border p-6 md:p-7 ${t.panel}`}>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
              <div className={`rounded-[24px] border p-4 ${t.compactInsetSurface}`}>
                <label htmlFor="novel-library-search" className="text-sm font-semibold">
                  Search books
                </label>
                <div className="mt-3 flex items-center gap-3 rounded-[20px] border px-4 py-3">
                  <Search className={`h-5 w-5 ${t.primary}`} />
                  <input
                    id="novel-library-search"
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by title or case name"
                    className="w-full bg-transparent text-sm outline-none"
                    aria-label="Search novels"
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
                      {value === 'all' ? 'All' : value === 'global' ? 'Vault' : 'Case linked'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-[24px] border p-4 ${t.compactInsetSurface}`}>
                <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Visible</p>
                <p className="mt-2 text-3xl font-bold">{filtered.length}</p>
                <p className={`mt-1 text-sm ${t.mutedText}`}>Book results</p>
              </div>
            </div>
          </section>

          {loading ? (
            <section className={`rounded-[30px] border p-10 text-center ${t.panel}`}>
              <p className={`text-sm uppercase tracking-[0.28em] ${t.primary}`}>Loading library</p>
              <p className={`mt-4 text-base ${t.mutedText}`}>
                Pulling saved novels into the book library.
              </p>
            </section>
          ) : filtered.length === 0 ? (
            <section className={`rounded-[32px] border p-10 md:p-14 ${t.panel}`}>
              <div className="mx-auto max-w-2xl text-center">
                <div className={`mx-auto w-fit rounded-3xl p-5 ${t.button}`}>
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
                <h3 className={`mt-6 text-3xl font-bold ${t.heading}`}>Nothing matches this view yet.</h3>
                <p className={`mt-4 text-base leading-7 ${t.mutedText}`}>
                  Create a new book from the Novel home screen or widen your search and filter controls.
                </p>
              </div>
            </section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((entry, index) => (
                <HolographicEffect
                  key={entry.id}
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
                      onClick={() => handleDelete(entry)}
                      className={`absolute right-4 top-4 z-20 rounded-xl p-2 transition-opacity md:opacity-0 md:group-hover:opacity-100 ${t.dangerIconBtn}`}
                      aria-label={`Delete novel ${entry.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenNovel(entry.novelFolderPath)}
                      onMouseEnter={() => {
                        void prefetchNovelEditorPage();
                        void prefetchNovelDocument(entry.novelFolderPath);
                      }}
                      className="relative z-10 flex h-full flex-col gap-4 text-left"
                    >
                      <div className={`rounded-[22px] border p-4 ${t.compactInsetSurface}`}>
                        <div className="flex items-start gap-3">
                          <div className={`rounded-2xl p-3 ${t.button}`}>
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-2 pr-8">
                            <span
                              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                                entry.casePath ? t.badgeCase : t.badgeVault
                              }`}
                            >
                              {entry.casePath ? 'Case linked' : 'Vault'}
                            </span>
                            <h4 className={`line-clamp-2 text-lg font-bold leading-6 ${t.heading}`}>
                              {entry.title}
                            </h4>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-[22px] border p-3 ${t.compactInsetSurface}`}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className={`rounded-[18px] px-4 py-3 ${t.statBox}`}>
                            <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Pages</p>
                            <p className="mt-2 text-xl font-bold">{entry.pageCount}</p>
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
                          <span>Open book</span>
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

      <DeleteNovelDialog
        isOpen={!!novelPendingDelete}
        theme={theme}
        entry={novelPendingDelete}
        deleting={deleting}
        onClose={() => {
          if (!deleting) {
            setNovelPendingDelete(null);
          }
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
