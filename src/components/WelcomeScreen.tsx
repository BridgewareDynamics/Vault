import { motion } from 'framer-motion';
import { FileText, Archive, Lock } from 'lucide-react';

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
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-purple blur-2xl opacity-50 rounded-full"></div>
            <Lock className="w-24 h-24 text-cyber-purple-400 relative z-10" />
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
            >
              <span className="relative z-10 flex items-center gap-2">
                <FileText className="w-5 h-5" />
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
          >
            <span className="relative z-10 flex items-center gap-2">
              <Archive className="w-5 h-5" />
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

