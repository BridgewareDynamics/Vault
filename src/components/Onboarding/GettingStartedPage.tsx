import { motion } from 'framer-motion';
import { memo } from 'react';
<<<<<<< Updated upstream
import { FileText, FolderOpen, Shield } from 'lucide-react';
=======
import { FileText, FolderOpen, Shield, Map as MapIcon } from 'lucide-react';
>>>>>>> Stashed changes
import { Theme } from '../../types';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { HexGrid } from '../Shared/HexGrid';

interface GettingStartedPageProps {
  theme?: Theme;
}

export const GettingStartedPage = memo(function GettingStartedPage({ theme = 'brideware-purple' }: GettingStartedPageProps) {
  const isPastel = theme === 'pastel';
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
  const cardBg = isPastel 
    ? 'from-slate-100/90 via-pink-50/90 to-slate-100/90' 
    : 'from-gray-900/90 via-gray-800/90 to-gray-900/90';

  const steps = [
    {
      icon: FileText,
      title: 'Extract PDF Pages',
      description: 'Start by extracting pages from your PDF files',
      color: 'from-purple-600 to-cyan-600',
    },
    {
      icon: FolderOpen,
      title: 'Organize in Archive',
      description: 'Create case folders and organize your materials',
      color: 'from-purple-600 to-cyan-600',
    },
    {
<<<<<<< Updated upstream
      icon: Shield,
      title: 'Audit & Secure',
      description: 'Run security audits on your documents',
=======
      icon: MapIcon,
      title: 'Build a Map',
      description: 'Turn scattered evidence into a visual timeline with dated blocks and notes',
      color: 'from-purple-600 to-cyan-600',
    },
    {
      icon: Shield,
      title: 'Audit & Secure',
      description: 'Review security, redactions, and document risk before you share or file',
>>>>>>> Stashed changes
      color: 'from-purple-600 to-cyan-600',
    },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 py-12 overflow-hidden">
      <HexGrid theme={theme} density={18} />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        className="text-center space-y-16 max-w-6xl w-full relative z-10"
        style={{ 
          willChange: 'transform, opacity',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        {/* Header */}
        <div>
          <motion.h2
            className={`text-5xl md:text-6xl font-bold mb-6 ${isPastel ? 'text-gray-800' : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent'} bg-[length:200%_auto] ${isPastel ? '' : 'animate-shimmer'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              textShadow: [
                `0 0 30px ${primaryRgba}0.5), 0 0 60px ${secondaryRgba}0.3)`,
                `0 0 40px ${primaryRgba}0.8), 0 0 80px ${secondaryRgba}0.5)`,
                `0 0 30px ${primaryRgba}0.5), 0 0 60px ${secondaryRgba}0.3)`,
              ],
            }}
            transition={{
              opacity: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 },
              y: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 },
            }}
            style={{ 
              willChange: 'transform, opacity',
              transform: 'translate3d(0, 0, 0)',
            }}
          >
            Getting Started
          </motion.h2>
          <motion.p
            className={`text-xl ${isPastel ? 'text-gray-600' : 'text-gray-300'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
            style={{ willChange: 'opacity' }}
          >
<<<<<<< Updated upstream
            Follow these simple steps to begin your journey
=======
            Follow these simple steps to build your first research workspace
>>>>>>> Stashed changes
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <motion.div
            className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 hidden md:block"
            style={{
              background: `linear-gradient(to bottom, ${primaryRgba}0.3), ${secondaryRgba}0.5), ${primaryRgba}0.3))`,
              boxShadow: `0 0 20px ${primaryRgba}0.5)`,
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.5, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          />

          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: 0.4 + index * 0.15,
                  }}
                  className={`flex flex-col md:flex-row items-center gap-8 ${isEven ? 'md:flex-row-reverse' : ''}`}
                  style={{ 
                    willChange: 'transform, opacity',
                    transform: 'translate3d(0, 0, 0)',
                  }}
                >
                  {/* Step Number & Icon */}
                  <div className="relative flex-shrink-0">
                    <HolographicEffect intensity={0.3} className="rounded-full overflow-hidden">
                      <motion.div
                        className="relative w-24 h-24 flex items-center justify-center"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.3,
                          ease: 'easeInOut',
                        }}
                      >
                        {/* Outer Ring */}
                        <motion.div
                          className={`absolute inset-0 border-4 ${isPastel ? 'border-purple-300/60' : 'border-cyber-purple-400/60'} rounded-full`}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 15, repeat: Infinity, ease: 'linear', delay: index * 0.5 }}
                          style={{
                            boxShadow: `0 0 30px ${primaryRgba}0.6), inset 0 0 30px ${primaryRgba}0.2)`,
                          }}
                        />
                        
                        {/* Step Number */}
                        <motion.div
                          className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-br ${isPastel ? 'from-purple-300 to-pink-300' : 'from-purple-600 to-cyan-600'} flex items-center justify-center text-white font-bold text-2xl shadow-2xl border ${isPastel ? 'border-purple-300/50' : 'border-cyber-purple-400/50'}`}
                          style={{
                            boxShadow: `0 0 30px ${primaryRgba}0.8), inset 0 0 30px ${primaryRgba}0.2)`,
                          }}
                        >
                          {index + 1}
                        </motion.div>

                        {/* Icon Overlay */}
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center z-20"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 + index * 0.2 }}
                        >
                          <Icon className="w-8 h-8 text-white/80" />
                        </motion.div>
                      </motion.div>
                    </HolographicEffect>
                  </div>

                  {/* Step Content */}
                  <motion.div
                    className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'} text-center md:text-left`}
                    whileHover={{ x: isEven ? -5 : 5, transition: { duration: 0.2 } }}
                  >
                    <HolographicEffect intensity={0.15} className="rounded-3xl overflow-hidden">
                      <motion.div
                        className={`p-8 rounded-3xl bg-gradient-to-br ${cardBg} backdrop-blur-xl border ${isPastel ? 'border-purple-300/20' : 'border-cyber-purple-400/20'}`}
                        style={{
                          boxShadow: `0 0 30px ${primaryRgba}0.3), inset 0 0 30px ${primaryRgba}0.1)`,
                        }}
                        whileHover={{
                          boxShadow: `0 0 50px ${primaryRgba}0.6), inset 0 0 50px ${primaryRgba}0.2)`,
                        }}
                      >
                        <h3 className={`text-2xl font-bold mb-3 ${isPastel ? 'text-gray-800' : 'text-white'} ${isPastel ? '' : 'bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent'}`}>
                          {isPastel ? step.title : <span className="bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent">{step.title}</span>}
                        </h3>
                        <p className={`text-base ${isPastel ? 'text-gray-600' : 'text-gray-300'}`}>{step.description}</p>
                      </motion.div>
                    </HolographicEffect>
                  </motion.div>

                </motion.div>
              );
            })}
          </div>
        </div>

      </motion.div>
    </div>
  );
});
