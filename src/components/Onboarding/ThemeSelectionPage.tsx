import { motion } from 'framer-motion';
import { memo } from 'react';
import { ThemeSelector } from './ThemeSelector';
import { CircularCheckbox } from './CircularCheckbox';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';
import { HolographicEffect } from '../Shared/HolographicEffect';

interface ThemeSelectionPageProps {
  selectedTheme: Theme | null;
  onSelectTheme: (theme: Theme) => void;
  dontShowAgain: boolean;
  onToggleDontShowAgain: (checked: boolean) => void;
  theme?: Theme;
}

export const ThemeSelectionPage = memo(function ThemeSelectionPage({
  selectedTheme,
  onSelectTheme,
  dontShowAgain,
  onToggleDontShowAgain,
  theme = 'brideware-purple',
}: ThemeSelectionPageProps) {
  const isPastel = isLightTheme(theme);
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
  
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 py-12 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        className="text-center space-y-12 max-w-6xl w-full relative z-10"
        style={{ 
          willChange: 'transform, opacity',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        {/* Header */}
        <div>
          <motion.h2
            className={`text-5xl md:text-6xl font-bold mb-6 ${isPastel ? 'text-gray-800' : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent'} bg-[length:200%_auto] ${isPastel ? '' : 'animate-shimmer'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              textShadow: [
                `0 0 30px ${primaryRgba}0.5), 0 0 60px ${secondaryRgba}0.3)`,
                `0 0 40px ${primaryRgba}0.8), 0 0 80px ${secondaryRgba}0.5)`,
                `0 0 30px ${primaryRgba}0.5), 0 0 60px ${secondaryRgba}0.3)`,
              ],
            }}
            transition={{
              opacity: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 },
              y: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 },
            }}
            style={{ 
              willChange: 'transform, opacity',
              transform: 'translate3d(0, 0, 0)',
            }}
          >
            Choose Your Theme
          </motion.h2>
          <motion.p
            className={`text-xl ${isPastel ? 'text-gray-600' : 'text-gray-300'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
            style={{ willChange: 'opacity' }}
          >
            Select a theme that matches your style and workflow
          </motion.p>
        </div>

        {/* Theme Selector with Enhanced Effects */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <HolographicEffect intensity={0.1} className="rounded-3xl overflow-hidden">
            <ThemeSelector selectedTheme={selectedTheme} onSelectTheme={onSelectTheme} theme={theme} />
          </HolographicEffect>
        </motion.div>

        {/* Don't Show Again Checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
          className="flex justify-center pt-8"
          style={{ 
            willChange: 'transform, opacity',
            transform: 'translate3d(0, 0, 0)',
          }}
        >
          <HolographicEffect intensity={0.15} className="rounded-2xl overflow-hidden">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${isPastel ? 'from-slate-100/90 via-pink-50/90 to-slate-100/90' : 'from-gray-900/90 via-gray-800/90 to-gray-900/90'} backdrop-blur-xl border ${isPastel ? 'border-purple-300/20' : 'border-cyber-purple-400/20'}`}
              style={{
                boxShadow: `0 0 20px ${primaryRgba}0.2), inset 0 0 20px ${primaryRgba}0.05)`,
              }}
            >
              <CircularCheckbox
                checked={dontShowAgain}
                onChange={onToggleDontShowAgain}
                label="Don't show this onboarding again"
                theme={theme}
              />
            </div>
          </HolographicEffect>
        </motion.div>

        {/* Completion Message */}
        {selectedTheme && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className={`text-lg ${isPastel ? 'text-purple-600' : 'text-cyber-cyan-400'} font-semibold`}
            style={{ 
              willChange: 'transform, opacity',
              transform: 'translate3d(0, 0, 0)',
            }}
          >
            <motion.div
              animate={{
                textShadow: [
                  `0 0 10px ${secondaryRgba}0.5)`,
                  `0 0 20px ${secondaryRgba}0.8)`,
                  `0 0 10px ${secondaryRgba}0.5)`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              ✓ Theme selected! Ready to continue
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
});
