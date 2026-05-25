import { LayoutGrid, Plus, Link2, Link2Off } from 'lucide-react';
import { Theme } from '../../types';
import { useMapTheme } from './mapTheme';

interface MapSidebarProps {
  theme: Theme;
  edgeStyle: 'solid' | 'dotted';
  onNewBlock: () => void;
  onToggleEdgeStyle: () => void;
  onRelayout: () => void;
  onFitView?: () => void;
}

export function MapSidebar({
  theme,
  edgeStyle,
  onNewBlock,
  onToggleEdgeStyle,
  onRelayout,
}: MapSidebarProps) {
  const t = useMapTheme(theme);

  const btn = `w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${t.card} ${t.cardHover}`;

  return (
    <aside
      className={`w-56 shrink-0 flex flex-col gap-3 p-4 border-l ${
        t.isPastel ? 'border-pink-200/30 bg-white/40' : 'border-cyber-purple-500/30 bg-gray-900/50'
      } backdrop-blur-md`}
    >
      <h3 className={`text-sm font-bold uppercase tracking-wider ${t.muted}`}>Tools</h3>

      <button type="button" onClick={onNewBlock} className={`${btn} ${t.button} border-0`}>
        <Plus className="w-5 h-5" />
        New Block
      </button>

      <button type="button" onClick={onToggleEdgeStyle} className={btn}>
        {edgeStyle === 'solid' ? (
          <Link2 className="w-5 h-5" />
        ) : (
          <Link2Off className="w-5 h-5" />
        )}
        {edgeStyle === 'solid' ? 'Solid lines' : 'Dotted lines'}
      </button>

      <button type="button" onClick={onRelayout} className={btn}>
        <LayoutGrid className="w-5 h-5" />
        Re-layout timeline
      </button>

      <p className={`text-xs mt-auto ${t.muted}`}>
        Drag blocks to adjust position. Re-layout restores chronological order.
      </p>
    </aside>
  );
}
