import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Home, Library, Plus } from 'lucide-react';
import { Theme } from '../../types';
import { HexGrid } from '../Shared/HexGrid';
import { useNovelTheme } from './novelTheme';
import type { ModuleChromeProps } from '../../types/detachableModules';
import { ModuleChromeButtons } from '../Shared/ModuleChromeButtons';
import { isLightTheme } from '../../theme/themeSemantics';

interface NovelLandingPageProps extends ModuleChromeProps {
  theme: Theme;
  onBack: () => void;
  onNewNovel: () => void;
  onOpenLibrary: () => void;
}

export function NovelLandingPage({
  theme,
  onBack,
  onNewNovel,
  onOpenLibrary,
  hostMode,
  onPopOut,
  onReattach,
  popOutDisabled,
  isPastel: isPastelProp,
}: NovelLandingPageProps) {
  const t = useNovelTheme(theme);
  const isPastel = isPastelProp ?? isLightTheme(theme);

  const cards = [
    {
      title: 'Create Novel',
      description: 'Start a new book with cover, spreads, and Vault-linked storage.',
      cta: 'Create Novel',
      onClick: onNewNovel,
      icon: Plus,
    },
    {
      title: 'Book Library',
      description: 'Open saved novels from the Vault library or linked cases.',
      cta: 'Open Library',
      onClick: onOpenLibrary,
      icon: Library,
    },
  ];

  return (
    <div className={`relative min-h-screen overflow-hidden ${t.body}`}>
      {!isPastel && <HexGrid />}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={onBack} className={`flex items-center gap-2 rounded-xl px-4 py-2 ${t.badgeNeutral}`}>
            <Home className="h-4 w-4" />
            Home
          </button>
          <ModuleChromeButtons
            hostMode={hostMode}
            onPopOut={onPopOut}
            onReattach={onReattach}
            popOutDisabled={popOutDisabled}
            isPastel={isPastel}
          />
        </div>

        <div className="mt-12 text-center">
          <div className={`mx-auto mb-6 inline-flex rounded-3xl border p-4 ${t.dialogIconBox}`}>
            <BookOpen className="h-10 w-10" />
          </div>
          <h1 className={`text-4xl font-bold ${t.heading}`}>Novel::</h1>
          <p className={`mt-3 text-lg ${t.muted}`}>Book creation for case narratives</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.title}
                type="button"
                whileHover={{ y: -4 }}
                onClick={card.onClick}
                className={`rounded-[28px] border p-8 text-left ${t.insetSurface}`}
              >
                <div className={`inline-flex rounded-2xl p-3 ${t.button}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h2 className={`mt-6 text-2xl font-bold ${t.heading}`}>{card.title}</h2>
                <p className={`mt-3 text-sm leading-6 ${t.muted}`}>{card.description}</p>
                <div className={`mt-6 flex items-center gap-2 font-semibold ${t.primary}`}>
                  {card.cta}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
