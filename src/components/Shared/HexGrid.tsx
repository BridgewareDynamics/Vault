import { motion } from 'framer-motion';
import { Theme } from '../../types';

interface HexGridProps {
  theme?: Theme;
  density?: number;
}

export function HexGrid({ theme = 'brideware-purple', density = 20 }: HexGridProps) {
  const isPastel = theme === 'pastel';
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
  
  const hexagons = Array.from({ length: density }, (_, i) => ({
    id: i,
    x: (i % 5) * 20 + (Math.floor(i / 5) % 2) * 10,
    y: Math.floor(i / 5) * 18,
    delay: i * 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="hexPattern" x="0" y="0" width="20" height="18" patternUnits="userSpaceOnUse">
            <polygon
              points="10,0 20,5 20,13 10,18 0,13 0,5"
              fill="none"
              stroke={isPastel ? 'rgba(216, 180, 254, 0.1)' : 'rgba(139, 92, 246, 0.15)'}
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#hexPattern)" />
      </svg>
      {hexagons.map((hex) => (
        <motion.div
          key={hex.id}
          className="absolute"
          style={{
            left: `${hex.x}%`,
            top: `${hex.y}%`,
            width: '20px',
            height: '20px',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: `radial-gradient(circle, ${primaryRgba}0.2), transparent)`,
            boxShadow: `0 0 10px ${secondaryRgba}0.3)`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.6, 0.3, 0.6, 0],
            scale: [0, 1, 1.2, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: hex.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
