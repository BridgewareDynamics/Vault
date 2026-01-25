import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Theme } from '../../types';

// Generate particles for background
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    return {
      id: i,
      size: Math.random() * 3 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 20,
      duration: Math.random() * 10 + 15,
    };
  });
};

interface ParticleBackgroundProps {
  particleCount?: number;
  theme?: Theme;
}

export function ParticleBackground({ particleCount = 50, theme = 'brideware-purple' }: ParticleBackgroundProps) {
  const particles = useMemo(() => generateParticles(particleCount), [particleCount]);
  const isPastel = theme === 'pastel';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${isPastel ? 'bg-purple-300' : 'bg-cyber-cyan-400'}`}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            boxShadow: `0 0 ${particle.size * 4}px ${secondaryRgba}0.6)`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            y: [0, -80, 0],
            x: [0, Math.sin(particle.id) * 30, 0],
            opacity: [0, 0.3, 0.7, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            opacity: {
              duration: 1.2,
              ease: [0.25, 0.1, 0.25, 1],
              delay: 0.3 + (particle.delay * 0.1),
              times: [0, 0.3, 0.7, 1],
            },
            y: {
              duration: particle.duration,
              repeat: Infinity,
              delay: 1.2 + particle.delay,
              ease: [0.4, 0, 0.6, 1],
            },
            x: {
              duration: particle.duration,
              repeat: Infinity,
              delay: 1.2 + particle.delay,
              ease: [0.4, 0, 0.6, 1],
            },
            scale: {
              duration: particle.duration,
              repeat: Infinity,
              delay: 1.2 + particle.delay,
              ease: [0.4, 0, 0.6, 1],
            },
          }}
        />
      ))}
    </div>
  );
}
