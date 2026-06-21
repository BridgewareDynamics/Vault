import { motion } from 'framer-motion';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';

interface ScanLineProps {
  theme?: Theme;
  speed?: number;
}

export function ScanLine({ theme = 'brideware-purple', speed = 8 }: ScanLineProps) {
  const isPastel = isLightTheme(theme);
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        background: `linear-gradient(
          to bottom,
          transparent 0%,
          ${primaryRgba}0.1) 45%,
          ${primaryRgba}0.3) 50%,
          ${primaryRgba}0.1) 55%,
          transparent 100%
        )`,
        height: '2px',
      }}
      initial={{ y: '-100%' }}
      animate={{ y: '200%' }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'linear',
        repeatDelay: 2,
      }}
    />
  );
}
