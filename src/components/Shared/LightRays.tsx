import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';

// Generate light rays
const generateLightRays = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i,
    delay: i * 0.5,
  }));
};

interface LightRaysProps {
  rayCount?: number;
  theme?: Theme;
}

export function LightRays({ rayCount = 8, theme = 'brideware-purple' }: LightRaysProps) {
  const lightRays = useMemo(() => generateLightRays(rayCount), [rayCount]);
  const isPastel = isLightTheme(theme);
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {lightRays.map((ray) => (
        <motion.div
          key={ray.id}
          className="absolute top-1/2 left-1/2 w-1 h-1/2 origin-top"
          style={{
            transform: `rotate(${ray.angle}deg)`,
            transformOrigin: 'top center',
            background: `linear-gradient(to bottom, ${primaryRgba}0.3), transparent)`,
            boxShadow: `0 0 20px ${primaryRgba}0.5)`,
          }}
          initial={{ opacity: 0, scaleY: 0.3 }}
          animate={{
            opacity: [0, 0.2, 0.5, 0.2],
            scaleY: [0.3, 0.6, 1, 0.6],
          }}
          transition={{
            opacity: {
              duration: 1,
              ease: [0.25, 0.1, 0.25, 1],
              delay: 0.4 + (ray.delay * 0.1),
              times: [0, 0.2, 0.5, 1],
              repeat: Infinity,
              repeatDelay: 0.5,
            },
            scaleY: {
              duration: 5,
              repeat: Infinity,
              delay: 1.4 + ray.delay,
              ease: [0.4, 0, 0.6, 1],
            },
          }}
        />
      ))}
    </div>
  );
}
