import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { ActionToolbar } from './ActionToolbar';
import { FileText, Shield, FolderOpen, Zap, Sparkles } from 'lucide-react';

// Get base URL for assets (works in both dev and production)
const getAssetPath = (path: string) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

interface WelcomeScreenProps {
  onSelectFile: () => void;
  onOpenArchive: () => void;
  onOpenSecurityChecker: () => void;
}

// Generate particles for background
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    return {
      id: i,
      size: Math.random() * 3 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 20,
      duration: Math.random() * 10 + 15,
    };
  });
};

// Generate light rays
const generateLightRays = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i,
    delay: i * 0.5,
  }));
};

export function WelcomeScreen({ onSelectFile, onOpenArchive, onOpenSecurityChecker }: WelcomeScreenProps) {
  const particles = useMemo(() => generateParticles(50), []);
  const lightRays = useMemo(() => generateLightRays(8), []);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/50 to-gray-950 overflow-hidden">
      {/* Animated Background Grid */}
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ 
          duration: 1,
          ease: [0.25, 0.1, 0.25, 1],
          delay: 0.15,
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)',
          }}
        />
      </motion.div>

      {/* Animated Particles Background */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-cyber-cyan-400"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              boxShadow: `0 0 ${particle.size * 4}px rgba(34, 211, 238, 0.6)`,
            }}
            initial={{ opacity: 0 }}
            animate={{
              y: [0, -80, 0],
              x: [0, Math.sin(particle.id) * 30, 0],
              opacity: [0, 0.3, 0.7, 0.3],
              scale: [1, 1.3, 1],
            }}
            transition={{
              opacity: {
                duration: 1.2,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 0.3 + (particle.delay * 0.1),
                times: [0, 0.3, 0.7, 1],
              },
              y: {
                duration: particle.duration,
                repeat: Infinity,
                delay: 1.2 + particle.delay,
                ease: [0.4, 0, 0.6, 1],
              },
              x: {
                duration: particle.duration,
                repeat: Infinity,
                delay: 1.2 + particle.delay,
                ease: [0.4, 0, 0.6, 1],
              },
              scale: {
                duration: particle.duration,
                repeat: Infinity,
                delay: 1.2 + particle.delay,
                ease: [0.4, 0, 0.6, 1],
              },
            }}
          />
        ))}
      </div>

      {/* Light Rays from Center */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {lightRays.map((ray) => (
          <motion.div
            key={ray.id}
            className="absolute top-1/2 left-1/2 w-1 h-1/2 origin-top"
            style={{
              transform: `rotate(${ray.angle}deg)`,
              transformOrigin: 'top center',
              background: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.3), transparent)',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
            }}
            initial={{ opacity: 0, scaleY: 0.3 }}
            animate={{
              opacity: [0, 0.2, 0.5, 0.2],
              scaleY: [0.3, 0.6, 1, 0.6],
            }}
            transition={{
              opacity: {
                duration: 1,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 0.4 + (ray.delay * 0.1),
                times: [0, 0.2, 0.5, 1],
                repeat: Infinity,
                repeatDelay: 0.5,
              },
              scaleY: {
                duration: 5,
                repeat: Infinity,
                delay: 1.4 + ray.delay,
                ease: [0.4, 0, 0.6, 1],
              },
            }}
          />
        ))}
      </div>

      {/* Mouse Follow Glow */}
      <motion.div
        className="absolute w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          filter: 'blur(60px)',
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          scale: [1, 1.15, 1],
        }}
        transition={{
          opacity: {
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.5,
          },
          scale: {
            duration: 3,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
            delay: 1.3,
          },
        }}
      />

      {/* Horizontal Beam Line - Animated beam through center of all buttons, limited to outer button edges */}
      <motion.div
        className="absolute pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to right, transparent 0%, rgba(139, 92, 246, 0.6) 20%, rgba(139, 92, 246, 0.8) 50%, rgba(139, 92, 246, 0.6) 80%, transparent 100%)',
          height: '2px',
          top: 'calc(50% + 180px)', // Positioned to go through center of button cards
          left: '50%',
          width: 'calc(min(100% - 4rem, 80rem) - 2rem)', // Match button container width minus some padding to align with button edges
          maxWidth: 'calc(80rem - 2rem)',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.9), 0 0 20px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
        }}
        initial={{ 
          opacity: 0, 
          scaleX: 0,
          filter: 'blur(10px)',
          x: '-50%',
          y: '-50%',
        }}
        animate={{ 
          opacity: 1, 
          scaleX: 1,
          filter: 'blur(0px)',
          x: '-50%',
          y: '-50%',
        }}
        transition={{ 
          duration: 0.8,
          ease: [0.25, 0.1, 0.25, 1],
          delay: 0.65, // Appears just before cards for continuity
        }}
      />


      {/* Enhanced Header */}
      <motion.div 
        className="relative z-10 w-full px-8 pt-8 pb-6 border-b border-cyber-purple-400/20 bg-gradient-to-r from-gray-900/80 via-purple-900/30 to-gray-900/80 backdrop-blur-2xl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.9,
          ease: [0.25, 0.1, 0.25, 1], // Smooth, natural easing
          delay: 0.1,
        }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-6">
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                boxShadow: [
                  '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(34, 211, 238, 0.3)',
                  '0 0 30px rgba(139, 92, 246, 0.8), 0 0 60px rgba(34, 211, 238, 0.5)',
                  '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(34, 211, 238, 0.3)',
                ],
              }}
              transition={{
                opacity: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 },
                scale: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 },
                boxShadow: {
                  duration: 4,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1],
                },
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-2xl opacity-60"></div>
              <div className="relative p-4 bg-gradient-to-br from-purple-600/90 to-cyan-600/90 rounded-2xl shadow-2xl border border-cyber-purple-400/50">
                <FolderOpen className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 0.9,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 0.2,
              }}
            >
              <motion.h1
                className="text-5xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  textShadow: [
                    '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(34, 211, 238, 0.3)',
                    '0 0 30px rgba(139, 92, 246, 0.8), 0 0 60px rgba(34, 211, 238, 0.5)',
                    '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(34, 211, 238, 0.3)',
                  ],
                }}
                transition={{
                  opacity: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.25 },
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
                className="text-base text-gray-300 mt-1 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ 
                  duration: 0.8,
                  ease: [0.25, 0.1, 0.25, 1],
                  delay: 0.35,
                }}
              >
                A Research Organization System
              </motion.p>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              duration: 0.9,
              ease: [0.25, 0.1, 0.25, 1],
              delay: 0.25,
            }}
          >
            <ActionToolbar hideWordEditorButton={true} />
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.2,
          }}
          className="text-center space-y-16 max-w-7xl w-full"
        >
          {/* Enhanced Floating Logo */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 1,
              ease: [0.25, 0.1, 0.25, 1],
              delay: 0.35,
            }}
            className="flex justify-center mb-8"
          >
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer Glow Rings */}
              <motion.div
                className="absolute inset-0 border-4 border-cyber-purple-400/40 rounded-full"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  rotate: 360,
                }}
              transition={{ 
                opacity: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.45 },
                scale: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.45 },
                rotate: { duration: 30, repeat: Infinity, ease: "linear", delay: 1.4 },
              }}
                style={{
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.6), inset 0 0 30px rgba(139, 92, 246, 0.2)',
                }}
              />
              <motion.div
                className="absolute inset-8 border-2 border-cyber-cyan-400/50 rounded-full"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  rotate: -360,
                }}
              transition={{ 
                opacity: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 },
                scale: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 },
                rotate: { duration: 24, repeat: Infinity, ease: "linear", delay: 1.45 },
              }}
                style={{
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.6), inset 0 0 20px rgba(34, 211, 238, 0.2)',
                }}
              />
              
              {/* Pulsing Glow Effects */}
              <motion.div
                className="absolute inset-0 bg-gradient-purple blur-3xl rounded-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.25, 1],
                }}
                transition={{
                  opacity: {
                    duration: 1.2,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: 0.55,
                  },
                  scale: {
                    duration: 5,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.6, 1],
                    delay: 1.5,
                  },
                }}
                style={{
                  filter: 'drop-shadow(0 0 40px rgba(139, 92, 246, 0.8))',
                }}
              />
              
              <motion.div
                className="absolute inset-0 bg-cyber-cyan-400/40 blur-2xl rounded-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1.05, 1.3, 1.05],
                }}
                transition={{
                  opacity: {
                    duration: 1.2,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: 0.6,
                  },
                  scale: {
                    duration: 6,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.6, 1],
                    delay: 2,
                  },
                }}
              />

              {/* Floating Vault Icon */}
              <motion.img
                src={getAssetPath('vault-icon.png')}
                alt="Vault"
                className="w-52 h-52 relative z-10"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -12, 0],
                  filter: [
                    'drop-shadow(0 0 20px rgba(139, 92, 246, 0.8)) drop-shadow(0 0 40px rgba(34, 211, 238, 0.6))',
                    'drop-shadow(0 0 30px rgba(139, 92, 246, 1)) drop-shadow(0 0 60px rgba(34, 211, 238, 0.8))',
                    'drop-shadow(0 0 20px rgba(139, 92, 246, 0.8)) drop-shadow(0 0 40px rgba(34, 211, 238, 0.6))',
                  ],
                }}
                transition={{
                  opacity: { 
                    duration: 1.1,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: 0.55,
                  },
                  scale: { 
                    duration: 1.1,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: 0.55,
                  },
                  y: {
                    duration: 5,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.6, 1],
                    delay: 1.5,
                  },
                  filter: {
                    duration: 4,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.6, 1],
                    delay: 0.95,
                  },
                }}
              />
              
              {/* Enhanced Sparkle Particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: '4px',
                    height: '4px',
                    top: `${15 + (i * 7)}%`,
                    left: `${15 + (i * 7)}%`,
                    background: 'radial-gradient(circle, rgba(34, 211, 238, 1), transparent)',
                    boxShadow: '0 0 10px rgba(34, 211, 238, 0.8), 0 0 20px rgba(34, 211, 238, 0.4)',
                  }}
                  animate={{
                    scale: [0, 1.3, 0],
                    opacity: [0, 0.9, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.25,
                    ease: [0.4, 0, 0.6, 1],
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Enhanced Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* PDF to PNG Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.9,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 0.7,
              }}
              className="relative group"
            >
              {/* Transparent Beam Border - Matching horizontal beam style */}
              <div
                className="absolute -inset-[2px] pointer-events-none z-0 rounded-3xl"
                style={{
                  background: 'linear-gradient(to right, transparent 0%, rgba(139, 92, 246, 0.6) 20%, rgba(139, 92, 246, 0.8) 50%, rgba(139, 92, 246, 0.6) 80%, transparent 100%)',
                  padding: '2px',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.9), 0 0 20px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
                }}
              />
              {/* Animated Border Wrapper */}
              <motion.div
                className="rounded-3xl p-[3px]"
                style={{
                  background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.9), rgba(34, 211, 238, 0.9), rgba(139, 92, 246, 0.9))',
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <motion.button
                  whileHover={{ 
                    scale: 1.04, 
                    y: -4,
                    transition: { 
                      duration: 0.2, 
                      ease: [0.4, 0, 0.2, 1] // Smooth material design easing
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSelectFile}
                  className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200 z-10"
                  style={{
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.3), inset 0 0 30px rgba(139, 92, 246, 0.1)',
                  }}
                >
                {/* Enhanced Glow on Hover */}
                <motion.div 
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ 
                    opacity: 1,
                    transition: { duration: 0.2 }
                  }}
                  style={{
                    background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                    boxShadow: '0 0 40px rgba(139, 92, 246, 0.6), 0 0 60px rgba(34, 211, 238, 0.4)',
                  }}
                />
                {/* Holographic Overlay */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />

                {/* Card Content */}
                <div className="relative z-10 p-10 flex flex-col items-center gap-6">
                  <motion.div
                    className="relative"
                    animate={{
                      filter: [
                        'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
                        'drop-shadow(0 0 25px rgba(139, 92, 246, 0.9))',
                        'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-3xl blur-2xl opacity-60"></div>
                    <motion.div 
                      className="relative p-6 bg-gradient-to-br from-purple-600/90 to-cyan-600/90 rounded-3xl shadow-2xl border border-cyber-purple-400/50"
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [0, -2, 2, -2, 2, 0],
                        transition: { duration: 0.3, ease: "easeOut" }
                      }}
                    >
                      <FileText className="w-12 h-12 text-white" />
                    </motion.div>
                  </motion.div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent">
                      PDF to PNG
                    </h3>
                    <p className="text-sm text-gray-300">Extract pages from PDF files</p>
                  </div>
                  <motion.div
                    className="flex items-center gap-3 text-white font-semibold text-lg"
                    whileHover={{ scale: 1.1 }}
                  >
                    <Sparkles className="w-5 h-5 text-cyber-cyan-400" />
                    <span>Select file</span>
                  </motion.div>
                </div>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* The Vault Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.9,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 0.75,
              }}
              className="relative group"
            >
              {/* Transparent Beam Border - Matching horizontal beam style */}
              <div
                className="absolute -inset-[2px] pointer-events-none z-0 rounded-3xl"
                style={{
                  background: 'linear-gradient(to right, transparent 0%, rgba(139, 92, 246, 0.6) 20%, rgba(139, 92, 246, 0.8) 50%, rgba(139, 92, 246, 0.6) 80%, transparent 100%)',
                  padding: '2px',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.9), 0 0 20px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
                }}
              />
              {/* Animated Border Wrapper */}
              <motion.div
                className="rounded-3xl p-[3px]"
                style={{
                  background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.9), rgba(34, 211, 238, 0.9), rgba(139, 92, 246, 0.9))',
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <motion.button
                  whileHover={{ 
                    scale: 1.04, 
                    y: -4,
                    transition: { 
                      duration: 0.2, 
                      ease: [0.4, 0, 0.2, 1] // Smooth material design easing
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenArchive}
                  className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200 z-10"
                  style={{
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.3), inset 0 0 30px rgba(139, 92, 246, 0.1)',
                  }}
                >
                {/* Enhanced Glow on Hover */}
                <motion.div 
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ 
                    opacity: 1,
                    transition: { duration: 0.2 }
                  }}
                  style={{
                    background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                    boxShadow: '0 0 40px rgba(139, 92, 246, 0.6), 0 0 60px rgba(34, 211, 238, 0.4)',
                  }}
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
                <div className="relative z-10 p-10 flex flex-col items-center gap-6">
                  <motion.div
                    className="relative"
                    animate={{
                      filter: [
                        'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
                        'drop-shadow(0 0 25px rgba(139, 92, 246, 0.9))',
                        'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-3xl blur-2xl opacity-60"></div>
                    <motion.div 
                      className="relative p-6 bg-gradient-to-br from-purple-600/90 to-cyan-600/90 rounded-3xl shadow-2xl border border-cyber-purple-400/50"
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [0, -2, 2, -2, 2, 0],
                        transition: { duration: 0.3, ease: "easeOut" }
                      }}
                    >
                      <FolderOpen className="w-12 h-12 text-white" />
                    </motion.div>
                  </motion.div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent">
                      The Vault
                    </h3>
                    <p className="text-sm text-gray-300">Access your case archive</p>
                  </div>
                  <motion.div
                    className="flex items-center gap-3 text-white font-semibold text-lg"
                    whileHover={{ scale: 1.1 }}
                  >
                    <Zap className="w-5 h-5 text-cyber-cyan-400" />
                    <span>Open Archive</span>
                  </motion.div>
                </div>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* PDF Audit Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.9,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 0.8,
              }}
              className="relative group"
            >
              {/* Transparent Beam Border - Matching horizontal beam style */}
              <div
                className="absolute -inset-[2px] pointer-events-none z-0 rounded-3xl"
                style={{
                  background: 'linear-gradient(to right, transparent 0%, rgba(139, 92, 246, 0.6) 20%, rgba(139, 92, 246, 0.8) 50%, rgba(139, 92, 246, 0.6) 80%, transparent 100%)',
                  padding: '2px',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.9), 0 0 20px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
                }}
              />
              {/* Animated Border Wrapper */}
              <motion.div
                className="rounded-3xl p-[3px]"
                style={{
                  background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.9), rgba(34, 211, 238, 0.9), rgba(139, 92, 246, 0.9))',
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <motion.button
                  whileHover={{ 
                    scale: 1.04, 
                    y: -4,
                    transition: { 
                      duration: 0.2, 
                      ease: [0.4, 0, 0.2, 1] // Smooth material design easing
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenSecurityChecker}
                  className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200"
                  style={{
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.3), inset 0 0 30px rgba(139, 92, 246, 0.1)',
                  }}
                >
                {/* Enhanced Glow on Hover */}
                <motion.div 
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ 
                    opacity: 1,
                    transition: { duration: 0.2 }
                  }}
                  style={{
                    background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                    boxShadow: '0 0 40px rgba(139, 92, 246, 0.6), 0 0 60px rgba(34, 211, 238, 0.4)',
                  }}
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
                <div className="relative z-10 p-10 flex flex-col items-center gap-6">
                  <motion.div
                    className="relative"
                    animate={{
                      filter: [
                        'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
                        'drop-shadow(0 0 25px rgba(139, 92, 246, 0.9))',
                        'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-3xl blur-2xl opacity-60"></div>
                    <motion.div 
                      className="relative p-6 bg-gradient-to-br from-purple-600/90 to-cyan-600/90 rounded-3xl shadow-2xl border border-cyber-purple-400/50"
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [0, -2, 2, -2, 2, 0],
                        transition: { duration: 0.3, ease: "easeOut" }
                      }}
                    >
                      <Shield className="w-12 h-12 text-white" />
                    </motion.div>
                  </motion.div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent">
                      PDF Audit
                    </h3>
                    <p className="text-sm text-gray-300">Security & redaction analysis</p>
                  </div>
                  <motion.div
                    className="flex items-center gap-3 text-white font-semibold text-lg"
                    whileHover={{ scale: 1.1 }}
                  >
                    <Shield className="w-5 h-5 text-cyber-cyan-400" />
                    <span>Run Audit</span>
                  </motion.div>
                </div>
              </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
