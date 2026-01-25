import { motion } from 'framer-motion';
import { Toast as ToastType, Theme } from '../../types';
import { X } from 'lucide-react';
import { useSettingsContext } from '../../utils/settingsContext';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { settings: appSettings } = useSettingsContext();
  const theme: Theme = (appSettings?.theme as Theme) || 'brideware-purple';
  const isPastel = theme === 'pastel';

  const getToastStyles = () => {
    if (isPastel) {
      switch (toast.type) {
        case 'success':
          return 'bg-gradient-to-r from-pink-200/90 via-purple-200/90 to-pink-200/90 border-pink-300/50';
        case 'error':
          return 'bg-gradient-to-r from-red-200/90 to-red-300/90 border-red-300/50';
        case 'warning':
          return 'bg-gradient-to-r from-yellow-200/90 to-yellow-300/90 border-yellow-300/50';
        default:
          return 'bg-gradient-to-r from-pink-200/90 via-purple-200/90 to-blue-200/90 border-pink-300/50';
      }
    } else {
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
        border-2 backdrop-blur-sm
        min-w-[300px] max-w-[400px]
        ${isPastel ? 'shadow-lg' : 'shadow-lg'}
      `}
      style={isPastel ? {
        boxShadow: '0 4px 20px rgba(251, 182, 206, 0.2), 0 0 0 1px rgba(251, 182, 206, 0.1)',
      } : {}}
    >
      <div className={`flex-1 font-medium text-sm ${
        isPastel ? 'text-gray-800' : 'text-white'
      }`}>
        {toast.message}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`flex-shrink-0 transition-colors ${
          isPastel
            ? 'text-gray-700/80 hover:text-gray-900'
            : 'text-white/80 hover:text-white'
        }`}
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>
    </motion.div>
  );
}

