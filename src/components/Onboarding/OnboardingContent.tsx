import { motion } from 'framer-motion';
import { memo } from 'react';
import { FileText, FolderOpen, Shield, Map as MapIcon } from 'lucide-react';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { HexGrid } from '../Shared/HexGrid';

interface OnboardingContentProps {
  theme?: Theme;
}

export const OnboardingContent = memo(function OnboardingContent({ theme = 'brideware-purple' }: OnboardingContentProps) {
  const isPastel = isLightTheme(theme);
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
  const textColor = isPastel ? 'text-gray-800' : 'text-gray-300';
  const textColorLight = isPastel ? 'text-gray-600' : 'text-gray-400';
  const cardBg = isPastel 
    ? 'from-slate-100/90 via-pink-50/90 to-slate-100/90' 
    : 'from-gray-900/90 via-gray-800/90 to-gray-900/90';
  const borderColor = isPastel ? 'border-purple-300/20' : 'border-cyber-purple-400/20';

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 py-12 overflow-hidden">
      {/* Advanced Background Effects - Optimized counts */}
      <HexGrid theme={theme} density={20} />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.6, 
          ease: [0.25, 0.1, 0.25, 1], 
          delay: 0.2 
        }}
        className="text-center space-y-12 max-w-5xl relative z-10"
        style={{ 
          willChange: 'transform, opacity',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        {/* Animated Logo/Icon */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.3 
          }}
          style={{ 
            willChange: 'transform, opacity',
            transform: 'translate3d(0, 0, 0)',
          }}
        >
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Outer Glow Ring */}
            <motion.div
              className={`absolute inset-0 border-4 ${isPastel ? 'border-purple-300/60' : 'border-cyber-purple-400/60'} rounded-full`}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{
                boxShadow: `0 0 40px ${primaryRgba}0.6), inset 0 0 40px ${primaryRgba}0.2)`,
                willChange: 'transform',
                transform: 'translate3d(0, 0, 0)',
              }}
            />
            <motion.div
              className={`absolute inset-8 border-2 ${isPastel ? 'border-purple-400/50' : 'border-cyber-cyan-400/50'} rounded-full`}
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              style={{
                boxShadow: `0 0 30px ${secondaryRgba}0.6), inset 0 0 30px ${secondaryRgba}0.2)`,
                willChange: 'transform',
                transform: 'translate3d(0, 0, 0)',
              }}
            />
            
            {/* Pulsing Glow Background */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${primaryRgba}0.3), transparent 70%)`,
                filter: 'blur(20px)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Central Icon - Refined with transparent/ethereal background */}
            <motion.div
              className="relative z-10"
              animate={{
                y: [0, -12, 0],
                scale: [1, 1.05, 1],
                filter: [
                  `drop-shadow(0 0 20px ${primaryRgba}0.8)) drop-shadow(0 0 40px ${secondaryRgba}0.6))`,
                  `drop-shadow(0 0 30px ${primaryRgba}1)) drop-shadow(0 0 60px ${secondaryRgba}0.8))`,
                  `drop-shadow(0 0 20px ${primaryRgba}0.8)) drop-shadow(0 0 40px ${secondaryRgba}0.6))`,
                ],
              }}
              transition={{
                y: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                scale: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                filter: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            >
              {/* Stylized circular badge that keeps the fix while matching the Vault aesthetic */}
              <div className="relative">
                {/* Glow behind icon */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${isPastel ? 'from-purple-300/40 to-pink-300/40' : 'from-purple-600/40 to-cyan-600/40'} rounded-full blur-xl`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                
                {/* Keep all visible layers circular so Electron never shows a square blur surface */}
                <motion.div
                  className={`relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border ${
                    isPastel
                      ? 'border-purple-300/50 bg-white/95'
                      : 'border-cyber-purple-400/40 bg-gray-950/95'
                  }`}
                  style={{
                    boxShadow: isPastel
                      ? '0 0 28px rgba(216, 180, 254, 0.24), inset 0 1px 10px rgba(255, 255, 255, 0.55)'
                      : '0 0 26px rgba(139, 92, 246, 0.26), 0 0 42px rgba(34, 211, 238, 0.12), inset 0 1px 10px rgba(255, 255, 255, 0.08)',
                  }}
                  whileHover={{
                    scale: 1.08,
                  }}
                >
                  <div
                    className={`absolute inset-0 rounded-full ${
                      isPastel
                        ? 'bg-gradient-to-br from-white via-purple-50 to-pink-100'
                        : 'bg-gradient-to-br from-gray-900 via-purple-950 to-slate-950'
                    }`}
                  />
                  <div
                    className={`absolute inset-[0.35rem] rounded-full border ${
                      isPastel
                        ? 'border-purple-200/60'
                        : 'border-white/10'
                    }`}
                  />
                  <div
                    className={`absolute inset-[0.55rem] rounded-full ${
                      isPastel
                        ? 'bg-gradient-to-br from-white/90 via-purple-100/85 to-pink-100/90'
                        : 'bg-gradient-to-br from-purple-500/16 via-transparent to-cyan-400/14'
                    }`}
                  />
                  <FolderOpen className={`relative z-10 w-20 h-20 ${isPastel ? 'text-purple-600 drop-shadow-sm' : 'text-white drop-shadow-[0_0_14px_rgba(139,92,246,0.45)]'}`} />
                </motion.div>
              </div>
            </motion.div>
            
            {/* Floating particles around icon */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: '4px',
                  height: '4px',
                  background: `radial-gradient(circle, ${secondaryRgba}1), transparent)`,
                  boxShadow: `0 0 8px ${secondaryRgba}0.8)`,
                  left: '50%',
                  top: '50%',
                  transformOrigin: '0 0',
                }}
                animate={{
                  x: [0, Math.cos((i * Math.PI) / 4) * 60],
                  y: [0, Math.sin((i * Math.PI) / 4) * 60],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Title with Advanced Effects */}
        <motion.h1
          className={`text-6xl md:text-7xl font-bold mb-6 ${isPastel ? 'text-gray-800' : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent'} bg-[length:200%_auto] ${isPastel ? '' : 'animate-shimmer'}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            opacity: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.4 },
            y: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.4 },
          }}
          style={{ 
            willChange: 'transform, opacity',
            transform: 'translate3d(0, 0, 0)',
          }}
        >
          Welcome to Vault
        </motion.h1>
        
        <motion.p
          className={`text-2xl md:text-3xl ${textColor} font-light mb-4`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
          style={{ willChange: 'opacity' }}
        >
          A connected workspace for documents, cases, maps, and audits
        </motion.p>

        <motion.p
          className={`text-lg ${textColorLight} max-w-2xl mx-auto`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.6 }}
          style={{ willChange: 'opacity' }}
        >
          Designed for researchers, investigators, and professionals who need one place to extract, organize,
          map, and verify their work
        </motion.p>

        {/* Feature Cards with 3D Effect */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mt-16 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.7 }}
          style={{ willChange: 'opacity' }}
        >
          {[
            { icon: FileText, title: 'PDF Extraction', description: 'Turn long documents into workable pages' },
            { icon: FolderOpen, title: 'Archive Management', description: 'Keep cases and source material organized' },
            { icon: MapIcon, title: 'Research Maps', description: 'Build visual timelines for connected evidence' },
            { icon: Shield, title: 'Security Audit', description: 'Review redactions, metadata, and document risk' },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1],
                  delay: 0.8 + index * 0.1,
                }}
                whileHover={{ 
                  y: -6,
                  scale: 1.03,
                  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
                }}
                style={{ 
                  willChange: 'transform, opacity',
                  transform: 'translate3d(0, 0, 0)',
                }}
              >
                <HolographicEffect intensity={0.2} className="rounded-3xl overflow-hidden">
                  <motion.div
                    className={`flex flex-col items-center gap-4 p-8 rounded-3xl bg-gradient-to-br ${cardBg} backdrop-blur-xl border ${borderColor} relative overflow-hidden`}
                    style={{
                      boxShadow: `0 0 40px ${primaryRgba}0.3), inset 0 0 40px ${primaryRgba}0.1)`,
                      transformStyle: 'preserve-3d',
                    }}
                    whileHover={{
                      boxShadow: `0 0 60px ${primaryRgba}0.6), inset 0 0 60px ${primaryRgba}0.2)`,
                    }}
                  >
                    {/* Animated Background Gradient */}
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(circle at center, ${primaryRgba}0.2), transparent)`,
                      }}
                    />

                    <motion.div
                      className="relative z-10"
                      animate={{
                        filter: [
                          `drop-shadow(0 0 15px ${primaryRgba}0.6))`,
                          `drop-shadow(0 0 25px ${primaryRgba}0.9))`,
                          `drop-shadow(0 0 15px ${primaryRgba}0.6))`,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: index * 0.3,
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${isPastel ? 'from-purple-300 to-pink-300' : 'from-purple-600 to-cyan-600'} rounded-3xl blur-2xl opacity-40`}></div>
                      <div className={`relative p-5 bg-gradient-to-br ${isPastel ? 'from-purple-300/90 to-pink-300/90' : 'from-purple-600/90 to-cyan-600/90'} rounded-3xl border ${isPastel ? 'border-purple-300/50' : 'border-cyber-purple-400/50'}`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                    </motion.div>
                    
                    <div className="relative z-10 text-center">
                      <h3 className={`text-xl font-bold mb-2 ${isPastel ? 'text-gray-800' : 'text-white'} ${isPastel ? '' : 'bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent'}`}>
                        {isPastel ? feature.title : <span className="bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent">{feature.title}</span>}
                      </h3>
                      <p className={`text-sm ${textColorLight}`}>{feature.description}</p>
                    </div>
                  </motion.div>
                </HolographicEffect>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
});
