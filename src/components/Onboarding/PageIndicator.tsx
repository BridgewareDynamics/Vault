import { motion } from 'framer-motion';

interface PageIndicatorProps {
  currentPage: number;
  totalPages: number;
}

export function PageIndicator({ currentPage, totalPages }: PageIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => (
        <motion.div
          key={i}
          className={`h-2 rounded-full ${
            i === currentPage
              ? 'bg-cyber-purple-400'
              : 'bg-cyber-purple-400/30'
          }`}
          initial={{ width: i === currentPage ? '24px' : '8px' }}
          animate={{
            width: i === currentPage ? '24px' : '8px',
            opacity: i === currentPage ? 1 : 0.5,
          }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          style={{
            boxShadow: i === currentPage
              ? '0 0 10px rgba(139, 92, 246, 0.6)'
              : 'none',
          }}
        />
      ))}
    </div>
  );
}
