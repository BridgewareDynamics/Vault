import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  FolderOpen,
  Layers3,
  Map as MapIcon,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Theme } from '../../types';
import { useMapTheme } from './mapTheme';

interface NewMapNameDialogProps {
  isOpen: boolean;
  theme: Theme;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

interface NamePrompt {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
}

const namePrompts: NamePrompt[] = [
  {
    id: 'incident-timeline',
    title: 'Incident Timeline',
    subtitle: 'Chronology reconstruction',
    description: 'Use for event-by-event sequencing, witness statements, and evidence aligned to a timeline.',
    icon: CalendarDays,
  },
  {
    id: 'case-chronology',
    title: 'Case Chronology',
    subtitle: 'Investigation backbone',
    description: 'Best when you need a durable working map for a case that will keep growing over time.',
    icon: FolderOpen,
  },
  {
    id: 'research-overview',
    title: 'Research Overview',
    subtitle: 'High-level working board',
    description: 'Start broader when you need to cluster themes, open questions, and major milestones first.',
    icon: Layers3,
  },
  {
    id: 'evidence-flow',
    title: 'Evidence Flow',
    subtitle: 'Source-to-conclusion path',
    description: 'Ideal for tracing how documents, notes, and attachments support the story you are building.',
    icon: ArrowRight,
  },
];

function buildMapSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled-map';
}

export function NewMapNameDialog({
  isOpen,
  theme,
  onClose,
  onConfirm,
}: NewMapNameDialogProps) {
  const t = useMapTheme(theme);
  const inputRef = useRef<HTMLInputElement>(null);
  const openedRef = useRef(false);
  const [selectedPromptId, setSelectedPromptId] = useState(namePrompts[0].id);
  const [mapName, setMapName] = useState('Untitled Map');
  const normalizedName = mapName.trim() || 'Untitled Map';
  const mapSlug = buildMapSlug(normalizedName);
  const activePrompt = namePrompts.find((prompt) => prompt.id === selectedPromptId) ?? namePrompts[0];
  const nameWordCount = normalizedName.split(/\s+/).filter(Boolean).length;
  const titleStatus =
    normalizedName === 'Untitled Map'
      ? 'Starter title'
      : nameWordCount >= 3
        ? 'Detailed working title'
        : 'Focused working title';
  const insetSurfaceClassName = t.isPastel
    ? 'border-purple-200/35 bg-white/78'
    : 'border-white/10 bg-black/20';
  const compactInsetSurfaceClassName = t.isPastel
    ? 'border-purple-200/28 bg-white/72'
    : 'border-white/10 bg-white/5';

  useEffect(() => {
    if (!isOpen) {
      openedRef.current = false;
      return;
    }

    if (!openedRef.current && mapName !== 'Untitled Map') {
      setMapName('Untitled Map');
    }

    if (!openedRef.current) {
      setSelectedPromptId(namePrompts[0].id);
    }

    openedRef.current = true;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[85] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-map-dialog-title"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-5xl overflow-hidden rounded-[32px] border shadow-2xl ${
            t.isPastel
              ? 'border-pink-200/60 bg-gradient-to-br from-white via-pink-50/90 to-slate-50'
              : 'border-cyber-purple-500/40 bg-gradient-to-br from-gray-900 via-gray-950 to-black'
          }`}
        >
          <motion.form
            className="max-h-[90vh] overflow-y-auto"
            onSubmit={(event) => {
              event.preventDefault();
              onConfirm(normalizedName);
            }}
          >
            <div
              className={`flex items-start justify-between gap-4 border-b px-6 py-5 md:px-8 md:py-6 ${
                t.isPastel ? 'border-pink-200/30 bg-pink-50/30' : 'border-white/10 bg-black/20'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-2xl border p-3 ${
                    t.isPastel
                      ? 'border-pink-200/50 bg-white text-purple-500'
                      : 'border-cyber-purple-500/30 bg-cyber-purple-500/10 text-cyber-cyan-400'
                  }`}
                >
                  <MapIcon className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <MapIcon className={`h-4 w-4 ${t.primary}`} />
                    <p className={`text-xs font-semibold uppercase tracking-[0.26em] ${t.primary}`}>New map</p>
                  </div>
                  <h2 id="new-map-dialog-title" className="mt-2 text-2xl font-bold">
                    Launch a premium chronology workspace
                  </h2>
                  <p className={`mt-2 text-sm ${t.muted}`}>
                    Start with a stronger title, a clearer direction, and a cleaner handoff into the map editor so the
                    workspace feels intentional from the first click.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`rounded-xl p-2 transition-colors ${
                  t.isPastel ? 'hover:bg-white/90' : 'hover:bg-white/10'
                }`}
                aria-label="Close new map dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative overflow-hidden px-6 py-6 md:px-8 md:py-8">
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className={`absolute -left-10 top-8 h-40 w-40 rounded-full blur-3xl ${
                    t.isPastel ? 'bg-fuchsia-200/40' : 'bg-cyber-purple-500/20'
                  }`}
                />
                <div
                  className={`absolute bottom-0 right-0 h-48 w-48 rounded-full blur-3xl ${
                    t.isPastel ? 'bg-cyan-200/35' : 'bg-cyber-cyan-500/15'
                  }`}
                />
              </div>

              <div className="relative z-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <div className={`rounded-[30px] border p-6 ${insetSurfaceClassName}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${t.primary}`}>Title setup</p>
                      <h3 className="mt-2 text-2xl font-bold">Name the workspace before the editor opens.</h3>
                    </div>
                    <div className={`rounded-2xl p-3 ${t.button}`}>
                      <MapIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="new-map-name" className="block text-sm font-semibold">
                      Map name
                    </label>
                    <input
                      ref={inputRef}
                      id="new-map-name"
                      type="text"
                      value={mapName}
                      onChange={(event) => setMapName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          onClose();
                        }
                      }}
                      placeholder="Untitled Map"
                      className={`w-full rounded-[22px] border px-5 py-4 text-lg font-semibold outline-none transition-colors ${
                        t.isPastel
                          ? 'border-pink-200/50 bg-white/85 text-gray-800 focus:border-purple-300'
                          : 'border-cyber-purple-500/40 bg-gray-900/90 text-white focus:border-cyber-cyan-400'
                      }`}
                      aria-label="New map name"
                    />
                    <p className={`text-sm ${t.muted}`}>
                      You can rename it later anytime from the title at the top of the map editor.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Words', value: nameWordCount.toString(), detail: 'Title length' },
                      { label: 'Slug', value: mapSlug, detail: 'Folder-friendly hint' },
                      { label: 'Status', value: titleStatus, detail: 'Naming quality' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-[22px] border p-4 ${compactInsetSurfaceClassName}`}
                      >
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${t.primary}`}>
                          {item.label}
                        </p>
                        <p className="mt-3 truncate text-base font-bold">{item.value}</p>
                        <p className={`mt-2 text-xs ${t.muted}`}>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-[30px] border p-6 ${insetSurfaceClassName}`}>
                  <div className="flex items-center gap-2">
                    <Wand2 className={`h-4 w-4 ${t.primary}`} />
                    <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${t.primary}`}>Naming prompts</p>
                  </div>
                  <h3 className="mt-3 text-xl font-bold">Choose a direction, then refine the title.</h3>
                  <p className={`mt-2 text-sm leading-6 ${t.muted}`}>
                    These prompts only seed the title and preview. The map still opens as a blank workspace for your
                    own chronology.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {namePrompts.map((prompt) => {
                      const Icon = prompt.icon;
                      const isSelected = prompt.id === selectedPromptId;

                      return (
                        <button
                          key={prompt.id}
                          type="button"
                          onClick={() => {
                            setSelectedPromptId(prompt.id);
                            setMapName(prompt.title);
                            requestAnimationFrame(() => inputRef.current?.focus());
                          }}
                          aria-label={prompt.title}
                          aria-pressed={isSelected}
                          className={`rounded-[24px] border p-4 text-left transition-all ${
                            isSelected
                              ? `${t.button} shadow-lg`
                              : `${
                                  t.isPastel
                                    ? 'border-purple-200/50 bg-white/82 text-gray-800 hover:border-purple-300 hover:bg-white'
                                    : 'border-white/10 bg-white/5 text-white hover:border-cyber-cyan-400/45 hover:bg-white/10'
                                }`
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`rounded-2xl p-3 ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : t.isPastel
                                    ? 'bg-purple-50 text-purple-500'
                                    : 'bg-cyber-purple-500/15 text-cyber-cyan-400'
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold">{prompt.title}</h4>
                              <p className={`mt-1 text-xs uppercase tracking-[0.2em] ${isSelected ? 'text-white/80' : t.primary}`}>
                                {prompt.subtitle}
                              </p>
                              <p className={`mt-2 text-sm leading-6 ${isSelected ? 'text-white/90' : t.muted}`}>
                                {prompt.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`rounded-[30px] border p-6 ${insetSurfaceClassName}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${t.primary}`}>What opens first</p>
                  <div className="mt-4 grid gap-3 text-sm">
                    {[
                      'A blank map canvas with your chosen title already in place.',
                      'A Vault-linked workspace ready for blocks, notes, and attachments.',
                      'An editor session optimized for immediate chronology building.',
                    ].map((item) => (
                      <div
                        key={item}
                        className={`flex items-center gap-3 rounded-[20px] px-4 py-3 ${compactInsetSurfaceClassName}`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            t.isPastel ? 'bg-purple-400' : 'bg-cyber-cyan-400'
                          }`}
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className={`overflow-hidden rounded-[32px] border p-6 md:p-7 ${
                  t.isPastel
                    ? 'border-pink-200/40 bg-gradient-to-br from-pink-50/80 via-white to-purple-50/70'
                    : 'border-cyber-purple-500/25 bg-gradient-to-br from-cyber-purple-500/10 via-black/20 to-cyber-cyan-500/10'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.26em] ${t.primary}`}>Live preview</p>
                      <h3 className="mt-3 text-2xl font-bold">Creation dashboard</h3>
                      <p className={`mt-2 text-sm leading-6 ${t.muted}`}>
                        A polished summary of what the new workspace will feel like the moment it opens.
                      </p>
                    </div>
                    <div className={`rounded-2xl p-3 ${t.button}`}>
                      <Layers3 className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <div
                    className={`rounded-[28px] border p-6 ${compactInsetSurfaceClassName}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`rounded-3xl p-4 ${t.button}`}>
                        <MapIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs uppercase tracking-[0.24em] ${t.primary}`}>Workspace title</p>
                        <h3 className="mt-2 break-words text-3xl font-bold leading-tight">{normalizedName}</h3>
                        <p className={`mt-2 text-sm ${t.muted}`}>Folder hint: `{mapSlug}`</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {[
                        activePrompt.subtitle,
                        titleStatus,
                        'Blank timeline canvas',
                      ].map((chip) => (
                        <span
                          key={chip}
                          className={`rounded-full border px-4 py-2 text-sm font-medium ${
                            t.isPastel
                              ? 'border-purple-200/60 bg-white/85 text-gray-700'
                              : 'border-white/10 bg-black/20 text-gray-200'
                          }`}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-[28px] border p-5 ${compactInsetSurfaceClassName}`}>
                    <p className="text-sm font-semibold">Launch profile</p>
                    <div className="mt-4 grid gap-3">
                      {[
                        {
                          label: 'Save target',
                          value: 'Vault linked',
                          detail: 'Connected to your archive workspace',
                          icon: FolderOpen,
                        },
                        {
                          label: 'Opening mode',
                          value: 'Blank editor',
                          detail: 'Ready for the first map block',
                          icon: Layers3,
                        },
                        {
                          label: 'Launch speed',
                          value: 'Immediate',
                          detail: 'Create now, refine as you work',
                          icon: Clock3,
                        },
                      ].map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.label}
                            className={`rounded-[22px] border p-4 ${
                              t.isPastel ? 'border-purple-200/35 bg-white/82' : 'border-white/10 bg-black/20'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`shrink-0 rounded-2xl p-3 ${t.button}`}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs uppercase tracking-[0.22em] ${t.primary}`}>{item.label}</p>
                                <p className="mt-2 break-words text-lg font-bold leading-6">{item.value}</p>
                                <p className={`mt-2 text-sm leading-6 ${t.muted}`}>{item.detail}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`rounded-[28px] border p-5 ${compactInsetSurfaceClassName}`}>
                    <p className="text-sm font-semibold">Best for this map concept</p>
                    <div className="mt-4 grid gap-3">
                      {[
                        activePrompt.description,
                        'Maps you expect to revisit from the library and keep refining over time.',
                        'Research sessions where chronology, notes, and supporting sources need to stay connected.',
                      ].map((item) => (
                        <div
                          key={item}
                          className={`flex items-start gap-3 rounded-[20px] px-4 py-3 ${
                            t.isPastel ? 'bg-white/80' : 'bg-black/20'
                          }`}
                        >
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full ${
                              t.isPastel ? 'bg-purple-400' : 'bg-cyber-cyan-400'
                            }`}
                          />
                          <span className={`text-sm leading-6 ${t.muted}`}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div
              className={`flex flex-col gap-3 border-t px-6 py-4 md:flex-row md:px-8 ${
                t.isPastel ? 'border-pink-200/30 bg-pink-50/20' : 'border-white/10 bg-black/20'
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 rounded-2xl border px-4 py-3 font-medium ${t.card}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold ${t.button}`}
              >
                Create Map
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
