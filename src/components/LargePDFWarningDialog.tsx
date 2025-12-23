import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, HardDrive, X } from 'lucide-react';

interface LargePDFWarningDialogProps {
  isOpen: boolean;
  fileSize: number;
  totalMemory: number;
  freeMemory: number;
  onContinue: () => void;
  onSplit: () => void;
  onCancel: () => void;
}

export function LargePDFWarningDialog({
  isOpen,
  fileSize,
  totalMemory,
  freeMemory,
  onContinue,
  onSplit,
  onCancel,
}: LargePDFWarningDialogProps) {
  if (!isOpen) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${bytes} bytes`;
  };

  const fileSizeFormatted = formatBytes(fileSize);
  const totalMemoryFormatted = formatBytes(totalMemory);
  const freeMemoryFormatted = formatBytes(freeMemory);
  const usedMemory = totalMemory - freeMemory;
  const usedMemoryFormatted = formatBytes(usedMemory);
  const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(1);
  
  // Calculate estimated memory needed (file size + overhead)
  const estimatedMemoryNeeded = fileSize * 1.5; // 1.5x for overhead
  const estimatedMemoryFormatted = formatBytes(estimatedMemoryNeeded);
  const hasEnoughMemory = freeMemory > estimatedMemoryNeeded;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onCancel}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="large-pdf-warning-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border-2 border-cyber-purple-500/60 shadow-2xl p-8 max-w-2xl w-full relative overflow-hidden"
        >
          {/* Animated background glow */}
          <motion.div
            animate={{
              background: [
                'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 pointer-events-none"
          />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/40 flex-shrink-0"
              >
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </motion.div>
              
              <div className="flex-1">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  id="large-pdf-warning-title"
                  className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-2"
                >
                  Large PDF File Detected
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-300 text-lg"
                >
                  Opening this file may significantly increase memory usage
                </motion.p>
              </div>

              <button
                onClick={onCancel}
                className="flex-shrink-0 p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* File Size Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 border border-cyber-purple-500/30 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <HardDrive className="w-5 h-5 text-cyber-cyan-400" />
                <span className="text-gray-300 font-medium">File Size:</span>
                <span className="text-white font-bold text-lg">{fileSizeFormatted}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Estimated memory needed: <span className="text-yellow-400 font-semibold">{estimatedMemoryFormatted}</span>
              </div>
            </motion.div>

            {/* System Memory Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800/50 border border-cyber-cyan-500/30 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <HardDrive className="w-5 h-5 text-cyber-cyan-400" />
                <span className="text-gray-300 font-medium">System Memory:</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total RAM:</span>
                  <span className="text-white font-semibold">{totalMemoryFormatted}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Used:</span>
                  <span className="text-orange-400 font-semibold">{usedMemoryFormatted}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Available:</span>
                  <span className={hasEnoughMemory ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                    {freeMemoryFormatted}
                  </span>
                </div>

                {/* Memory Usage Bar */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-400 text-xs">Memory Usage</span>
                    <span className="text-gray-400 text-xs">{memoryUsagePercent}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${memoryUsagePercent}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                      className={`h-full ${
                        parseFloat(memoryUsagePercent) > 80 
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : parseFloat(memoryUsagePercent) > 60
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                          : 'bg-gradient-to-r from-cyber-cyan-500 to-cyber-cyan-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Warning Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6"
            >
              <p className="text-yellow-200 text-sm leading-relaxed">
                {hasEnoughMemory ? (
                  <>
                    You have sufficient available memory ({freeMemoryFormatted}) to load this file. 
                    However, loading a {fileSizeFormatted} PDF will temporarily use significant system resources.
                  </>
                ) : (
                  <>
                    <strong>Warning:</strong> You may not have enough available memory ({freeMemoryFormatted}) 
                    to safely load this {fileSizeFormatted} file. This could cause the application to crash or become unresponsive.
                  </>
                )}
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-3"
            >
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 font-semibold hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              
              <button
                onClick={onSplit}
                disabled
                className="flex-1 px-6 py-3 bg-gray-700/50 text-gray-500 rounded-lg cursor-not-allowed font-semibold relative"
                title="Coming soon"
              >
                <span className="relative">
                  Split PDF
                  <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold">
                    WIP
                  </span>
                </span>
              </button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onContinue}
                className={`flex-1 px-6 py-3 rounded-lg transition-all duration-200 font-semibold ${
                  hasEnoughMemory
                    ? 'bg-gradient-to-r from-cyber-purple-600 to-cyber-purple-500 text-white hover:opacity-90 shadow-lg shadow-cyber-purple-500/50'
                    : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:opacity-90 shadow-lg shadow-orange-500/50'
                }`}
              >
                Continue
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


