import { useState, useEffect, useMemo, useCallback, memo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { AnimatedGrid } from '../Shared/AnimatedGrid';

import { ParticleBackground } from '../Shared/ParticleBackground';

import { OnboardingContent } from './OnboardingContent';

import { FeaturesPage } from './FeaturesPage';

import { CapabilitiesPage } from './CapabilitiesPage';

import { GettingStartedPage } from './GettingStartedPage';

import { MapWorkspacePage } from './MapWorkspacePage';

import { ThemeSelectionPage } from './ThemeSelectionPage';

import { AdvancedPageIndicator } from './AdvancedPageIndicator';

import { ONBOARDING_PAGES } from './onboardingPages';

import { Theme } from '../../types';

import { isLightTheme } from '../../theme/themeSemantics';



interface OnboardingModalProps {

  onComplete: (theme: Theme, dontShowAgain: boolean) => void;

}



export const OnboardingModal = memo(function OnboardingModal({ onComplete }: OnboardingModalProps) {

  const [currentPage, setCurrentPage] = useState(0);

  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  const [dontShowAgain, setDontShowAgain] = useState(false);



  const totalPages = ONBOARDING_PAGES.length;



  const currentTheme: Theme = selectedTheme || 'brideware-purple';

  const isPastel = isLightTheme(currentTheme);

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

    if (selectedTheme) {

      onComplete(selectedTheme, dontShowAgain);

    }

  }, [selectedTheme, dontShowAgain, onComplete]);



  const canContinue = currentPage === totalPages - 1 && selectedTheme !== null;



  const pageVariants = useMemo(

    () => ({

      enter: (direction: number) => ({

        x: direction > 0 ? 480 : -480,

        opacity: 0,

        scale: 0.97,

        filter: 'blur(6px)',

      }),

      center: {

        x: 0,

        opacity: 1,

        scale: 1,

        filter: 'blur(0px)',

      },

      exit: (direction: number) => ({

        x: direction < 0 ? 480 : -480,

        opacity: 0,

        scale: 0.97,

        filter: 'blur(6px)',

      }),

    }),

    [],

  );



  const pageTransition = useMemo(

    () => ({

      x: { type: 'spring', stiffness: 320, damping: 32, mass: 0.85 },

      opacity: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },

      scale: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },

      filter: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },

    }),

    [],

  );



  const [direction, setDirection] = useState(0);



  const handleNext = useCallback(() => {

    if (currentPage < totalPages - 1) {

      setDirection(1);

      setCurrentPage((prev) => prev + 1);

    }

  }, [currentPage, totalPages]);



  const handlePrevious = useCallback(() => {

    if (currentPage > 0) {

      setDirection(-1);

      setCurrentPage((prev) => prev - 1);

    }

  }, [currentPage]);



  const handlePageSelect = useCallback(

    (page: number) => {

      if (page === currentPage) return;

      setDirection(page > currentPage ? 1 : -1);

      setCurrentPage(page);

    },

    [currentPage],

  );



  useEffect(() => {

    const onKeyDown = (event: KeyboardEvent) => {

      if (event.key === 'ArrowRight' && currentPage < totalPages - 1) {

        event.preventDefault();

        handleNext();

      } else if (event.key === 'ArrowLeft' && currentPage > 0) {

        event.preventDefault();

        handlePrevious();

      } else if (event.key === 'Enter' && canContinue) {

        event.preventDefault();

        handleContinue();

      }

    };



    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);

  }, [canContinue, currentPage, handleContinue, handleNext, handlePrevious, totalPages]);



  const currentMeta = ONBOARDING_PAGES[currentPage];

  const CurrentIcon = currentMeta.icon;



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

      <motion.div

        className="absolute inset-0 bg-black/90 backdrop-blur-sm"

        initial={{ opacity: 0 }}

        animate={{ opacity: 1 }}

        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}

      />



      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`}>
        <AnimatedGrid theme={currentTheme} />
        <ParticleBackground theme={currentTheme} particleCount={36} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 55% at 50% 42%, ${primaryRgba}0.08), transparent 70%),
              radial-gradient(ellipse 90% 80% at 50% 50%, transparent 35%, rgba(0,0,0,0.45) 100%)
            `,
          }}
        />
      </div>



      <motion.div

        className="relative z-10 flex h-full min-h-0 w-full flex-col overflow-hidden"

        initial={{ scale: 0.96, opacity: 0 }}

        animate={{ scale: 1, opacity: 1 }}

        transition={{

          duration: 0.45,

          ease: [0.25, 0.1, 0.25, 1],

        }}

        style={{

          willChange: 'transform, opacity',

          transform: 'translate3d(0, 0, 0)',

        }}

      >

        <motion.div

          className={`relative z-20 shrink-0 border-b ${borderColor} bg-gradient-to-r ${headerBg} px-4 py-2.5 sm:px-6 backdrop-blur-xl`}

          initial={{ opacity: 0, y: -16 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}

        >

          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">

            <AnimatePresence mode="wait">

              <motion.div

                key={currentPage}

                className="flex items-center gap-4"

                initial={{ opacity: 0, x: -12 }}

                animate={{ opacity: 1, x: 0 }}

                exit={{ opacity: 0, x: 12 }}

                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}

              >

                <div

                  className={`flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md ${

                    isPastel

                      ? 'border-purple-300/40 bg-white/80'

                      : 'border-cyber-purple-400/30 bg-gray-900/70'

                  }`}

                  style={{

                    boxShadow: `0 0 20px ${primaryRgba}0.35)`,

                  }}

                >

                  <CurrentIcon

                    className={`h-5 w-5 ${isPastel ? 'text-purple-600' : 'text-cyber-cyan-300'}`}

                  />

                </div>

                <div className="text-left">

                  <p

                    className={`text-xs font-semibold uppercase tracking-[0.28em] ${

                      isPastel ? 'text-purple-500' : 'text-cyber-cyan-400'

                    }`}

                  >

                    Vault Onboarding

                  </p>

                  <h2
                    className={`text-base font-bold sm:text-lg ${
                      isPastel
                        ? 'text-gray-800'
                        : 'bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent'
                    }`}
                  >
                    {currentMeta.title}
                  </h2>
                  <p className={`text-[11px] ${isPastel ? 'text-gray-500' : 'text-gray-500'}`}>
                    {currentMeta.subtitle}
                  </p>

                </div>

              </motion.div>

            </AnimatePresence>



            <div

              className={`hidden md:flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur-md ${

                isPastel

                  ? 'border-purple-200/40 bg-white/70 text-gray-500'

                  : 'border-white/10 bg-gray-900/50 text-gray-400'

              }`}

            >

              <span className={isPastel ? 'text-purple-500' : 'text-cyber-cyan-400'}>← →</span>

              Navigate

              <span className="opacity-40">·</span>

              <span>Enter to finish</span>

            </div>

          </div>

        </motion.div>



        <div className="relative min-h-0 flex-1 overflow-hidden">

          <AnimatePresence mode="wait" custom={direction}>

            <motion.div

              key={currentPage}

              custom={direction}

              variants={pageVariants}

              initial="enter"

              animate="center"

              exit="exit"

              transition={pageTransition}

              className="absolute inset-0 overflow-hidden"

              style={{

                willChange: 'transform, opacity, filter',

                transform: 'translate3d(0, 0, 0)',

              }}

            >

              {currentPage === 0 && <OnboardingContent theme={currentTheme} />}

              {currentPage === 1 && <FeaturesPage theme={currentTheme} />}

              {currentPage === 2 && <MapWorkspacePage theme={currentTheme} />}

              {currentPage === 3 && <CapabilitiesPage theme={currentTheme} />}

              {currentPage === 4 && <GettingStartedPage theme={currentTheme} />}

              {currentPage === 5 && (

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



        <motion.div

          className={`relative z-20 shrink-0 border-t ${borderColor} bg-gradient-to-r ${headerBg} px-4 py-3 sm:px-6 backdrop-blur-xl`}

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}

        >

          <div className="mx-auto flex max-w-6xl items-center gap-2 sm:gap-3">
            <motion.button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentPage === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : `${isPastel ? 'bg-slate-200/90' : 'bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90'} backdrop-blur-xl border ${buttonBorder} ${isPastel ? 'text-gray-700' : 'text-white'} hover:${buttonBorderHover}`
              }`}
              whileHover={
                currentPage > 0
                  ? {
                      scale: 1.04,
                      y: -2,
                      boxShadow: `0 0 20px ${primaryRgba}0.4)`,
                    }
                  : {}
              }
              whileTap={currentPage > 0 ? { scale: 0.98 } : {}}
              style={{
                boxShadow:
                  currentPage > 0
                    ? `0 0 20px ${primaryRgba}0.25), inset 0 0 20px ${primaryRgba}0.08)`
                    : 'none',
              }}
            >
              <div className="flex items-center gap-1.5">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </div>
            </motion.button>

            <AdvancedPageIndicator
              currentPage={currentPage}
              totalPages={totalPages}
              theme={currentTheme}
              onPageSelect={handlePageSelect}
            />

            {currentPage === totalPages - 1 ? (
              <motion.button
                onClick={handleContinue}
                disabled={!canContinue}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  canContinue
                    ? `${isPastel ? 'bg-gradient-to-br from-purple-300 to-pink-300' : 'bg-gradient-to-br from-cyber-purple-400 to-cyber-cyan-400'} text-white hover:shadow-lg`
                    : `opacity-50 cursor-not-allowed ${isPastel ? 'bg-slate-200' : 'bg-gray-800'} text-gray-500`
                }`}
                whileHover={
                  canContinue
                    ? {
                        scale: 1.04,
                        y: -2,
                      }
                    : {}
                }
                whileTap={canContinue ? { scale: 0.98 } : {}}
                style={{
                  boxShadow: canContinue
                    ? `0 0 40px ${primaryRgba}0.8), 0 0 80px ${secondaryRgba}0.5)`
                    : 'none',
                }}
              >
                Complete Setup
              </motion.button>
            ) : (
              <motion.button
                onClick={handleNext}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold ${isPastel ? 'bg-gradient-to-br from-purple-300 to-pink-300' : 'bg-gradient-to-br from-cyber-purple-400 to-cyber-cyan-400'} text-white transition-all duration-200 hover:shadow-lg`}
                whileHover={{
                  scale: 1.04,
                  y: -2,
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow: `0 0 40px ${primaryRgba}0.7), 0 0 80px ${secondaryRgba}0.4)`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.button>
            )}
          </div>

        </motion.div>

      </motion.div>

    </motion.div>

  );



  return modalContent;

});


