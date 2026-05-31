import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Search, Trash2 } from 'lucide-react';
import { NovelListEntry, Theme } from '../../types';
import { useToast } from '../Toast/ToastContext';
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

type NovelLibraryFilter = 'all' | 'global' | 'case';

interface NovelLibraryPageProps extends ModuleChromeProps {
  theme: Theme;
  onBack: () => void;
  onOpenNovel: (novelFolderPath: string) => void;
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
    setLoading(true);
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
        entry.caseName?.toLowerCase().includes(q)
      );
    });
  }, [filter, novels, query]);

  const filterCounts = useMemo(
    () => ({
      all: novels.length,
      global: novels.filter((entry) => !entry.casePath).length,
      case: novels.filter((entry) => !!entry.casePath).length,
    }),
    [novels]
  );

  const handleDelete = async (entry: NovelListEntry) => {
    if (!window.electronAPI?.deleteNovel) return;
    if (!confirm(`Delete "${entry.title}"?`)) return;
    try {
      await window.electronAPI.deleteNovel(entry.novelFolderPath);
      await loadNovels(true);
      toast.success('Novel deleted');
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'deleting novel' }));
    }
  };

  return (
    <div className={`relative min-h-screen ${t.body}`}>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={onBack} className={`flex items-center gap-2 rounded-xl px-4 py-2 ${t.badgeNeutral}`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <ModuleChromeButtons
            hostMode={hostMode}
            onPopOut={onPopOut}
            onReattach={onReattach}
            popOutDisabled={popOutDisabled}
            isPastel={isPastel}
          />
        </div>

        <h1 className={`mt-8 text-3xl font-bold ${t.heading}`}>Book Library</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          {(['all', 'global', 'case'] as NovelLibraryFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full border px-4 py-2 text-sm ${
                filter === key ? t.button : t.badgeNeutral
              }`}
            >
              {key === 'all' ? 'All books' : key === 'global' ? 'Vault Library' : 'Case linked'} (
              {filterCounts[key]})
            </button>
          ))}
        </div>
        <div className={`mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3 ${t.insetSurface}`}>
          <Search className="h-4 w-4 opacity-60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search novels..."
            className="flex-1 bg-transparent outline-none"
          />
        </div>

        {loading ? (
          <p className={`mt-8 ${t.muted}`}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p className={`mt-8 ${t.muted}`}>No novels found.</p>
        ) : (
          <div className="mt-8 grid gap-4">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${t.insetSurface}`}
              >
                <button
                  type="button"
                  className="flex flex-1 items-center gap-4 text-left"
                  onMouseEnter={() => {
                    void prefetchNovelEditorPage();
                    void prefetchNovelDocument(entry.novelFolderPath);
                  }}
                  onClick={() => onOpenNovel(entry.novelFolderPath)}
                >
                  <div className={`rounded-xl p-3 ${t.button}`}>
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{entry.title}</p>
                    <p className={`text-sm ${t.muted}`}>
                      {entry.pageCount} pages
                      {entry.caseName ? ` · ${entry.caseName}` : ' · Vault Library'}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(entry)}
                  className="rounded-xl p-2 hover:bg-red-500/20"
                  aria-label={`Delete ${entry.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
