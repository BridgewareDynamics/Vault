import { motion } from 'framer-motion';
import { FileText, FolderOpen, Shield } from 'lucide-react';
import { Theme } from '../../types';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { HexGrid } from '../Shared/HexGrid';
import { NeuralNetwork } from '../Shared/NeuralNetwork';

interface OnboardingContentProps {
  theme?: Theme;
}

export function OnboardingContent({ theme = 'brideware-purple' }: OnboardingContentProps) {
  const isPastel = theme === 'pastel';
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
      {/* Advanced Background Effects */}
      <HexGrid theme={theme} density={30} />
      <NeuralNetwork theme={theme} nodeCount={20} />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 1.2, 
          ease: [0.25, 0.1, 0.25, 1], 
          delay: 0.3 
        }}
        className="text-center space-y-12 max-w-5xl relative z-10"
      >
        {/* Animated Logo/Icon */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ 
            duration: 1.5, 
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.4 
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
              }}
            />
            <motion.div
              className={`absolute inset-8 border-2 ${isPastel ? 'border-purple-400/50' : 'border-cyber-cyan-400/50'} rounded-full`}
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              style={{
                boxShadow: `0 0 30px ${secondaryRgba}0.6), inset 0 0 30px ${secondaryRgba}0.2)`,
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
              {/* Icon with glassmorphic effect instead of solid background */}
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
                
                {/* Icon container with subtle backdrop */}
                <motion.div
                  className={`relative p-5 rounded-2xl backdrop-blur-md ${isPastel ? 'bg-purple-200/20 border border-purple-300/30' : 'bg-purple-900/20 border border-cyber-purple-400/30'}`}
                  style={{
                    boxShadow: `0 0 30px ${primaryRgba}0.4), inset 0 0 20px ${primaryRgba}0.1)`,
                  }}
                  whileHover={{
                    scale: 1.1,
                    boxShadow: `0 0 50px ${primaryRgba}0.8), inset 0 0 30px ${primaryRgba}0.2)`,
                  }}
                >
                  <FolderOpen className={`w-20 h-20 ${isPastel ? 'text-purple-600' : 'text-white'}`} />
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
            opacity: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 },
            y: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 },
            textShadow: {
              duration: 4,
              repeat: Infinity,
              ease: [0.4, 0, 0.6, 1],
            },
          }}
        >
          Welcome to Vault
        </motion.h1>
        
        <motion.p
          className={`text-2xl md:text-3xl ${textColor} font-light mb-4`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.7 }}
        >
          A powerful research organization system
        </motion.p>

        <motion.p
          className={`text-lg ${textColorLight} max-w-2xl mx-auto`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.9 }}
        >
          Designed for students, researchers, and professionals who demand precision, security, and efficiency
        </motion.p>

        {/* Feature Cards with 3D Effect */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 1.1 }}
        >
          {/* Refined Vertical Scan Line - Constrained to cards area, going through center */}
          <motion.div
            className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 pointer-events-none hidden md:block"
            style={{
              background: `linear-gradient(
                to bottom,
                transparent 0%,
                ${primaryRgba}0.1) 20%,
                ${primaryRgba}0.4) 50%,
                ${primaryRgba}0.1) 80%,
                transparent 100%
              )`,
              boxShadow: `0 0 15px ${primaryRgba}0.5), 0 0 30px ${secondaryRgba}0.3)`,
              height: '100%',
            }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{
              opacity: [0, 0.6, 0.6, 0],
              scaleY: [0, 1, 1, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 1.8,
              ease: 'easeInOut',
              times: [0, 0.15, 0.85, 1],
            }}
          />
          {[
            { icon: FileText, title: 'PDF Extraction', description: 'Extract pages from PDF files', color: 'from-purple-600 to-cyan-600' },
            { icon: FolderOpen, title: 'Archive Management', description: 'Organize your research materials', color: 'from-purple-600 to-cyan-600' },
            { icon: Shield, title: 'Security Audit', description: 'Analyze PDF security and redactions', color: 'from-purple-600 to-cyan-600' },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="relative group"
                initial={{ opacity: 0, y: 30, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.9,
                  ease: [0.25, 0.1, 0.25, 1],
                  delay: 1.2 + index * 0.15,
                }}
                whileHover={{ 
                  y: -8,
                  scale: 1.05,
                  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                }}
                style={{ perspective: '1000px' }}
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
}
