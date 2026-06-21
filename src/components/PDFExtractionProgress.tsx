import { motion } from 'framer-motion';
import { Loader2, X, Clock, HardDrive } from 'lucide-react';
import { ExtractionProgress } from '../types';

interface PDFExtractionProgressProps {
  progress: ExtractionProgress;
  onCancel?: () => void;
  isPastel?: boolean;
}

export function PDFExtractionProgress({ progress, onCancel, isPastel = false }: PDFExtractionProgressProps) {
  const formatTime = (seconds?: number): string => {
    if (!seconds || seconds < 0) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const formatMemory = (mb?: number): string => {
    if (!mb) return 'N/A';
    if (mb < 1024) return `${Math.round(mb)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-6 border-2 shadow-xl ${
        isPastel
          ? 'bg-gradient-to-r from-pink-50/80 to-purple-50/80 border-pink-300/30'
          : 'bg-gradient-to-r from-cyan-900/40 to-purple-900/40 border-cyber-cyan-400/30'
      }`}
      style={isPastel ? {
        boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
      } : {}}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className={`w-5 h-5 animate-spin ${
              isPastel ? 'text-pink-500' : 'text-cyan-400'
            }`} />
            <div>
              <p className={`text-base font-semibold ${
                isPastel ? 'text-pink-600' : 'text-cyan-300'
              }`}>Processing...</p>
              <p className={`text-sm ${
                isPastel ? 'text-gray-600' : 'text-gray-300'
              }`}>
                {progress.statusMessage || `Page ${progress.currentPage} of ${progress.totalPages}`}
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className={`p-2 rounded-lg transition-colors ${
                isPastel
                  ? 'hover:bg-pink-100/50 text-gray-600 hover:text-gray-900'
                  : 'hover:bg-gray-700/50 text-gray-400 hover:text-white'
              }`}
              aria-label="Cancel extraction"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${
              isPastel ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Overall Progress
            </span>
            <span className={`font-bold ${
              isPastel ? 'text-pink-500' : 'text-cyan-400'
            }`}>{progress.percentage}%</span>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden border ${
            isPastel
              ? 'bg-pink-50 border-pink-200'
              : 'bg-gray-800 border-gray-700'
          }`}>
            <motion.div
              className={`h-full ${
                isPastel
                  ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400'
                  : 'bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Current Page Progress */}
        {progress.currentPageProgress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${
                isPastel ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Current Page ({progress.currentPage}/{progress.totalPages})
              </span>
              <span className={`font-bold ${
                isPastel ? 'text-purple-500' : 'text-purple-400'
              }`}>{progress.currentPageProgress}%</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden border ${
              isPastel
                ? 'bg-pink-50 border-pink-200'
                : 'bg-gray-800 border-gray-700'
            }`}>
              <motion.div
                className={`h-full ${
                  isPastel
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                    : 'bg-gradient-to-r from-purple-600 to-cyan-600'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress.currentPageProgress}%` }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Estimated Time */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${
            isPastel
              ? 'bg-pink-50/50 border-pink-200/50'
              : 'bg-gray-800/50 border-gray-700/50'
          }`}>
            <div className={`p-2 rounded-lg ${
              isPastel ? 'bg-pink-200/20' : 'bg-cyan-600/20'
            }`}>
              <Clock className={`w-4 h-4 ${
                isPastel ? 'text-pink-500' : 'text-cyan-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs mb-0.5 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>Time Remaining</p>
              <p className={`text-sm font-semibold truncate ${
                isPastel ? 'text-gray-700' : 'text-gray-200'
              }`}>
                {formatTime(progress.estimatedTimeRemaining)}
              </p>
            </div>
          </div>

          {/* Memory Usage */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${
            isPastel
              ? 'bg-pink-50/50 border-pink-200/50'
              : 'bg-gray-800/50 border-gray-700/50'
          }`}>
            <div className={`p-2 rounded-lg ${
              isPastel ? 'bg-purple-200/20' : 'bg-purple-600/20'
            }`}>
              <HardDrive className={`w-4 h-4 ${
                isPastel ? 'text-purple-500' : 'text-purple-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs mb-0.5 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>Memory Usage</p>
              <p className={`text-sm font-semibold truncate ${
                isPastel ? 'text-gray-700' : 'text-gray-200'
              }`}>
                {formatMemory(progress.memoryUsage)}
              </p>
            </div>
          </div>
        </div>

        {/* Page Indicators */}
        <div className="pt-2">
          <div className={`flex items-center justify-between text-xs mb-2 ${
            isPastel ? 'text-gray-600' : 'text-gray-400'
          }`}>
            <span>Page Progress</span>
            <span>
              {progress.currentPage} / {progress.totalPages}
            </span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: Math.min(progress.totalPages, 20) }, (_, i) => {
              const pageNum = i + 1;
              const isCompleted = pageNum < progress.currentPage;
              const isCurrent = pageNum === progress.currentPage;
              // const isPending = pageNum > progress.currentPage;

              return (
                <div
                  key={pageNum}
                  className={`h-2 flex-1 min-w-[8px] rounded transition-all ${
                    isCompleted
                      ? isPastel
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400'
                        : 'bg-gradient-to-r from-cyan-600 to-purple-600'
                      : isCurrent
                      ? isPastel
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse'
                        : 'bg-gradient-to-r from-purple-600 to-cyan-600 animate-pulse'
                      : isPastel
                      ? 'bg-pink-200'
                      : 'bg-gray-700'
                  }`}
                  title={`Page ${pageNum}${isCompleted ? ' (Completed)' : isCurrent ? ' (Processing)' : ' (Pending)'}`}
                />
              );
            })}
            {progress.totalPages > 20 && (
              <div className={`text-xs px-2 py-1 ${
                isPastel ? 'text-gray-500' : 'text-gray-500'
              }`}>
                +{progress.totalPages - 20} more
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
