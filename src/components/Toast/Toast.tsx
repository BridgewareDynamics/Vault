import { motion, AnimatePresence } from 'framer-motion';
import { Toast as ToastType } from '../../types';
import { X } from 'lucide-react';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-gradient-to-r from-cyber-purple-600 to-cyber-purple-500 border-cyber-cyan-400';
      case 'error':
        return 'bg-gradient-to-r from-red-600 to-red-500 border-red-400';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-600 to-yellow-500 border-yellow-400';
      default:
        return 'bg-gradient-purple border-cyber-cyan-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        relative flex items-center gap-3 px-4 py-3 rounded-lg
        ${getToastStyles()}
        border-2 shadow-lg backdrop-blur-sm
        min-w-[300px] max-w-[400px]
      `}
    >
      <div className="flex-1 text-white font-medium text-sm">
        {toast.message}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>
    </motion.div>
  );
}

