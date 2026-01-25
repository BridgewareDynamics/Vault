import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { AnimatedGrid } from '../Shared/AnimatedGrid';
import { ParticleBackground } from '../Shared/ParticleBackground';
import { LightRays } from '../Shared/LightRays';
import { OnboardingContent } from './OnboardingContent';
import { FeaturesPage } from './FeaturesPage';
import { CapabilitiesPage } from './CapabilitiesPage';
import { GettingStartedPage } from './GettingStartedPage';
import { ThemeSelectionPage } from './ThemeSelectionPage';
import { AdvancedPageIndicator } from './AdvancedPageIndicator';
import { Theme } from '../../types';
import { ScanLine } from '../Shared/ScanLine';

interface OnboardingModalProps {
  onComplete: (theme: Theme, dontShowAgain: boolean) => void;
}

export const OnboardingModal = memo(function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  console.log('[OnboardingModal] Rendered, selectedTheme:', selectedTheme);
  
  // Log when theme changes
  useEffect(() => {
    console.log('[OnboardingModal] selectedTheme changed to:', selectedTheme);
  }, [selectedTheme]);

  const totalPages = 5; // Increased from 3 to 5

  // Theme colors - default to brideware-purple if no theme selected
  const currentTheme: Theme = selectedTheme || 'brideware-purple';
  const isPastel = currentTheme === 'pastel';
  const bgGradient = isPastel 
    ? 'from-slate-50 via-pink-50/30 to-slate-50' 
    : 'from-gray-950 via-purple-950/50 to-gray-950';
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
  const headerBg = isPastel
    ? 'from-slate-100/80 via-pink-50/30 to-slate-100/80'
    : 'from-gray-900/80 via-purple-900/30 to-gray-900/80';
  const borderColor = isPastel ? 'border-purple-300/20' : 'border-cyber-purple-400/20';
  const buttonBorder = isPastel ? 'border-purple-300/50' : 'border-cyber-purple-400/50';
  const buttonBorderHover = isPastel ? 'border-purple-300/80' : 'border-cyber-purple-400/80';

  const handleContinue = useCallback(() => {
    console.log('[OnboardingModal] handleContinue called, selectedTheme:', selectedTheme, 'type:', typeof selectedTheme);
    if (selectedTheme) {
      console.log('[OnboardingModal] Calling onComplete with theme:', selectedTheme, 'dontShowAgain:', dontShowAgain);
      onComplete(selectedTheme, dontShowAgain);
    } else {
      console.warn('[OnboardingModal] Cannot continue - no theme selected. Current state:', { selectedTheme, currentPage, totalPages });
      // Show alert to user
      alert('Please select a theme before continuing.');
    }
  }, [selectedTheme, dontShowAgain, onComplete, currentPage, totalPages]);

  const canContinue = currentPage === totalPages - 1 && selectedTheme !== null;
  
  // Debug logging
  useEffect(() => {
    console.log('[OnboardingModal] State update - currentPage:', currentPage, 'selectedTheme:', selectedTheme, 'canContinue:', canContinue);
  }, [currentPage, selectedTheme, canContinue]);

  // Optimized page variants - using 2D transforms for better performance
  const pageVariants = useMemo(() => ({
    enter: (direction: number) => ({
      x: direction > 0 ? 600 : -600,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 600 : -600,
      opacity: 0,
      scale: 0.95,
    }),
  }), []);

  const pageTransition = useMemo(() => ({
    x: { type: 'spring', stiffness: 400, damping: 35, mass: 0.8 },
    opacity: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
    scale: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }), []);

  const [direction, setDirection] = useState(0);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setDirection(1);
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handlePrevious = useCallback(() => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const modalContent = (
    <motion.div
      data-onboarding-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ 
        pointerEvents: 'auto',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        display: 'flex',
        visibility: 'visible',
      }}
    >
      {/* Enhanced Backdrop with Animation */}
      <motion.div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ 
          willChange: 'opacity',
        }}
      />

      {/* Background Effects - Optimized counts for better performance */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`} style={{ willChange: 'auto' }}>
        <AnimatedGrid theme={currentTheme} />
        <ParticleBackground theme={currentTheme} particleCount={40} />
        <LightRays theme={currentTheme} rayCount={8} />
        {/* Only show global ScanLine on pages other than the first page */}
        {currentPage !== 0 && <ScanLine theme={currentTheme} speed={15} />}
      </div>

      {/* Modal Content */}
      <motion.div
        className="relative z-10 w-full h-full flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.4, 
          ease: [0.25, 0.1, 0.25, 1],
        }}
        style={{ 
          willChange: 'transform, opacity',
          transform: 'translate3d(0, 0, 0)', // Force GPU acceleration
        }}
      >
        {/* Page Content */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="absolute inset-0"
              style={{ 
                willChange: 'transform, opacity',
                transform: 'translate3d(0, 0, 0)', // Force GPU acceleration
              }}
            >
              {currentPage === 0 && <OnboardingContent theme={currentTheme} />}
              {currentPage === 1 && <FeaturesPage theme={currentTheme} />}
              {currentPage === 2 && <CapabilitiesPage theme={currentTheme} />}
              {currentPage === 3 && <GettingStartedPage theme={currentTheme} />}
              {currentPage === 4 && (
                <ThemeSelectionPage
                  selectedTheme={selectedTheme}
                  onSelectTheme={setSelectedTheme}
                  dontShowAgain={dontShowAgain}
                  onToggleDontShowAgain={setDontShowAgain}
                  theme={currentTheme}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Enhanced Navigation Footer */}
        <motion.div
          className={`relative z-20 px-8 py-6 border-t ${borderColor} bg-gradient-to-r ${headerBg} backdrop-blur-xl`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
          style={{ 
            willChange: 'transform, opacity',
            transform: 'translate3d(0, 0, 0)',
          }}
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            {/* Advanced Page Indicator */}
            <div className="flex-1 flex justify-center">
              <AdvancedPageIndicator currentPage={currentPage} totalPages={totalPages} theme={currentTheme} />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4">
              <motion.button
                onClick={handlePrevious}
                disabled={currentPage === 0}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  currentPage === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : `${isPastel ? 'bg-slate-200/90' : 'bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90'} backdrop-blur-xl border ${buttonBorder} ${isPastel ? 'text-gray-700' : 'text-white'} hover:${buttonBorderHover}`
                }`}
                whileHover={currentPage > 0 ? { 
                  scale: 1.05, 
                  y: -2,
                  boxShadow: `0 0 20px ${primaryRgba}0.4)`,
                } : {}}
                whileTap={currentPage > 0 ? { scale: 0.98 } : {}}
                style={{
                  boxShadow: currentPage > 0
                    ? `0 0 20px ${primaryRgba}0.3), inset 0 0 20px ${primaryRgba}0.1)`
                    : 'none',
                }}
              >
                <div className="flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </div>
              </motion.button>

              {currentPage === totalPages - 1 ? (
                <motion.button
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    canContinue
                      ? `${isPastel ? 'bg-gradient-to-br from-purple-300 to-pink-300' : 'bg-gradient-to-br from-cyber-purple-400 to-cyber-cyan-400'} text-white hover:shadow-lg`
                      : `opacity-50 cursor-not-allowed ${isPastel ? 'bg-slate-200' : 'bg-gray-800'} ${isPastel ? 'text-gray-500' : 'text-gray-500'}`
                  }`}
                  whileHover={canContinue ? { 
                    scale: 1.05, 
                    y: -2,
                  } : {}}
                  whileTap={canContinue ? { scale: 0.98 } : {}}
                  style={{
                    boxShadow: canContinue
                      ? `0 0 40px ${primaryRgba}0.8), 0 0 80px ${secondaryRgba}0.5)`
                      : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>Complete Setup</span>
                    <Sparkles className="w-5 h-5" />
                  </div>
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleNext}
                  className={`px-8 py-3 rounded-xl font-semibold ${isPastel ? 'bg-gradient-to-br from-purple-300 to-pink-300' : 'bg-gradient-to-br from-cyber-purple-400 to-cyber-cyan-400'} text-white transition-all duration-200 hover:shadow-lg`}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    boxShadow: `0 0 40px ${primaryRgba}0.7), 0 0 80px ${secondaryRgba}0.4)`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  // Render directly (portal might be causing issues)
  return modalContent;
});
