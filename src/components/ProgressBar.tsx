import { motion } from 'framer-motion';
import { ExtractionProgress } from '../types';

interface ProgressBarProps {
  progress: ExtractionProgress;
  statusMessage?: string;
  onCancel?: () => void;
}

export function ProgressBar({ progress, statusMessage, onCancel }: ProgressBarProps) {
  return (
    <div className="w-full space-y-3 p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border-2 border-cyber-purple-500/30 shadow-lg">
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-white text-lg">
            {statusMessage || 'Processing PDF...'}
          </span>
          {progress.totalPages > 0 && (
            <span className="text-gray-400 text-sm mt-1">
              Page {progress.currentPage} of {progress.totalPages}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-cyber-purple-400 font-bold text-2xl">
            {progress.percentage}%
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/20"
              aria-label="Cancel extraction"
            >
              Cancel
            </button>
          )}
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

