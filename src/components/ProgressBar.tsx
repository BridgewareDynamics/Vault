import { motion } from 'framer-motion';
import { ExtractionProgress } from '../types';

interface ProgressBarProps {
  progress: ExtractionProgress;
  statusMessage?: string;
}

export function ProgressBar({ progress, statusMessage }: ProgressBarProps) {
  return (
    <div className="w-full space-y-3 p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border-2 border-cyber-purple-500/30 shadow-lg">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="font-semibold text-white text-lg">
            {statusMessage || 'Processing PDF...'}
          </span>
          {progress.totalPages > 0 && (
            <span className="text-gray-400 text-sm mt-1">
              Page {progress.currentPage} of {progress.totalPages}
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-cyber-purple-400 font-bold text-2xl">
            {progress.percentage}%
          </span>
        </div>
      </div>
      
      <div className="w-full h-6 bg-gray-900 rounded-full overflow-hidden border-2 border-gray-700 shadow-inner">
        <motion.div
          className="h-full bg-gradient-purple rounded-full relative overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: 'linear',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

