import { motion } from 'framer-motion';
import { memo } from 'react';
import { CalendarDays, FolderOpen, Link2, Map as MapIcon, Paperclip } from 'lucide-react';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { HexGrid } from '../Shared/HexGrid';

interface MapWorkspacePageProps {
  theme?: Theme;
}

const mapIntegrations = [
  {
    icon: FolderOpen,
    title: 'Lives in your cases',
    description: 'Keep maps beside archive materials so timelines stay tied to the work they explain.',
  },
  {
    icon: Paperclip,
    title: 'Attach your sources',
    description: 'Connect supporting documents, notes, and evidence directly to the blocks you create.',
  },
  {
    icon: CalendarDays,
    title: 'Build chronology fast',
    description: 'Lay out events, milestones, and relationships visually when linear folders are not enough.',
  },
];

const workflowSteps = ['Extract', 'Archive', 'Map', 'Audit'];

export const MapWorkspacePage = memo(function MapWorkspacePage({
  theme = 'brideware-purple',
}: MapWorkspacePageProps) {
  const isPastel = isLightTheme(theme);
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
  const cardBg = isPastel
    ? 'from-slate-100/90 via-pink-50/90 to-slate-100/90'
    : 'from-gray-900/90 via-gray-800/90 to-gray-900/90';

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 py-12 overflow-hidden">
      <HexGrid theme={theme} density={18} />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        className="text-center space-y-14 max-w-7xl w-full relative z-10"
        style={{
          willChange: 'transform, opacity',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        <div className="space-y-5">
          <motion.h2
            className={`text-5xl md:text-6xl font-bold ${isPastel ? 'text-gray-800' : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent'} bg-[length:200%_auto] ${isPastel ? '' : 'animate-shimmer'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
          >
            Maps Belong in Vault
          </motion.h2>
          <motion.p
            className={`text-xl max-w-4xl mx-auto ${isPastel ? 'text-gray-600' : 'text-gray-300'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
          >
            The Map feature is part of the same research workflow as your PDFs, archive cases, and audits. Use it
            when a folder is not enough and the story needs a visual timeline.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1], delay: 0.35 }}
            className="relative group"
          >
            <HolographicEffect intensity={0.2} className="rounded-3xl overflow-hidden h-full">
              <motion.div
                className={`h-full rounded-3xl bg-gradient-to-br ${cardBg} backdrop-blur-xl border ${isPastel ? 'border-emerald-300/25' : 'border-emerald-400/20'} p-10 overflow-hidden relative`}
                style={{
                  boxShadow: `0 0 40px ${primaryRgba}0.3), inset 0 0 40px ${secondaryRgba}0.08)`,
                }}
                whileHover={{
                  boxShadow: `0 0 60px ${primaryRgba}0.45), inset 0 0 60px ${secondaryRgba}0.12)`,
                }}
              >
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at center, rgba(16, 185, 129, 0.16), transparent 70%)`,
                  }}
                />

                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className="space-y-6 text-left">
                    <motion.div
                      className="relative w-fit"
                      animate={{
                        filter: [
                          'drop-shadow(0 0 16px rgba(16, 185, 129, 0.45))',
                          'drop-shadow(0 0 26px rgba(45, 212, 191, 0.65))',
                          'drop-shadow(0 0 16px rgba(16, 185, 129, 0.45))',
                        ],
                      }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl blur-2xl opacity-50"></div>
                      <div className={`relative p-6 rounded-3xl border ${isPastel ? 'border-emerald-300/40 bg-gradient-to-br from-emerald-200/90 to-teal-200/90' : 'border-emerald-300/30 bg-gradient-to-br from-emerald-500/90 to-cyan-500/90'}`}>
                        <MapIcon className={`w-14 h-14 ${isPastel ? 'text-emerald-700' : 'text-white'}`} />
                      </div>
                    </motion.div>

                    <div className="space-y-4">
                      <h3 className={`text-3xl font-bold ${isPastel ? 'text-gray-800' : 'text-white'}`}>
                        Visual timelines for real casework
                      </h3>
                      <p className={`${isPastel ? 'text-gray-600' : 'text-gray-300'} text-base leading-7`}>
                        Build research maps with dated blocks, notes, and attachments so you can see chronology,
                        clusters, and gaps across a case. Maps are not separate from Vault. They extend the same
                        workspace.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {['Dated blocks', 'Case-linked saves', 'Attachments & notes', 'Chronology at a glance'].map(
                        (item, index) => (
                          <motion.span
                            key={item}
                            className={`text-sm px-4 py-2 rounded-full border ${isPastel ? 'bg-emerald-100 text-emerald-700 border-emerald-300/40' : 'bg-emerald-400/10 text-emerald-300 border-emerald-300/20'}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.55 + index * 0.08 }}
                          >
                            {item}
                          </motion.span>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className={`text-sm uppercase tracking-[0.3em] ${isPastel ? 'text-gray-500' : 'text-cyber-cyan-400'}`}>
                      Connected Workflow
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {workflowSteps.map((step, index) => (
                        <div key={step} className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-semibold border ${isPastel ? 'bg-white/80 text-gray-700 border-purple-300/30' : 'bg-white/5 text-white border-cyber-purple-400/25'}`}
                          >
                            {step}
                          </span>
                          {index < workflowSteps.length - 1 && (
                            <Link2 className={`w-4 h-4 ${isPastel ? 'text-gray-400' : 'text-cyber-cyan-400/80'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </HolographicEffect>
          </motion.div>

          <div className="grid grid-cols-1 gap-6">
            {mapIntegrations.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.96, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: 0.45 + index * 0.1,
                  }}
                  className="relative group"
                >
                  <HolographicEffect intensity={0.15} className="rounded-3xl overflow-hidden">
                    <motion.div
                      className={`p-7 rounded-3xl bg-gradient-to-br ${cardBg} backdrop-blur-xl border ${isPastel ? 'border-purple-300/20' : 'border-cyber-purple-400/20'} relative overflow-hidden`}
                      style={{
                        boxShadow: `0 0 28px ${primaryRgba}0.22), inset 0 0 24px ${primaryRgba}0.08)`,
                      }}
                      whileHover={{
                        y: -4,
                        boxShadow: `0 0 42px ${primaryRgba}0.32), inset 0 0 32px ${primaryRgba}0.12)`,
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(circle at center, ${secondaryRgba}0.15), transparent)`,
                        }}
                      />

                      <div className="relative z-10 flex items-start gap-5 text-left">
                        <div
                          className={`p-4 rounded-2xl ${isPastel ? 'bg-gradient-to-br from-purple-200/90 to-pink-200/90 border border-purple-300/40' : 'bg-gradient-to-br from-purple-600/90 to-cyan-600/90 border border-cyber-purple-400/40'}`}
                        >
                          <Icon className={`w-7 h-7 ${isPastel ? 'text-purple-700' : 'text-white'}`} />
                        </div>
                        <div className="space-y-2">
                          <h3 className={`text-xl font-bold ${isPastel ? 'text-gray-800' : 'text-white'}`}>
                            {item.title}
                          </h3>
                          <p className={`text-sm leading-6 ${isPastel ? 'text-gray-600' : 'text-gray-300'}`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </HolographicEffect>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
});
