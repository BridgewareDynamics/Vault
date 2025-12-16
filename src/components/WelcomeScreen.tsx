import { motion } from 'framer-motion';
import { FileText, Archive } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectFile: () => void;
  onOpenArchive: () => void;
}

export function WelcomeScreen({ onSelectFile, onOpenArchive }: WelcomeScreenProps) {
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
              src="/vault-icon.png"
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
          className="text-6xl font-bold bg-gradient-purple bg-clip-text text-transparent mb-8"
        >
          Welcome to the Vault
        </motion.h1>

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
                bg-gradient-purple
                text-white font-semibold text-lg
                border-2 border-cyber-cyan-400
                shadow-lg shadow-cyber-purple-500/50
                hover:shadow-xl hover:shadow-cyber-purple-500/70
                transition-all duration-300
                relative overflow-hidden
                group
              "
              aria-label="Select PDF file to extract"
            >
              <span className="relative z-10 flex items-center gap-2">
                <FileText className="w-5 h-5" aria-hidden="true" />
                Select file
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyber-cyan-400/20 to-cyber-purple-500/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>
            <p className="text-gray-400 text-sm text-center absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-full pointer-events-none whitespace-nowrap">PDF to PNG</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenArchive}
            className="
              px-8 py-4 rounded-full
              bg-gradient-to-r from-purple-600 to-purple-500
              text-white font-semibold text-lg
              border-2 border-cyber-cyan-400
              shadow-lg shadow-purple-500/50
              hover:shadow-xl hover:shadow-purple-500/70
              transition-all duration-300
              relative overflow-hidden
              group
            "
            aria-label="Open The Vault archive"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Archive className="w-5 h-5" aria-hidden="true" />
              The Vault
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyber-cyan-400/20 to-purple-500/20"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

