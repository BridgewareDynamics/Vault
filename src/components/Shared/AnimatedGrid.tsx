import { motion } from 'framer-motion';
import { Theme } from '../../types';

interface AnimatedGridProps {
  theme?: Theme;
}

export function AnimatedGrid({ theme = 'brideware-purple' }: AnimatedGridProps) {
  const isPastel = theme === 'pastel';
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  
  return (
    <motion.div 
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.2 }}
      transition={{ 
        duration: 1,
        ease: [0.25, 0.1, 0.25, 1],
        delay: 0.15,
      }}
    >
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${primaryRgba}0.1) 1px, transparent 1px),
            linear-gradient(90deg, ${primaryRgba}0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)',
        }}
      />
    </motion.div>
  );
}
