import { motion } from 'framer-motion';
import { useMemo } from 'react';

// Get base URL for assets (works in both dev and production)
const getAssetPath = (path: string) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Use import.meta.env.BASE_URL which Vite provides (usually './' for Electron)
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

interface WelcomeScreenProps {
  onSelectFile: () => void;
  onOpenArchive: () => void;
}

// Generate stable star positions
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const seed = i * 0.618; // Golden ratio for better distribution
    return {
      id: i,
      size: (Math.sin(seed * 100) * 0.5 + 1.5).toFixed(1),
      left: (Math.sin(seed * 50) * 0.5 + 0.5) * 100,
      top: (Math.cos(seed * 50) * 0.5 + 0.5) * 100,
      duration: (Math.sin(seed * 30) * 0.5 + 2).toFixed(1),
      delay: (Math.sin(seed * 20) * 0.5 + 0.5) * 2,
    };
  });
};

export function WelcomeScreen({ onSelectFile, onOpenArchive }: WelcomeScreenProps) {
  const selectFileStars = useMemo(() => generateStars(12), []);
  const vaultStars = useMemo(() => generateStars(12), []);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-4"
        >
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Rotating outer ring */}
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
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Secondary pulsing glow */}
            <motion.div
              className="absolute inset-0 bg-cyber-cyan-400/30 blur-2xl rounded-full"
              animate={{
                scale: [1.1, 1.3, 1.1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
            
            {/* Floating vault icon */}
            <motion.img
              src={getAssetPath('vault-icon.png')}
              alt="The Vault"
              className="w-40 h-40 relative z-10 drop-shadow-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -10, 0],
              }}
              transition={{
                opacity: { duration: 0.5, delay: 0.3 },
                scale: { duration: 0.5, delay: 0.3 },
                y: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            />
            
            {/* Sparkle particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-cyber-cyan-400 rounded-full"
                style={{
                  top: `${20 + (i * 15)}%`,
                  left: `${20 + (i * 15)}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-6xl font-bold bg-gradient-purple bg-clip-text text-transparent mb-4"
        >
          Welcome to Vault
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-xl text-gray-400 mb-8"
        >
          A Research Organization System
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="relative"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSelectFile}
              className="
                px-8 py-4 rounded-full
                text-white font-semibold text-lg
                relative overflow-hidden
                group
                border-2 border-cyber-purple-400/40
                backdrop-blur-sm
                transition-all duration-500 ease-out
              "
              aria-label="Select PDF file to extract"
            >
              {/* Dark galaxy base */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/80 to-gray-900" />
              
              {/* Rotating nebula gradient - refined */}
              <motion.div
                className="absolute inset-0 opacity-15 blur-sm"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, transparent 20%, rgba(139, 92, 246, 0.3) 30%, rgba(34, 211, 238, 0.2) 50%, rgba(139, 92, 246, 0.3) 70%, transparent 80%, transparent 100%)',
                }}
              />
              
              {/* Secondary subtle rotating layer */}
              <motion.div
                className="absolute inset-0 opacity-10 blur-[2px]"
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                style={{
                  background: 'conic-gradient(from 180deg, transparent 0%, rgba(168, 85, 247, 0.2) 25%, transparent 50%, rgba(34, 211, 238, 0.15) 75%, transparent 100%)',
                }}
              />
              
              {/* Animated starfield */}
              {selectFileStars.map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                  }}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: parseFloat(star.duration),
                    repeat: Infinity,
                    delay: star.delay,
                    ease: "easeInOut",
                  }}
                />
              ))}
              
              {/* Subtle pulsing glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyber-purple-500/20 via-cyber-cyan-400/20 to-cyber-purple-500/20"
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Glowing border on hover */}
              <div className="absolute inset-0 rounded-full border-2 border-cyber-cyan-400/0 pointer-events-none transition-all duration-500 ease-out group-hover:border-cyber-cyan-400/70 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.5),0_0_40px_rgba(168,85,247,0.4)]" />
              
              {/* Content */}
              <span className="relative z-10 flex items-center gap-2">
                <img src={getAssetPath('Select File Button.png')} alt="" className="w-16 h-16 drop-shadow-lg" aria-hidden="true" />
                Select file
              </span>
            </motion.button>
            <p className="text-gray-400 text-sm text-center absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-full pointer-events-none whitespace-nowrap">PDF to PNG</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="relative"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenArchive}
              className="
                px-8 py-4 rounded-full
                text-white font-semibold text-lg
                relative overflow-hidden
                group
                border-2 border-cyber-purple-400/40
                backdrop-blur-sm
                transition-all duration-500 ease-out
              "
              aria-label="Open The Vault archive"
            >
              {/* Dark galaxy base */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/80 to-gray-900" />
              
              {/* Rotating nebula gradient - refined */}
              <motion.div
                className="absolute inset-0 opacity-15 blur-sm"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, transparent 20%, rgba(139, 92, 246, 0.3) 30%, rgba(34, 211, 238, 0.2) 50%, rgba(139, 92, 246, 0.3) 70%, transparent 80%, transparent 100%)',
                }}
              />
              
              {/* Secondary subtle rotating layer */}
              <motion.div
                className="absolute inset-0 opacity-10 blur-[2px]"
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                style={{
                  background: 'conic-gradient(from 180deg, transparent 0%, rgba(168, 85, 247, 0.2) 25%, transparent 50%, rgba(34, 211, 238, 0.15) 75%, transparent 100%)',
                }}
              />
              
              {/* Animated starfield */}
              {vaultStars.map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                  }}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: parseFloat(star.duration),
                    repeat: Infinity,
                    delay: star.delay,
                    ease: "easeInOut",
                  }}
                />
              ))}
              
              {/* Subtle pulsing glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyber-purple-500/20 via-cyber-cyan-400/20 to-cyber-purple-500/20"
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Glowing border on hover */}
              <div className="absolute inset-0 rounded-full border-2 border-cyber-cyan-400/0 pointer-events-none transition-all duration-500 ease-out group-hover:border-cyber-cyan-400/70 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.5),0_0_40px_rgba(168,85,247,0.4)]" />
              
              {/* Content */}
              <span className="relative z-10 flex items-center gap-2">
                <img src={getAssetPath('The Vault Button.png')} alt="" className="w-16 h-16 drop-shadow-lg" aria-hidden="true" />
                The Vault
              </span>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

