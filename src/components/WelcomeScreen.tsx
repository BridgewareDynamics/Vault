import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { ActionToolbar } from './ActionToolbar';
<<<<<<< Updated upstream
import { FileText, Shield, FolderOpen, Zap, Sparkles } from 'lucide-react';
import { useSettingsContext } from '../utils/settingsContext';
import { Theme } from '../types';
=======
<<<<<<< Updated upstream
=======
import { FileText, Shield, FolderOpen, Zap, Map as MapIcon, type LucideIcon } from 'lucide-react';
import { useSettingsContext } from '../utils/settingsContext';
import { Theme } from '../types';
>>>>>>> Stashed changes
>>>>>>> Stashed changes

// Get base URL for assets (works in both dev and production)
const getAssetPath = (path: string) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

interface WelcomeScreenProps {
  onSelectFile: () => void;
  onOpenArchive: () => void;
  onOpenSecurityChecker: () => void;
<<<<<<< Updated upstream
  onOpenPDFExtraction?: () => void;
=======
<<<<<<< Updated upstream
=======
  onOpenPDFExtraction?: () => void;
  onOpenMap?: () => void;
>>>>>>> Stashed changes
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
<<<<<<< Updated upstream
export function WelcomeScreen({ onSelectFile, onOpenArchive, onOpenSecurityChecker }: WelcomeScreenProps) {
  const selectFileStars = useMemo(() => generateStars(12), []);
  const vaultStars = useMemo(() => generateStars(12), []);
  const securityStars = useMemo(() => generateStars(12), []);
=======
>>>>>>> Stashed changes
// Generate light rays
const generateLightRays = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i,
    delay: i * 0.5,
  }));
};

<<<<<<< Updated upstream
export function WelcomeScreen({ onSelectFile, onOpenArchive, onOpenSecurityChecker, onOpenPDFExtraction }: WelcomeScreenProps) {
=======
interface WelcomeCardPastelPalette {
  borderClassName: string;
  cardShadow: string;
  glowBackground: string;
  glowShadow: string;
  overlayClassName: string;
  iconPulse: string[];
  iconGlowClassName: string;
  iconWrapperClassName: string;
  iconClassName: string;
  actionIconClassName: string;
}

interface WelcomeCardDarkPalette {
  beamBackground: string;
  beamBoxShadow: string;
  frameBackgroundImage: string;
  buttonShadow: string;
  glowBackground: string;
  glowShadow: string;
  iconPulse: string[];
  iconGlowClassName: string;
  iconWrapperClassName: string;
  iconClassName: string;
  titleClassName: string;
  actionIconClassName: string;
}

interface WelcomeMenuCardConfig {
  key: string;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  icon: LucideIcon;
  actionIcon: LucideIcon;
  delay: number;
  pastel: WelcomeCardPastelPalette;
  dark: WelcomeCardDarkPalette;
}

export function WelcomeScreen({ onSelectFile, onOpenArchive, onOpenSecurityChecker, onOpenPDFExtraction, onOpenMap }: WelcomeScreenProps) {
>>>>>>> Stashed changes
  // Get theme from settings
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'pastel';
  const particles = useMemo(() => generateParticles(50), []);
  const lightRays = useMemo(() => generateLightRays(8), []);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Theme colors
  const isPastel = theme === 'pastel';
  const bgGradient = isPastel 
    ? 'from-slate-50 via-pink-50/30 to-slate-50' 
    : 'from-gray-950 via-purple-950/50 to-gray-950';
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
<<<<<<< Updated upstream
=======
  const actionCards: WelcomeMenuCardConfig[] = [
    {
      key: 'pdf-to-png',
      title: 'PDF to PNG',
      description: 'Extract pages from PDF files',
      actionLabel: 'Select file',
      onClick: onOpenPDFExtraction || onSelectFile,
      icon: FileText,
      actionIcon: FileText,
      delay: 0.7,
      pastel: {
        borderClassName: 'border-purple-200/40',
        cardShadow: '0 4px 20px rgba(216, 180, 254, 0.15), 0 0 0 1px rgba(216, 180, 254, 0.1)',
        glowBackground: 'radial-gradient(circle at center, rgba(216, 180, 254, 0.15) 0%, transparent 70%)',
        glowShadow: '0 0 30px rgba(216, 180, 254, 0.2)',
        overlayClassName: 'bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-blue-50/30',
        iconPulse: [
          'drop-shadow(0 2px 8px rgba(216, 180, 254, 0.2))',
          'drop-shadow(0 4px 12px rgba(216, 180, 254, 0.3))',
          'drop-shadow(0 2px 8px rgba(216, 180, 254, 0.2))',
        ],
        iconGlowClassName: 'bg-gradient-to-br from-purple-200/40 via-pink-200/40 to-blue-200/40',
        iconWrapperClassName: 'bg-gradient-to-br from-purple-100/80 to-pink-100/80 border-2 border-purple-200/30',
        iconClassName: 'text-purple-400',
        actionIconClassName: 'text-purple-400',
      },
      dark: {
        beamBackground: 'linear-gradient(to right, transparent 0%, rgba(168, 85, 247, 0.55) 20%, rgba(34, 211, 238, 0.85) 50%, rgba(168, 85, 247, 0.55) 80%, transparent 100%)',
        beamBoxShadow: '0 0 12px rgba(168, 85, 247, 0.35), 0 0 28px rgba(34, 211, 238, 0.22)',
        frameBackgroundImage: 'linear-gradient(45deg, rgba(168, 85, 247, 0.95), rgba(236, 72, 153, 0.85), rgba(34, 211, 238, 0.95))',
        buttonShadow: '0 0 30px rgba(168, 85, 247, 0.24), inset 0 0 30px rgba(34, 211, 238, 0.08)',
        glowBackground: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
        glowShadow: '0 0 40px rgba(168, 85, 247, 0.45), 0 0 60px rgba(34, 211, 238, 0.3)',
        iconPulse: [
          'drop-shadow(0 0 15px rgba(168, 85, 247, 0.6))',
          'drop-shadow(0 0 25px rgba(34, 211, 238, 0.85))',
          'drop-shadow(0 0 15px rgba(168, 85, 247, 0.6))',
        ],
        iconGlowClassName: 'bg-gradient-to-br from-purple-600 to-cyan-600',
        iconWrapperClassName: 'bg-gradient-to-br from-purple-600/90 to-cyan-600/90 border border-fuchsia-300/35',
        iconClassName: 'text-white',
        titleClassName: 'bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent',
        actionIconClassName: 'text-cyan-300',
      },
    },
    {
      key: 'vault',
      title: 'The Vault',
      description: 'Access your case archive',
      actionLabel: 'Open Archive',
      onClick: onOpenArchive,
      icon: FolderOpen,
      actionIcon: Zap,
      delay: 0.75,
      pastel: {
        borderClassName: 'border-pink-200/40',
        cardShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
        glowBackground: 'radial-gradient(circle at center, rgba(251, 182, 206, 0.15) 0%, transparent 70%)',
        glowShadow: '0 0 30px rgba(251, 182, 206, 0.2)',
        overlayClassName: 'bg-gradient-to-br from-pink-50/30 via-rose-50/20 to-purple-50/30',
        iconPulse: [
          'drop-shadow(0 2px 8px rgba(251, 182, 206, 0.2))',
          'drop-shadow(0 4px 12px rgba(244, 114, 182, 0.28))',
          'drop-shadow(0 2px 8px rgba(251, 182, 206, 0.2))',
        ],
        iconGlowClassName: 'bg-gradient-to-br from-pink-200/40 via-rose-200/40 to-purple-200/40',
        iconWrapperClassName: 'bg-gradient-to-br from-pink-100/80 to-purple-100/80 border-2 border-pink-200/30',
        iconClassName: 'text-pink-400',
        actionIconClassName: 'text-pink-400',
      },
      dark: {
        beamBackground: 'linear-gradient(to right, transparent 0%, rgba(244, 114, 182, 0.55) 20%, rgba(168, 85, 247, 0.82) 50%, rgba(244, 114, 182, 0.55) 80%, transparent 100%)',
        beamBoxShadow: '0 0 12px rgba(244, 114, 182, 0.3), 0 0 28px rgba(168, 85, 247, 0.22)',
        frameBackgroundImage: 'linear-gradient(45deg, rgba(244, 114, 182, 0.95), rgba(168, 85, 247, 0.88), rgba(236, 72, 153, 0.92))',
        buttonShadow: '0 0 30px rgba(244, 114, 182, 0.2), inset 0 0 28px rgba(168, 85, 247, 0.08)',
        glowBackground: 'radial-gradient(circle at center, rgba(244, 114, 182, 0.18) 0%, transparent 70%)',
        glowShadow: '0 0 40px rgba(244, 114, 182, 0.4), 0 0 60px rgba(168, 85, 247, 0.28)',
        iconPulse: [
          'drop-shadow(0 0 15px rgba(244, 114, 182, 0.58))',
          'drop-shadow(0 0 25px rgba(168, 85, 247, 0.8))',
          'drop-shadow(0 0 15px rgba(244, 114, 182, 0.58))',
        ],
        iconGlowClassName: 'bg-gradient-to-br from-pink-500 to-fuchsia-600',
        iconWrapperClassName: 'bg-gradient-to-br from-pink-500/90 to-fuchsia-600/90 border border-pink-300/40',
        iconClassName: 'text-white',
        titleClassName: 'bg-gradient-to-r from-pink-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent',
        actionIconClassName: 'text-pink-300',
      },
    },
    {
      key: 'pdf-audit',
      title: 'PDF Audit',
      description: 'Security & redaction analysis',
      actionLabel: 'Run Audit',
      onClick: onOpenSecurityChecker,
      icon: Shield,
      actionIcon: Shield,
      delay: 0.8,
      pastel: {
        borderClassName: 'border-blue-200/40',
        cardShadow: '0 4px 20px rgba(165, 180, 252, 0.15), 0 0 0 1px rgba(165, 180, 252, 0.1)',
        glowBackground: 'radial-gradient(circle at center, rgba(165, 180, 252, 0.15) 0%, transparent 70%)',
        glowShadow: '0 0 30px rgba(165, 180, 252, 0.2)',
        overlayClassName: 'bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-cyan-50/30',
        iconPulse: [
          'drop-shadow(0 2px 8px rgba(165, 180, 252, 0.2))',
          'drop-shadow(0 4px 12px rgba(96, 165, 250, 0.3))',
          'drop-shadow(0 2px 8px rgba(165, 180, 252, 0.2))',
        ],
        iconGlowClassName: 'bg-gradient-to-br from-blue-200/40 via-indigo-200/40 to-cyan-200/40',
        iconWrapperClassName: 'bg-gradient-to-br from-blue-100/80 to-indigo-100/80 border-2 border-blue-200/30',
        iconClassName: 'text-blue-400',
        actionIconClassName: 'text-blue-400',
      },
      dark: {
        beamBackground: 'linear-gradient(to right, transparent 0%, rgba(59, 130, 246, 0.55) 20%, rgba(34, 211, 238, 0.82) 50%, rgba(59, 130, 246, 0.55) 80%, transparent 100%)',
        beamBoxShadow: '0 0 12px rgba(59, 130, 246, 0.32), 0 0 28px rgba(34, 211, 238, 0.24)',
        frameBackgroundImage: 'linear-gradient(45deg, rgba(14, 165, 233, 0.95), rgba(59, 130, 246, 0.92), rgba(34, 211, 238, 0.95))',
        buttonShadow: '0 0 30px rgba(59, 130, 246, 0.22), inset 0 0 30px rgba(34, 211, 238, 0.08)',
        glowBackground: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
        glowShadow: '0 0 40px rgba(59, 130, 246, 0.4), 0 0 60px rgba(34, 211, 238, 0.28)',
        iconPulse: [
          'drop-shadow(0 0 15px rgba(59, 130, 246, 0.58))',
          'drop-shadow(0 0 25px rgba(34, 211, 238, 0.82))',
          'drop-shadow(0 0 15px rgba(59, 130, 246, 0.58))',
        ],
        iconGlowClassName: 'bg-gradient-to-br from-sky-500 to-blue-600',
        iconWrapperClassName: 'bg-gradient-to-br from-sky-500/90 to-blue-600/90 border border-cyan-300/40',
        iconClassName: 'text-white',
        titleClassName: 'bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent',
        actionIconClassName: 'text-cyan-300',
      },
    },
    ...(onOpenMap
      ? [
          {
            key: 'map',
            title: 'Map',
            description: 'Research timeline mind maps',
            actionLabel: 'Open Map',
            onClick: onOpenMap,
            icon: MapIcon,
            actionIcon: MapIcon,
            delay: 0.85,
            pastel: {
              borderClassName: 'border-emerald-200/40',
              cardShadow: '0 4px 20px rgba(52, 211, 153, 0.15), 0 0 0 1px rgba(52, 211, 153, 0.1)',
              glowBackground: 'radial-gradient(circle at center, rgba(52, 211, 153, 0.15) 0%, transparent 70%)',
              glowShadow: '0 0 30px rgba(45, 212, 191, 0.2)',
              overlayClassName: 'bg-gradient-to-br from-emerald-50/30 via-teal-50/20 to-cyan-50/30',
              iconPulse: [
                'drop-shadow(0 2px 8px rgba(52, 211, 153, 0.2))',
                'drop-shadow(0 4px 12px rgba(45, 212, 191, 0.3))',
                'drop-shadow(0 2px 8px rgba(52, 211, 153, 0.2))',
              ],
              iconGlowClassName: 'bg-gradient-to-br from-emerald-200/40 via-teal-200/40 to-cyan-200/40',
              iconWrapperClassName: 'bg-gradient-to-br from-emerald-100/80 to-teal-100/80 border-2 border-emerald-200/30',
              iconClassName: 'text-emerald-500',
              actionIconClassName: 'text-emerald-500',
            },
            dark: {
              beamBackground: 'linear-gradient(to right, transparent 0%, rgba(16, 185, 129, 0.52) 20%, rgba(45, 212, 191, 0.8) 50%, rgba(16, 185, 129, 0.52) 80%, transparent 100%)',
              beamBoxShadow: '0 0 12px rgba(16, 185, 129, 0.28), 0 0 28px rgba(45, 212, 191, 0.22)',
              frameBackgroundImage: 'linear-gradient(45deg, rgba(16, 185, 129, 0.92), rgba(45, 212, 191, 0.9), rgba(34, 211, 238, 0.92))',
              buttonShadow: '0 0 30px rgba(16, 185, 129, 0.2), inset 0 0 28px rgba(45, 212, 191, 0.08)',
              glowBackground: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
              glowShadow: '0 0 40px rgba(16, 185, 129, 0.36), 0 0 60px rgba(45, 212, 191, 0.24)',
              iconPulse: [
                'drop-shadow(0 0 15px rgba(16, 185, 129, 0.52))',
                'drop-shadow(0 0 25px rgba(45, 212, 191, 0.78))',
                'drop-shadow(0 0 15px rgba(16, 185, 129, 0.52))',
              ],
              iconGlowClassName: 'bg-gradient-to-br from-emerald-500 to-teal-500',
              iconWrapperClassName: 'bg-gradient-to-br from-emerald-500/90 to-teal-500/90 border border-emerald-300/40',
              iconClassName: 'text-white',
              titleClassName: 'bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent',
              actionIconClassName: 'text-emerald-300',
            },
          },
        ]
      : []),
  ];
>>>>>>> Stashed changes

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
>>>>>>> Stashed changes
  return (
    <div className={`relative flex flex-col min-h-screen bg-gradient-to-br ${bgGradient} overflow-hidden`}>
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
              linear-gradient(${primaryRgba}0.1) 1px, transparent 1px),
              linear-gradient(90deg, ${primaryRgba}0.1) 1px, transparent 1px)
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
            className={`absolute rounded-full ${isPastel ? 'bg-purple-300' : 'bg-cyber-cyan-400'}`}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              boxShadow: `0 0 ${particle.size * 4}px ${secondaryRgba}0.6)`,
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

<<<<<<< Updated upstream
      {/* Light Rays from Center */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {lightRays.map((ray) => (
          <motion.div
            key={ray.id}
            className="absolute top-1/2 left-1/2 w-1 h-1/2 origin-top"
            style={{
              transform: `rotate(${ray.angle}deg)`,
              transformOrigin: 'top center',
              background: `linear-gradient(to bottom, ${primaryRgba}0.3), transparent)`,
              boxShadow: `0 0 20px ${primaryRgba}0.5)`,
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
=======
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
        <motion.div
<<<<<<< Updated upstream
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-4"
        >
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Rotating outer ring */}
=======
          className="absolute pointer-events-none z-0"
          style={{
            background: `linear-gradient(to right, transparent 0%, ${primaryRgba}0.6) 20%, ${primaryRgba}0.8) 50%, ${primaryRgba}0.6) 80%, transparent 100%)`,
            height: '2px',
            top: 'calc(50% + 180px)',
            left: '50%',
            width: 'calc(min(100% - 4rem, 80rem) - 2rem)',
            maxWidth: 'calc(80rem - 2rem)',
            boxShadow: `0 0 10px ${primaryRgba}0.9), 0 0 20px ${primaryRgba}0.5), 0 0 30px ${primaryRgba}0.3)`,
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
            delay: 0.65,
          }}
        />
      )}


      {/* Enhanced Header - Pastel Theme Revamp */}
      <motion.div 
        className={`relative z-10 w-full px-8 pt-8 pb-6 ${
          isPastel 
            ? 'border-b border-purple-200/30 bg-gradient-to-r from-white/60 via-pink-50/40 to-white/60 backdrop-blur-xl' 
            : 'border-b border-cyber-purple-400/20 bg-gradient-to-r from-gray-900/80 via-purple-900/30 to-gray-900/80 backdrop-blur-2xl'
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.9,
          ease: [0.25, 0.1, 0.25, 1],
          delay: 0.1,
        }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-6">
            {isPastel ? (
              // Pastel Theme: Soft, organic icon design
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.95, rotate: -5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  opacity: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 },
                  scale: { duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 },
                  rotate: { duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 },
                }}
              >
                <div
                  className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-purple-200/60 bg-white shadow-md"
                  style={{
                    boxShadow: '0 10px 22px rgba(216, 180, 254, 0.18), inset 0 1px 8px rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-purple-50 to-pink-100" />
                  <div className="absolute inset-[3px] rounded-full border border-purple-200/60" />
                  <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-white/95 via-purple-100/90 to-pink-100/95" />
                  <FolderOpen className="relative z-10 w-9 h-9 text-purple-500 drop-shadow-sm" />
                </div>
              </motion.div>
            ) : (
              // Original dark theme
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                }}
                transition={{
                  opacity: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 },
                  scale: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 },
                }}
              >
                <div
                  className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-cyber-purple-400/45 bg-gray-950 shadow-xl"
                  style={{
                    boxShadow: '0 0 16px rgba(139, 92, 246, 0.28), 0 0 26px rgba(34, 211, 238, 0.12), inset 0 1px 8px rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-900 via-purple-950 to-slate-950" />
                  <div className="absolute inset-[3px] rounded-full border border-white/10" />
                  <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-purple-500/18 via-transparent to-cyan-400/14" />
                  <FolderOpen className="relative z-10 w-9 h-9 text-white drop-shadow-[0_0_12px_rgba(139,92,246,0.42)]" />
                </div>
              </motion.div>
            )}
>>>>>>> Stashed changes
            <motion.div
              className="absolute inset-0 border-4 border-cyber-purple-400/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Rotating inner ring */}
            <motion.div
              className="absolute inset-4 border-2 border-cyber-cyan-400/40 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Pulsing glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-purple blur-3xl opacity-60 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{
                duration: 3,
>>>>>>> Stashed changes
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
          background: `radial-gradient(circle, ${primaryRgba}0.15) 0%, transparent 70%)`,
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
      {isPastel ? (
        // Pastel Theme: Soft, subtle line
        <motion.div
          className="absolute pointer-events-none z-0"
          style={{
            background: 'linear-gradient(to right, transparent 0%, rgba(216, 180, 254, 0.3) 20%, rgba(216, 180, 254, 0.4) 50%, rgba(216, 180, 254, 0.3) 80%, transparent 100%)',
            height: '1px',
            top: 'calc(50% + 180px)',
            left: '50%',
            width: 'calc(min(100% - 4rem, 80rem) - 2rem)',
            maxWidth: 'calc(80rem - 2rem)',
            boxShadow: '0 0 8px rgba(216, 180, 254, 0.2), 0 0 16px rgba(216, 180, 254, 0.1)',
          }}
          initial={{ 
            opacity: 0, 
            scaleX: 0,
            x: '-50%',
            y: '-50%',
          }}
          animate={{ 
            opacity: 1, 
            scaleX: 1,
            x: '-50%',
            y: '-50%',
          }}
          transition={{ 
            duration: 1,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.65,
          }}
        />
      ) : (
        // Original dark theme
        <motion.div
          className="absolute pointer-events-none z-0"
          style={{
            background: `linear-gradient(to right, transparent 0%, ${primaryRgba}0.6) 20%, ${primaryRgba}0.8) 50%, ${primaryRgba}0.6) 80%, transparent 100%)`,
            height: '2px',
            top: 'calc(50% + 180px)',
            left: '50%',
            width: 'calc(min(100% - 4rem, 80rem) - 2rem)',
            maxWidth: 'calc(80rem - 2rem)',
            boxShadow: `0 0 10px ${primaryRgba}0.9), 0 0 20px ${primaryRgba}0.5), 0 0 30px ${primaryRgba}0.3)`,
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
            delay: 0.65,
          }}
        />
      )}


      {/* Enhanced Header - Pastel Theme Revamp */}
      <motion.div 
        className={`relative z-10 w-full px-8 pt-8 pb-6 ${
          isPastel 
            ? 'border-b border-purple-200/30 bg-gradient-to-r from-white/60 via-pink-50/40 to-white/60 backdrop-blur-xl' 
            : 'border-b border-cyber-purple-400/20 bg-gradient-to-r from-gray-900/80 via-purple-900/30 to-gray-900/80 backdrop-blur-2xl'
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.9,
          ease: [0.25, 0.1, 0.25, 1],
          delay: 0.1,
        }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-6">
            {isPastel ? (
              // Pastel Theme: Soft, organic icon design
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.95, rotate: -5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  opacity: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 },
                  scale: { duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 },
                  rotate: { duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 },
                }}
              >
                {/* Soft pastel glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-200/50 via-pink-200/50 to-blue-200/50 rounded-3xl blur-xl"></div>
                {/* Watercolor-like background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/80 via-pink-100/60 to-blue-100/80 rounded-3xl"></div>
                {/* Delicate border */}
                <div className="relative p-4 bg-white/70 rounded-3xl shadow-lg border-2 border-purple-200/40 backdrop-blur-sm">
                  <FolderOpen className="w-8 h-8 text-purple-400 drop-shadow-sm" />
                </div>
              </motion.div>
            ) : (
              // Original dark theme
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
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 0.9,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 0.2,
              }}
            >
              {isPastel ? (
                // Pastel Theme: Soft, elegant typography
                <>
                  <motion.h1
                    className="text-5xl font-bold text-gray-800"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ 
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      opacity: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.25 },
                      y: { duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay: 0.25 },
                    }}
                    style={{
                      textShadow: '0 2px 8px rgba(216, 180, 254, 0.2)',
                    }}
                  >
                    Welcome to Vault
                  </motion.h1>
                  <motion.p 
                    className="text-base text-gray-600 mt-2 font-medium"
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
                </>
              ) : (
                // Original dark theme
                <>
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
                </>
              )}
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
<<<<<<< Updated upstream
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes

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
          {/* Enhanced Floating Logo - Pastel Theme Revamp */}
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
            {isPastel ? (
              // Pastel Theme: Soft, organic floating design
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Soft pastel rings with gentle rotation */}
                <motion.div
                  className="absolute inset-0 border-4 border-purple-200/30 rounded-full"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    rotate: 360,
                  }}
                  transition={{ 
                    opacity: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.45 },
                    scale: { duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.45 },
                    rotate: { duration: 40, repeat: Infinity, ease: "linear", delay: 1.4 },
                  }}
                  style={{
                    boxShadow: '0 0 20px rgba(216, 180, 254, 0.3), inset 0 0 20px rgba(216, 180, 254, 0.1)',
                  }}
                />
                <motion.div
                  className="absolute inset-8 border-2 border-pink-200/40 rounded-full"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    rotate: -360,
                  }}
                  transition={{ 
                    opacity: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 },
                    scale: { duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.5 },
                    rotate: { duration: 35, repeat: Infinity, ease: "linear", delay: 1.45 },
                  }}
                  style={{
                    boxShadow: '0 0 15px rgba(251, 182, 206, 0.3), inset 0 0 15px rgba(251, 182, 206, 0.1)',
                  }}
                />
                
                {/* Soft pastel glow effects */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-200/30 via-pink-200/30 to-blue-200/30 blur-3xl rounded-full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    opacity: {
                      duration: 3,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.6, 1],
                      delay: 0.55,
                    },
                    scale: {
                      duration: 6,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.6, 1],
                      delay: 1.5,
                    },
                  }}
                />
                
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-pink-200/20 via-blue-200/20 to-purple-200/20 blur-2xl rounded-full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: [0.15, 0.3, 0.15],
                    scale: [1.05, 1.2, 1.05],
                  }}
                  transition={{
                    opacity: {
                      duration: 4,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.6, 1],
                      delay: 0.6,
                    },
                    scale: {
                      duration: 7,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.6, 1],
                      delay: 2,
                    },
                  }}
                />

                {/* Floating Vault Icon with soft pastel styling */}
                <motion.img
                  src={getAssetPath('vault-icon.png')}
                  alt="Vault"
                  className="w-52 h-52 relative z-10"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, -8, 0],
                    filter: [
                      'drop-shadow(0 4px 12px rgba(216, 180, 254, 0.3)) drop-shadow(0 8px 24px rgba(251, 182, 206, 0.2))',
                      'drop-shadow(0 6px 16px rgba(216, 180, 254, 0.4)) drop-shadow(0 12px 32px rgba(251, 182, 206, 0.3))',
                      'drop-shadow(0 4px 12px rgba(216, 180, 254, 0.3)) drop-shadow(0 8px 24px rgba(251, 182, 206, 0.2))',
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
                      ease: [0.34, 1.56, 0.64, 1],
                      delay: 0.55,
                    },
                    y: {
                      duration: 6,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.6, 1],
                      delay: 1.5,
                    },
                    filter: {
                      duration: 5,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.6, 1],
                      delay: 0.95,
                    },
                  }}
                />
                
                {/* Soft pastel sparkle particles */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: '5px',
                      height: '5px',
                      top: `${15 + (i * 7)}%`,
                      left: `${15 + (i * 7)}%`,
                      background: `radial-gradient(circle, rgba(216, 180, 254, 0.6), transparent)`,
                      boxShadow: '0 0 8px rgba(216, 180, 254, 0.4), 0 0 16px rgba(251, 182, 206, 0.3)',
                    }}
                    animate={{
                      scale: [0, 1.2, 0],
                      opacity: [0, 0.7, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: [0.4, 0, 0.6, 1],
                    }}
                  />
                ))}
              </div>
            ) : (
              // Original dark theme
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
                    boxShadow: `0 0 30px ${primaryRgba}0.6), inset 0 0 30px ${primaryRgba}0.2)`,
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
                    boxShadow: `0 0 20px ${secondaryRgba}0.6), inset 0 0 20px ${secondaryRgba}0.2)`,
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
                    filter: `drop-shadow(0 0 40px ${primaryRgba}0.8))`,
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
                      `drop-shadow(0 0 20px ${primaryRgba}0.8)) drop-shadow(0 0 40px ${secondaryRgba}0.6))`,
                      `drop-shadow(0 0 30px ${primaryRgba}1)) drop-shadow(0 0 60px ${secondaryRgba}0.8))`,
                      `drop-shadow(0 0 20px ${primaryRgba}0.8)) drop-shadow(0 0 40px ${secondaryRgba}0.6))`,
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
                      background: `radial-gradient(circle, ${secondaryRgba}1), transparent)`,
                      boxShadow: `0 0 10px ${secondaryRgba}0.8), 0 0 20px ${secondaryRgba}0.4)`,
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
            )}
          </motion.div>

          {/* Enhanced Action Cards */}
<<<<<<< Updated upstream
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
              {isPastel ? (
                // Pastel Theme: Soft, organic card design
                <motion.button
                  whileHover={{ 
                    scale: 1.02, 
                    y: -3,
                    transition: { 
                      duration: 0.3, 
                      ease: [0.4, 0, 0.2, 1]
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenPDFExtraction || onSelectFile}
                  className="w-full relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-lg border-2 border-purple-200/40 transition-all duration-300 z-10"
                  style={{
                    boxShadow: '0 4px 20px rgba(216, 180, 254, 0.15), 0 0 0 1px rgba(216, 180, 254, 0.1)',
                  }}
                >
                  {/* Soft pastel glow on hover */}
                  <motion.div 
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{ 
                      opacity: 1,
                      transition: { duration: 0.3 }
                    }}
                    style={{
                      background: 'radial-gradient(circle at center, rgba(216, 180, 254, 0.15) 0%, transparent 70%)',
                      boxShadow: '0 0 30px rgba(216, 180, 254, 0.2)',
                    }}
                  />
                  
                  {/* Watercolor-like overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-blue-50/30 rounded-3xl"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Card Content */}
                  <div className="relative z-10 p-10 flex flex-col items-center gap-6">
                    <motion.div
                      className="relative"
                      animate={{
                        filter: [
                          'drop-shadow(0 2px 8px rgba(216, 180, 254, 0.2))',
                          'drop-shadow(0 4px 12px rgba(216, 180, 254, 0.3))',
                          'drop-shadow(0 2px 8px rgba(216, 180, 254, 0.2))',
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {/* Soft pastel icon background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-200/40 via-pink-200/40 to-blue-200/40 rounded-3xl blur-xl"></div>
                      <motion.div 
                        className="relative p-6 bg-gradient-to-br from-purple-100/80 to-pink-100/80 rounded-3xl shadow-md border-2 border-purple-200/30"
                        whileHover={{ 
                          scale: 1.08,
                          rotate: [0, -1, 1, -1, 1, 0],
                          transition: { duration: 0.4, ease: "easeOut" }
                        }}
                      >
                        <FileText className="w-12 h-12 text-purple-400" />
                      </motion.div>
                    </motion.div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2 text-gray-800">
                        PDF to PNG
                      </h3>
                      <p className="text-sm text-gray-600">Extract pages from PDF files</p>
                    </div>
                    <motion.div
                      className="flex items-center gap-3 text-gray-700 font-semibold text-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <span>Select file</span>
                    </motion.div>
                  </div>
                </motion.button>
              ) : (
                // Original dark theme
                <>
                  {/* Transparent Beam Border */}
                  <div
                    className="absolute -inset-[2px] pointer-events-none z-0 rounded-3xl"
                    style={{
                      background: `linear-gradient(to right, transparent 0%, ${primaryRgba}0.6) 20%, ${primaryRgba}0.8) 50%, ${primaryRgba}0.6) 80%, transparent 100%)`,
                      padding: '2px',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                      boxShadow: `0 0 10px ${primaryRgba}0.9), 0 0 20px ${primaryRgba}0.5), 0 0 30px ${primaryRgba}0.3)`,
                    }}
                  />
                  {/* Animated Border Wrapper */}
                  <motion.div
                    className="rounded-3xl p-[3px]"
                    style={{
                      backgroundImage: `linear-gradient(45deg, ${primaryRgba}0.9), ${secondaryRgba}0.9), ${primaryRgba}0.9))`,
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
                          ease: [0.4, 0, 0.2, 1]
                        }
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onOpenPDFExtraction || onSelectFile}
                      className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200 z-10"
                      style={{
                        boxShadow: `0 0 30px ${primaryRgba}0.3), inset 0 0 30px ${primaryRgba}0.1)`,
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
=======
          <div className={`grid grid-cols-1 md:grid-cols-2 ${actionCards.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8`}>
            {actionCards.map((card) => {
              const Icon = card.icon;
              const ActionIcon = card.actionIcon;

              return (
                <motion.div
                  key={card.key}
                  initial={{ opacity: 0, scale: 0.96, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    duration: 0.9,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: card.delay,
                  }}
                  className="relative group"
                >
                  {isPastel ? (
                    <motion.button
                      whileHover={{
                        scale: 1.02,
                        y: -3,
                        transition: {
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        },
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={card.onClick}
                      className={`w-full relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-lg border-2 transition-all duration-300 z-10 ${card.pastel.borderClassName}`}
                      style={{
                        boxShadow: card.pastel.cardShadow,
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 rounded-3xl pointer-events-none"
                        initial={{ opacity: 0 }}
                        whileHover={{
                          opacity: 1,
                          transition: { duration: 0.3 },
                        }}
                        style={{
                          background: card.pastel.glowBackground,
                          boxShadow: card.pastel.glowShadow,
                        }}
                      />

                      <motion.div
                        className={`absolute inset-0 rounded-3xl ${card.pastel.overlayClassName}`}
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />

>>>>>>> Stashed changes
                      <div className="relative z-10 p-10 flex flex-col items-center gap-6">
                        <motion.div
                          className="relative"
                          animate={{
<<<<<<< Updated upstream
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
                          <h3 className="text-2xl font-bold mb-2 text-white bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent">
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
                </>
              )}
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
              {isPastel ? (
                // Pastel Theme: Soft, organic card design
                <motion.button
                  whileHover={{ 
                    scale: 1.02, 
                    y: -3,
                    transition: { 
                      duration: 0.3, 
                      ease: [0.4, 0, 0.2, 1]
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenArchive}
                  className="w-full relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-lg border-2 border-pink-200/40 transition-all duration-300 z-10"
                  style={{
                    boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                  }}
                >
                  {/* Soft pastel glow on hover */}
                  <motion.div 
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{ 
                      opacity: 1,
                      transition: { duration: 0.3 }
                    }}
                    style={{
                      background: 'radial-gradient(circle at center, rgba(251, 182, 206, 0.15) 0%, transparent 70%)',
                      boxShadow: '0 0 30px rgba(251, 182, 206, 0.2)',
                    }}
                  />
                  
                  {/* Watercolor-like overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-pink-50/30 via-purple-50/20 to-blue-50/30 rounded-3xl"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Card Content */}
                  <div className="relative z-10 p-10 flex flex-col items-center gap-6">
                    <motion.div
                      className="relative"
                      animate={{
                        filter: [
                          'drop-shadow(0 2px 8px rgba(251, 182, 206, 0.2))',
                          'drop-shadow(0 4px 12px rgba(251, 182, 206, 0.3))',
                          'drop-shadow(0 2px 8px rgba(251, 182, 206, 0.2))',
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {/* Soft pastel icon background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-200/40 via-purple-200/40 to-blue-200/40 rounded-3xl blur-xl"></div>
                      <motion.div 
                        className="relative p-6 bg-gradient-to-br from-pink-100/80 to-purple-100/80 rounded-3xl shadow-md border-2 border-pink-200/30"
                        whileHover={{ 
                          scale: 1.08,
                          rotate: [0, -1, 1, -1, 1, 0],
                          transition: { duration: 0.4, ease: "easeOut" }
                        }}
                      >
                        <FolderOpen className="w-12 h-12 text-pink-400" />
                      </motion.div>
                    </motion.div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2 text-gray-800">
                        The Vault
                      </h3>
                      <p className="text-sm text-gray-600">Access your case archive</p>
                    </div>
                    <motion.div
                      className="flex items-center gap-3 text-gray-700 font-semibold text-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Zap className="w-5 h-5 text-pink-400" />
                      <span>Open Archive</span>
                    </motion.div>
                  </div>
                </motion.button>
              ) : (
                // Original dark theme
                <>
                  {/* Transparent Beam Border */}
                  <div
                    className="absolute -inset-[2px] pointer-events-none z-0 rounded-3xl"
                    style={{
                      background: `linear-gradient(to right, transparent 0%, ${primaryRgba}0.6) 20%, ${primaryRgba}0.8) 50%, ${primaryRgba}0.6) 80%, transparent 100%)`,
                      padding: '2px',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                      boxShadow: `0 0 10px ${primaryRgba}0.9), 0 0 20px ${primaryRgba}0.5), 0 0 30px ${primaryRgba}0.3)`,
                    }}
                  />
                  {/* Animated Border Wrapper */}
                  <motion.div
                    className="rounded-3xl p-[3px]"
                    style={{
                      backgroundImage: `linear-gradient(45deg, ${primaryRgba}0.9), ${secondaryRgba}0.9), ${primaryRgba}0.9))`,
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
                          ease: [0.4, 0, 0.2, 1]
                        }
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onOpenArchive}
                      className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200 z-10"
                      style={{
                        boxShadow: `0 0 30px ${primaryRgba}0.3), inset 0 0 30px ${primaryRgba}0.1)`,
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
                </>
              )}
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
              {isPastel ? (
                // Pastel Theme: Soft, organic card design
                <motion.button
                  whileHover={{ 
                    scale: 1.02, 
                    y: -3,
                    transition: { 
                      duration: 0.3, 
                      ease: [0.4, 0, 0.2, 1]
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenSecurityChecker}
                  className="w-full relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-lg border-2 border-blue-200/40 transition-all duration-300 z-10"
                  style={{
                    boxShadow: '0 4px 20px rgba(165, 180, 252, 0.15), 0 0 0 1px rgba(165, 180, 252, 0.1)',
                  }}
                >
                  {/* Soft pastel glow on hover */}
                  <motion.div 
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{ 
                      opacity: 1,
                      transition: { duration: 0.3 }
                    }}
                    style={{
                      background: 'radial-gradient(circle at center, rgba(165, 180, 252, 0.15) 0%, transparent 70%)',
                      boxShadow: '0 0 30px rgba(165, 180, 252, 0.2)',
                    }}
                  />
                  
                  {/* Watercolor-like overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 rounded-3xl"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Card Content */}
                  <div className="relative z-10 p-10 flex flex-col items-center gap-6">
                    <motion.div
                      className="relative"
                      animate={{
                        filter: [
                          'drop-shadow(0 2px 8px rgba(165, 180, 252, 0.2))',
                          'drop-shadow(0 4px 12px rgba(165, 180, 252, 0.3))',
                          'drop-shadow(0 2px 8px rgba(165, 180, 252, 0.2))',
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {/* Soft pastel icon background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 via-purple-200/40 to-pink-200/40 rounded-3xl blur-xl"></div>
                      <motion.div 
                        className="relative p-6 bg-gradient-to-br from-blue-100/80 to-purple-100/80 rounded-3xl shadow-md border-2 border-blue-200/30"
                        whileHover={{ 
                          scale: 1.08,
                          rotate: [0, -1, 1, -1, 1, 0],
                          transition: { duration: 0.4, ease: "easeOut" }
                        }}
                      >
                        <Shield className="w-12 h-12 text-blue-400" />
                      </motion.div>
                    </motion.div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2 text-gray-800">
                        PDF Audit
                      </h3>
                      <p className="text-sm text-gray-600">Security & redaction analysis</p>
                    </div>
                    <motion.div
                      className="flex items-center gap-3 text-gray-700 font-semibold text-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Shield className="w-5 h-5 text-blue-400" />
                      <span>Run Audit</span>
                    </motion.div>
                  </div>
                </motion.button>
              ) : (
                // Original dark theme
                <>
                  {/* Transparent Beam Border */}
                  <div
                    className="absolute -inset-[2px] pointer-events-none z-0 rounded-3xl"
                    style={{
                      background: `linear-gradient(to right, transparent 0%, ${primaryRgba}0.6) 20%, ${primaryRgba}0.8) 50%, ${primaryRgba}0.6) 80%, transparent 100%)`,
                      padding: '2px',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                      boxShadow: `0 0 10px ${primaryRgba}0.9), 0 0 20px ${primaryRgba}0.5), 0 0 30px ${primaryRgba}0.3)`,
                    }}
                  />
                  {/* Animated Border Wrapper */}
                  <motion.div
                    className="rounded-3xl p-[3px]"
                    style={{
                      backgroundImage: `linear-gradient(45deg, ${primaryRgba}0.9), ${secondaryRgba}0.9), ${primaryRgba}0.9))`,
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
                          ease: [0.4, 0, 0.2, 1]
                        }
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onOpenSecurityChecker}
                      className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200"
                      style={{
                        boxShadow: `0 0 30px ${primaryRgba}0.3), inset 0 0 30px ${primaryRgba}0.1)`,
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
                          background: `radial-gradient(circle at center, ${primaryRgba}0.2) 0%, transparent 70%)`,
                          boxShadow: `0 0 40px ${primaryRgba}0.6), 0 0 60px ${secondaryRgba}0.4)`,
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
                              `drop-shadow(0 0 15px ${primaryRgba}0.6))`,
                              `drop-shadow(0 0 25px ${primaryRgba}0.9))`,
                              `drop-shadow(0 0 15px ${primaryRgba}0.6))`,
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
                          <h3 className="text-2xl font-bold mb-2 text-white bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent">
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
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
=======
                            filter: card.pastel.iconPulse,
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <div className={`absolute inset-0 rounded-3xl blur-xl ${card.pastel.iconGlowClassName}`}></div>
                          <motion.div
                            className={`relative p-6 rounded-3xl shadow-md ${card.pastel.iconWrapperClassName}`}
                            whileHover={{
                              scale: 1.08,
                              rotate: [0, -1, 1, -1, 1, 0],
                              transition: { duration: 0.4, ease: 'easeOut' },
                            }}
                          >
                            <Icon className={`w-12 h-12 ${card.pastel.iconClassName}`} />
                          </motion.div>
                        </motion.div>
                        <div className="text-center">
                          <h3 className="text-2xl font-bold mb-2 text-gray-800">
                            {card.title}
                          </h3>
                          <p className="text-sm text-gray-600">{card.description}</p>
                        </div>
                        <motion.div
                          className="flex items-center gap-3 text-gray-700 font-semibold text-lg"
                          whileHover={{ scale: 1.05 }}
                        >
                          <ActionIcon className={`w-5 h-5 ${card.pastel.actionIconClassName}`} />
                          <span>{card.actionLabel}</span>
                        </motion.div>
                      </div>
                    </motion.button>
                  ) : (
                    <>
                      <div
                        className="absolute -inset-[2px] pointer-events-none z-0 rounded-3xl"
                        style={{
                          background: card.dark.beamBackground,
                          padding: '2px',
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          maskComposite: 'exclude',
                          boxShadow: card.dark.beamBoxShadow,
                        }}
                      />
                      <motion.div
                        className="rounded-3xl p-[3px]"
                        style={{
                          backgroundImage: card.dark.frameBackgroundImage,
                          backgroundSize: '200% 200%',
                        }}
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      >
                        <motion.button
                          whileHover={{
                            scale: 1.04,
                            y: -4,
                            transition: {
                              duration: 0.2,
                              ease: [0.4, 0, 0.2, 1],
                            },
                          }}
                          whileTap={{ scale: 0.98 }}
                          onClick={card.onClick}
                          className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200 z-10"
                          style={{
                            boxShadow: card.dark.buttonShadow,
                          }}
                        >
                          <motion.div
                            className="absolute inset-0 rounded-3xl pointer-events-none"
                            initial={{ opacity: 0 }}
                            whileHover={{
                              opacity: 1,
                              transition: { duration: 0.2 },
                            }}
                            style={{
                              background: card.dark.glowBackground,
                              boxShadow: card.dark.glowShadow,
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
                                filter: card.dark.iconPulse,
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                            >
                              <div className={`absolute inset-0 rounded-3xl blur-2xl opacity-60 ${card.dark.iconGlowClassName}`}></div>
                              <motion.div
                                className={`relative p-6 rounded-3xl shadow-2xl ${card.dark.iconWrapperClassName}`}
                                whileHover={{
                                  scale: 1.1,
                                  rotate: [0, -2, 2, -2, 2, 0],
                                  transition: { duration: 0.3, ease: 'easeOut' },
                                }}
                              >
                                <Icon className={`w-12 h-12 ${card.dark.iconClassName}`} />
                              </motion.div>
                            </motion.div>
                            <div className="text-center">
                              <h3 className={`text-2xl font-bold mb-2 ${card.dark.titleClassName}`}>
                                {card.title}
                              </h3>
                              <p className="text-sm text-gray-300">{card.description}</p>
                            </div>
                            <motion.div
                              className="flex items-center gap-3 text-white font-semibold text-lg"
                              whileHover={{ scale: 1.1 }}
                            >
                              <ActionIcon className={`w-5 h-5 ${card.dark.actionIconClassName}`} />
                              <span>{card.actionLabel}</span>
                            </motion.div>
                          </div>
                        </motion.button>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
>>>>>>> Stashed changes
>>>>>>> Stashed changes
      </div>
    </div>
  );
}
