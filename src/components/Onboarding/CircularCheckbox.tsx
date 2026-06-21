import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';

interface CircularCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  theme?: Theme;
}

export function CircularCheckbox({ checked, onChange, label, theme = 'brideware-purple' }: CircularCheckboxProps) {
  const isPastel = isLightTheme(theme);
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
  const textColor = isPastel ? 'text-gray-700' : 'text-gray-300';
  const hoverTextColor = isPastel ? 'text-gray-900' : 'text-white';

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 cursor-pointer group"
    >
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        {checked ? (
          <motion.div
            className={`w-7 h-7 rounded-full ${isPastel ? 'bg-gradient-to-br from-purple-300 to-pink-300' : 'bg-gradient-to-br from-cyber-purple-400 to-cyber-cyan-400'} flex items-center justify-center`}
            initial={{ scale: 0.8, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.34, 1.56, 0.64, 1],
              type: 'spring',
              stiffness: 200,
            }}
            style={{
              boxShadow: `0 0 25px ${primaryRgba}0.8), 0 0 50px ${secondaryRgba}0.5)`,
            }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.15 }}
            >
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className={`w-7 h-7 rounded-full border-2 ${isPastel ? 'border-purple-300/50' : 'border-cyber-purple-400/50'}`}
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{
              borderColor: isPastel ? 'rgba(216, 180, 254, 0.8)' : 'rgba(139, 92, 246, 0.8)',
              boxShadow: `0 0 15px ${primaryRgba}0.5)`,
            }}
          />
        )}
      </motion.div>
      <span className={`text-sm ${textColor} group-hover:${hoverTextColor} transition-colors font-medium`}>
        {label}
      </span>
    </button>
  );
}
