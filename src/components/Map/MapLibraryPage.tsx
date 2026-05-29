import { type MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  FolderOpen,
  Map as MapIcon,
  Search,
  Trash2,
} from 'lucide-react';
import { MapListEntry, Theme } from '../../types';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { HexGrid } from '../Shared/HexGrid';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { ScanLine } from '../Shared/ScanLine';
import { useToast } from '../Toast/ToastContext';
import { useMapTheme } from './mapTheme';
import { DeleteMapDialog } from './DeleteMapDialog';
import {
  getCachedMapLibrary,
  isMapLibraryCacheFresh,
  prefetchMapDocument,
  prefetchMapEditorPage,
  prefetchMapLibrary,
  setCachedMapLibrary,
} from '../../utils/mapPrefetch';

type MapLibraryFilter = 'all' | 'global' | 'case';
type MapSortMode = 'recent' | 'name' | 'blocks';

interface MapLibraryPageProps {
  theme: Theme;
  onBack: () => void;
  onOpenMap: (mapFolderPath: string) => void;
}

const sortOptions: Array<{ value: MapSortMode; label: string }> = [
  { value: 'recent', label: 'Most recent' },
  { value: 'name', label: 'Title A-Z' },
  { value: 'blocks', label: 'Most blocks' },
];

function formatMapDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

function formatRelativeTime(timestamp: number) {
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Updated just now';
  if (diffHours < 24) return `Updated ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `Updated ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return `Updated ${formatMapDate(timestamp)}`;
}

function sortMaps(maps: MapListEntry[], sortMode: MapSortMode) {
  const sorted = [...maps];

  switch (sortMode) {
    case 'name':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'blocks':
      return sorted.sort((a, b) => b.blockCount - a.blockCount || b.modified - a.modified);
    case 'recent':
    default:
      return sorted.sort((a, b) => b.modified - a.modified);
  }
}

export function MapLibraryPage({ theme, onBack, onOpenMap }: MapLibraryPageProps) {
  const t = useMapTheme(theme);
  const toast = useToast();
  const [maps, setMaps] = useState<MapListEntry[]>(() => getCachedMapLibrary() ?? []);
  const [loading, setLoading] = useState(() => !getCachedMapLibrary());
  const [filter, setFilter] = useState<MapLibraryFilter>('all');
  const [sortMode, setSortMode] = useState<MapSortMode>('recent');
  const [query, setQuery] = useState('');
  const [mapPendingDelete, setMapPendingDelete] = useState<MapListEntry | null>(null);

  const warmMapOpen = useCallback((mapFolderPath: string) => {
    void prefetchMapEditorPage();
    void prefetchMapDocument(mapFolderPath);
  }, []);

  const loadMaps = async (options?: { force?: boolean }) => {
    if (!window.electronAPI?.listMaps) {
      setLoading(false);
      return;
    }

    if (!options?.force && isMapLibraryCacheFresh()) {
      setMaps(getCachedMapLibrary() ?? []);
      setLoading(false);
      return;
    }

    if (!getCachedMapLibrary()) {
      setLoading(true);
    }

    try {
      const list = await prefetchMapLibrary({ force: options?.force });
      if (list) {
        setMaps(list);
        setCachedMapLibrary(list);
      }
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'loading maps' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMaps();
    void prefetchMapEditorPage();
  }, []);

  const totals = useMemo(
    () => ({
      total: maps.length,
      global: maps.filter((entry) => !entry.casePath).length,
      caseLinked: maps.filter((entry) => !!entry.casePath).length,
      blocks: maps.reduce((sum, entry) => sum + entry.blockCount, 0),
    }),
    [maps],
  );

  const filteredMaps = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = maps.filter((entry) => {
      if (filter === 'global' && entry.casePath) return false;
      if (filter === 'case' && !entry.casePath) return false;

      if (!normalizedQuery) return true;

      const searchable = `${entry.title} ${entry.caseName ?? ''}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });

    return sortMaps(result, sortMode);
  }, [filter, maps, query, sortMode]);

  const featuredMap = useMemo(() => {
    if (filteredMaps.length === 0) return null;
    return [...filteredMaps].sort((a, b) => b.modified - a.modified)[0];
  }, [filteredMaps]);

  const displayFeaturedMap = filteredMaps.length > 1 ? featuredMap : null;

  const collectionMaps = useMemo(() => {
    if (!displayFeaturedMap) return filteredMaps;
    return filteredMaps.filter((entry) => entry.mapFolderPath !== displayFeaturedMap.mapFolderPath);
  }, [displayFeaturedMap, filteredMaps]);

  const visibleBlocks = useMemo(
    () => filteredMaps.reduce((sum, entry) => sum + entry.blockCount, 0),
    [filteredMaps],
  );

  const filterCounts: Record<MapLibraryFilter, number> = {
    all: totals.total,
    global: totals.global,
    case: totals.caseLinked,
  };

  const activeScopeLabel =
    filter === 'all' ? 'All maps' : filter === 'global' ? 'Vault only' : 'Case linked';
  const searchStatusLabel = query.trim() ? `Search: "${query.trim()}"` : 'Search not applied';
  const activityStatusLabel = featuredMap ? formatRelativeTime(featuredMap.modified) : 'No recent map activity';

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>, entry: MapListEntry) => {
    event.stopPropagation();
    setMapPendingDelete(entry);
  };

  const handleConfirmDelete = async () => {
    if (!window.electronAPI?.deleteMap || !mapPendingDelete) return;

    try {
      await window.electronAPI.deleteMap(mapPendingDelete.mapFolderPath);
      toast.success('Map deleted');
      setMapPendingDelete(null);
      await loadMaps({ force: true });
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'deleting map' }));
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${t.bg}`}>
      <HexGrid theme={theme} density={24} />
      <ScanLine theme={theme} speed={12} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute left-0 top-20 h-80 w-80 rounded-full blur-3xl ${t.ambientGlowPrimary}`} />
        <div className={`absolute bottom-0 right-8 h-80 w-80 rounded-full blur-3xl ${t.ambientGlowSecondary}`} />
      </div>

      <div className={`relative z-10 flex min-h-screen flex-col ${t.body}`}>
        <header className={`border-b backdrop-blur-xl ${t.headerBorder}`}>
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition-colors ${t.secondaryButton}`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${t.button}`}>
                <MapIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>Map Workspace</p>
                <h1 className={`text-xl font-bold md:text-2xl ${t.heading}`}>Map Library</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 md:py-10">
          <section className="grid items-start gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <HolographicEffect className="self-start rounded-[32px]" intensity={t.isPastel ? 0.18 : 0.28}>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                className={`overflow-hidden rounded-[32px] border p-8 md:p-10 ${t.panel}`}
              >
                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-6">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em]">
                      <FolderOpen className={`h-4 w-4 ${t.primary}`} />
                      Advanced library dashboard
                    </div>

                    <div className="space-y-4">
                      <h2 className={`max-w-3xl text-4xl font-bold leading-tight md:text-5xl ${t.heroHeading}`}>
                        Your saved maps now feel curated instead of buried.
                      </h2>
                      <p className={`max-w-2xl text-base leading-7 md:text-lg ${t.mutedText}`}>
                        This layout is organized like a command center: active filters and collection status up top,
                        recent work pinned for fast reopen, and the rest of the map library packed into a denser,
                        cleaner grid that uses the space more strategically.
                      </p>
                    </div>

                    <div className={`rounded-[24px] border p-4 ${t.compactInsetSurface}`}>
                      <div className="flex flex-wrap gap-3">
                        {[
                          activeScopeLabel,
                          searchStatusLabel,
                          activityStatusLabel,
                        ].map((item) => (
                          <span
                            key={item}
                            className={`rounded-full border px-4 py-2 text-sm font-medium ${t.featurePill}`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {[
                      { label: 'Visible maps', value: filteredMaps.length, detail: 'Current filtered view' },
                      { label: 'Visible blocks', value: visibleBlocks, detail: 'Across displayed maps' },
                      { label: 'Vault maps', value: totals.global, detail: 'Saved outside cases' },
                      { label: 'Case-linked', value: totals.caseLinked, detail: 'Attached to investigations' },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-[24px] border p-4 ${t.compactInsetSurface}`}>
                        <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>{item.label}</p>
                        <p className="mt-3 text-3xl font-bold">{item.value}</p>
                        <p className={`mt-2 text-sm ${t.mutedText}`}>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </HolographicEffect>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
              className={`grid gap-4 overflow-hidden rounded-[32px] border p-6 md:p-7 ${t.panel}`}
            >
              <div className={`rounded-[26px] border p-5 ${t.insetSurface}`}>
                <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>Command center</p>
                <h3 className={`mt-3 text-2xl font-bold ${t.heading}`}>Find, filter, and sort with less wasted space.</h3>
                <p className={`mt-3 text-sm leading-6 ${t.mutedText}`}>
                  Adjust the library view from one compact control surface, then use the recent-work panel and dense
                  collection grid below to move faster.
                </p>
              </div>

              <div className={`rounded-[26px] border p-4 ${t.insetSurface}`}>
                <div className="space-y-2">
                  <label htmlFor="map-library-search" className="text-sm font-semibold">
                    Search maps
                  </label>
                  <div className={`flex items-center gap-3 rounded-[22px] border px-4 py-3 ${t.compactInsetSurface}`}>
                    <Search className={`h-5 w-5 ${t.primary}`} />
                    <input
                      id="map-library-search"
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search by title or case name"
                      className={`w-full bg-transparent text-sm outline-none ${t.inputPlaceholder}`}
                      aria-label="Search maps"
                    />
                  </div>
                </div>
              </div>

              <div className={`rounded-[26px] border p-4 ${t.insetSurface}`}>
                <p className="text-sm font-semibold">Storage scope</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['all', 'global', 'case'] as const).map((value) => {
                    const label = value === 'all' ? 'All maps' : value === 'global' ? 'Vault' : 'Case linked';
                    const isSelected = filter === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFilter(value)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                          isSelected ? `${t.button} shadow-lg` : `${t.secondaryButton}`
                        }`}
                      >
                        {label} ({filterCounts[value]})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`rounded-[26px] border p-4 ${t.insetSurface}`}>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span className={t.mutedText}>Sort by</span>
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as MapSortMode)}
                    className={`min-h-[48px] rounded-[22px] border px-4 py-3 outline-none ${t.compactInsetSurface}`}
                    aria-label="Sort maps"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </motion.div>
          </section>

          {loading ? (
            <section className={`rounded-[30px] border p-10 text-center ${t.panel}`}>
              <p className={`text-sm uppercase tracking-[0.28em] ${t.primary}`}>Loading library</p>
              <p className={`mt-4 text-base ${t.mutedText}`}>Pulling your saved maps into the redesigned view.</p>
            </section>
          ) : filteredMaps.length === 0 ? (
            <section className={`rounded-[32px] border p-10 md:p-14 ${t.panel}`}>
              <div className="mx-auto max-w-2xl text-center">
                <div className={`mx-auto w-fit rounded-3xl p-5 ${t.button}`}>
                  <MapIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className={`mt-6 text-3xl font-bold ${t.heading}`}>Nothing matches this view yet.</h3>
                <p className={`mt-4 text-base leading-7 ${t.mutedText}`}>
                  {maps.length === 0
                    ? 'Create your first map to start building research timelines inside the Vault.'
                    : 'Try a different search or switch filters to reveal other saved maps.'}
                </p>
              </div>
            </section>
          ) : (
            <>
              <section
                className={`grid items-start gap-6 ${
                  displayFeaturedMap ? 'xl:grid-cols-[360px_minmax(0,1fr)]' : ''
                }`}
              >
                {displayFeaturedMap && (
                  <HolographicEffect className="self-start rounded-[32px]" intensity={t.isPastel ? 0.16 : 0.26}>
                    <motion.div
                      whileHover={{ y: -3, scale: 1.005 }}
                      className={`group relative w-full overflow-hidden rounded-[32px] border p-6 ${t.panel}`}
                    >
                      <button
                        type="button"
                        onClick={(event) => void handleDelete(event, displayFeaturedMap)}
                        className={`absolute right-4 top-4 z-20 rounded-xl p-2 transition-opacity md:opacity-0 md:group-hover:opacity-100 ${t.dangerIconBtn}`}
                        aria-label={`Delete map ${displayFeaturedMap.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onPointerEnter={() => warmMapOpen(displayFeaturedMap.mapFolderPath)}
                        onFocus={() => warmMapOpen(displayFeaturedMap.mapFolderPath)}
                        onClick={() => onOpenMap(displayFeaturedMap.mapFolderPath)}
                        className="flex h-full w-full flex-col gap-5 text-left"
                      >
                      <div className="flex h-full flex-col gap-5">
                        <div className={`rounded-[24px] border p-4 ${t.compactInsetSurface}`}>
                          <div className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em]">
                            <Clock3 className={`h-4 w-4 ${t.primary}`} />
                            Most recently updated
                          </div>

                          <div className="mt-4 space-y-3">
                            <h3 className={`text-3xl font-bold ${t.heading}`}>{displayFeaturedMap.title}</h3>
                            <p className={`text-sm leading-7 md:text-base ${t.mutedText}`}>
                              {displayFeaturedMap.caseName
                                ? `Linked to ${displayFeaturedMap.caseName} and ready to reopen exactly where you left off.`
                                : 'Stored directly in the Vault for quick access from anywhere in your workflow.'}
                            </p>
                          </div>
                        </div>

                        <div className={`rounded-[24px] border p-4 ${t.compactInsetSurface}`}>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <div className={`rounded-[18px] px-4 py-3 ${t.statBox}`}>
                              <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Blocks</p>
                              <p className="mt-2 text-2xl font-bold">{displayFeaturedMap.blockCount}</p>
                            </div>
                            <div className={`rounded-[18px] px-4 py-3 ${t.statBox}`}>
                              <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Updated</p>
                              <p className={`mt-2 text-sm font-medium ${t.mutedText}`}>
                                {formatMapDate(displayFeaturedMap.modified)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`rounded-[24px] border p-4 ${t.compactInsetSurface}`}>
                          <div className="flex flex-wrap gap-3">
                            <span
                              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                                displayFeaturedMap.casePath ? t.badgeCase : t.badgeVault
                              }`}
                            >
                              {displayFeaturedMap.casePath ? 'Case linked' : 'Vault map'}
                            </span>
                            <span
                              className={`rounded-full border px-4 py-2 text-sm font-medium ${t.badgeNeutral}`}
                            >
                              {formatRelativeTime(displayFeaturedMap.modified)}
                            </span>
                          </div>

                          <div className="mt-4 flex items-start gap-3">
                            <FolderOpen className={`mt-0.5 h-5 w-5 ${t.primary}`} />
                            <div>
                              <p className="text-sm font-semibold">Storage context</p>
                              <p className={`text-sm ${t.mutedText}`}>
                                {displayFeaturedMap.caseName || 'Vault global storage'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`mt-auto rounded-[20px] border px-4 py-3 ${t.compactInsetSurface}`}>
                          <div className="inline-flex items-center gap-2 text-sm font-semibold">
                            <span>Open recent map</span>
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                      </button>
                    </motion.div>
                  </HolographicEffect>
                )}

                <section className={`overflow-hidden rounded-[32px] border p-6 md:p-7 ${t.panel}`}>
                  <div className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                      <div>
                        <p className={`text-xs uppercase tracking-[0.28em] ${t.primary}`}>Browse collection</p>
                        <h3 className={`mt-2 text-2xl font-bold ${t.heading}`}>
                          {collectionMaps.length > 0
                            ? `${collectionMaps.length}${displayFeaturedMap ? ' more' : ''} map${collectionMaps.length === 1 ? '' : 's'}`
                            : 'Only one map in view'}
                        </h3>
                        <p className={`mt-2 text-sm ${t.mutedText}`}>
                          Compact cards below prioritize title, scale, context, and time so more maps fit on-screen
                          without losing clarity.
                        </p>
                      </div>

                      <div className={`rounded-[22px] border p-3 ${t.compactInsetSurface}`}>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Visible maps</p>
                            <p className="mt-2 text-xl font-bold">{collectionMaps.length}</p>
                          </div>
                          <div>
                            <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Visible blocks</p>
                            <p className="mt-2 text-xl font-bold">
                              {collectionMaps.reduce((sum, entry) => sum + entry.blockCount, 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {collectionMaps.length > 0 ? (
                      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))] xl:grid-cols-[repeat(auto-fill,minmax(min(100%,24rem),1fr))]">
                        {collectionMaps.map((entry, index) => (
                          <HolographicEffect
                            key={entry.mapFolderPath}
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
                                onClick={(event) => void handleDelete(event, entry)}
                                className={`absolute right-4 top-4 z-20 rounded-xl p-2 transition-opacity md:opacity-0 md:group-hover:opacity-100 ${t.dangerIconBtn}`}
                                aria-label={`Delete map ${entry.title}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onPointerEnter={() => warmMapOpen(entry.mapFolderPath)}
                                onFocus={() => warmMapOpen(entry.mapFolderPath)}
                                onClick={() => onOpenMap(entry.mapFolderPath)}
                                className="relative z-10 flex h-full flex-col gap-4 text-left"
                              >
                                <div className={`rounded-[22px] border p-4 ${t.compactInsetSurface}`}>
                                  <div className="flex items-start gap-3">
                                    <div className={`rounded-2xl p-3 ${t.button}`}>
                                      <MapIcon className="h-5 w-5 text-white" />
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
                                      </div>
                                      <h4 className={`line-clamp-2 text-lg font-bold leading-6 ${t.heading}`}>{entry.title}</h4>
                                    </div>
                                  </div>
                                </div>

                                <div className={`rounded-[22px] border p-3 ${t.compactInsetSurface}`}>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className={`rounded-[18px] px-4 py-3 ${t.statBox}`}>
                                      <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Blocks</p>
                                      <p className="mt-2 text-xl font-bold">{entry.blockCount}</p>
                                    </div>
                                    <div className={`rounded-[18px] px-4 py-3 ${t.statBox}`}>
                                      <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Updated</p>
                                      <p className={`mt-2 text-sm ${t.mutedText}`}>{formatMapDate(entry.modified)}</p>
                                    </div>
                                  </div>

                                  <div className={`mt-3 rounded-[18px] px-4 py-3 ${t.metaBox}`}>
                                    <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>Context</p>
                                    <p className={`mt-2 line-clamp-2 text-sm ${t.mutedText}`}>
                                      {entry.caseName || 'Vault global storage'}
                                    </p>
                                  </div>
                                </div>

                                <div className={`mt-auto rounded-[20px] border px-4 py-3 ${t.compactInsetSurface}`}>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className={`text-sm ${t.mutedText}`}>{formatRelativeTime(entry.modified)}</span>
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold">
                                      <span>Open map</span>
                                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </motion.div>
                          </HolographicEffect>
                        ))}
                      </div>
                    ) : (
                      <div className={`rounded-[24px] border p-5 ${t.insetSurface}`}>
                        <p className={`text-sm ${t.mutedText}`}>
                          The most recent map is the only map in this filtered view.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </section>
            </>
          )}
        </main>
      </div>

      <DeleteMapDialog
        isOpen={!!mapPendingDelete}
        theme={theme}
        mapTitle={mapPendingDelete?.title}
        onClose={() => setMapPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
