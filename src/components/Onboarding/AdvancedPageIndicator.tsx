import { motion } from 'framer-motion';
import { Theme } from '../../types';

interface AdvancedPageIndicatorProps {
  currentPage: number;
  totalPages: number;
  theme?: Theme;
}

export function AdvancedPageIndicator({ currentPage, totalPages, theme = 'brideware-purple' }: AdvancedPageIndicatorProps) {
  const isPastel = theme === 'pastel';
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
  const progress = ((currentPage + 1) / totalPages) * 100;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Progress Bar */}
      <div className="relative w-64 h-2 rounded-full overflow-hidden" style={{
        background: isPastel 
          ? 'rgba(216, 180, 254, 0.2)' 
          : 'rgba(139, 92, 246, 0.2)',
      }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${primaryRgba}1), ${secondaryRgba}1))`,
            boxShadow: `0 0 20px ${primaryRgba}0.8), 0 0 40px ${secondaryRgba}0.4)`,
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <motion.div
          className="absolute inset-y-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${secondaryRgba}0.5), transparent)`,
            width: '30%',
            left: `${progress - 15}%`,
          }}
          animate={{
            x: [0, 100, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Page Dots */}
      <div className="flex items-center gap-3">
        {Array.from({ length: totalPages }, (_, i) => (
          <motion.div
            key={i}
            className="relative"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{
              scale: i === currentPage ? 1.2 : 0.8,
              opacity: i === currentPage ? 1 : 0.4,
            }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <motion.div
              className={`rounded-full ${
                i === currentPage
                  ? isPastel
                    ? 'bg-purple-400'
                    : 'bg-cyber-purple-400'
                  : isPastel
                    ? 'bg-purple-300/30'
                    : 'bg-cyber-purple-400/30'
              }`}
              style={{
                width: i === currentPage ? '12px' : '8px',
                height: i === currentPage ? '12px' : '8px',
                boxShadow: i === currentPage
                  ? `0 0 15px ${primaryRgba}0.8), 0 0 30px ${secondaryRgba}0.4)`
                  : 'none',
              }}
              animate={
                i === currentPage
                  ? {
                      scale: [1, 1.3, 1],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {i === currentPage && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${primaryRgba}0.5), transparent)`,
                  boxShadow: `0 0 20px ${primaryRgba}0.6)`,
                }}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Page Number */}
      <motion.div
        className={`text-sm font-semibold ${isPastel ? 'text-gray-600' : 'text-gray-400'}`}
        key={currentPage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {currentPage + 1} / {totalPages}
      </motion.div>
    </div>
  );
}
