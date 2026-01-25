import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface HolographicEffectProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export function HolographicEffect({ children, className = '', intensity = 0.3 }: HolographicEffectProps) {
  // Extract rounded classes from className to apply to overlay
  const roundedClass = className.match(/rounded-[a-z0-9-]+/)?.[0] || '';
  
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`absolute inset-0 pointer-events-none ${roundedClass}`}
        style={{
          backgroundImage: `linear-gradient(
            135deg,
            rgba(139, 92, 246, ${intensity}) 0%,
            rgba(34, 211, 238, ${intensity * 0.8}) 25%,
            rgba(139, 92, 246, ${intensity}) 50%,
            rgba(236, 72, 153, ${intensity * 0.6}) 75%,
            rgba(139, 92, 246, ${intensity}) 100%
          )`,
          backgroundSize: '200% 200%',
          mixBlendMode: 'overlay',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
