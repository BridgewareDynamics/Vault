import { motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';
import { HolographicEffect } from '../Shared/HolographicEffect';

interface ThemeSelectorProps {
  selectedTheme: Theme | null;
  onSelectTheme: (theme: Theme) => void;
  theme?: Theme;
}

export function ThemeSelector({ selectedTheme, onSelectTheme, theme = 'brideware-purple' }: ThemeSelectorProps) {
  const isPastel = isLightTheme(theme);
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
  
  const themes: Array<{ name: string; value: Theme; description: string; colors: { primary: string; secondary: string; bg: string } }> = [
    {
      name: 'Brideware Purple',
      value: 'brideware-purple',
      description: 'Dark theme with vibrant purple and cyan accents',
      colors: {
        primary: '#c084fc',
        secondary: '#22d3ee',
        bg: 'from-gray-950 via-purple-950/50 to-gray-950',
      },
    },
    {
      name: 'Pastel',
      value: 'pastel',
      description: 'Light theme with soft pastel colors',
      colors: {
        primary: '#d8b4fe',
        secondary: '#a5b4fc',
        bg: 'from-slate-50 via-pink-50/30 to-slate-50',
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
      {themes.map((themeOption, index) => {
        const isSelected = selectedTheme === themeOption.value;
        return (
          <motion.button
            key={themeOption.value}
            onClick={() => {
              console.log('[ThemeSelector] Theme selected:', themeOption.value);
              onSelectTheme(themeOption.value);
            }}
            className="relative group"
            initial={{ opacity: 0, scale: 0.9, y: 30, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.1, 0.25, 1],
              delay: 0.3 + index * 0.15,
            }}
            whileHover={{ 
              scale: 1.03,
              y: -4,
              transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
            }}
            whileTap={{ scale: 0.98 }}
            style={{ perspective: '1000px' }}
          >
            <HolographicEffect intensity={isSelected ? 0.3 : 0.15} className="rounded-3xl overflow-hidden">
              {/* Animated Border Wrapper */}
              <motion.div
                className="rounded-3xl p-[3px] overflow-hidden"
                style={{
                  backgroundImage: isSelected
                    ? `linear-gradient(45deg, ${primaryRgba}1), ${secondaryRgba}1), ${primaryRgba}1))`
                    : `linear-gradient(45deg, ${primaryRgba}0.4), ${secondaryRgba}0.4), ${primaryRgba}0.4))`,
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: isSelected ? 2 : 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <div
                  className={`w-full relative overflow-hidden rounded-3xl bg-gradient-to-br ${themeOption.value === 'brideware-purple' ? 'from-gray-900/90 via-gray-800/90 to-gray-900/90' : 'from-slate-100/90 via-pink-50/90 to-slate-100/90'} backdrop-blur-xl shadow-2xl transition-all duration-200`}
                  style={{
                    boxShadow: isSelected
                      ? `0 0 50px ${primaryRgba}0.8), inset 0 0 40px ${primaryRgba}0.3), 0 0 80px ${secondaryRgba}0.4)`
                      : `0 0 30px ${primaryRgba}0.3), inset 0 0 30px ${primaryRgba}0.1)`,
                  }}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      className="absolute top-4 right-4 z-20"
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ 
                        duration: 0.5, 
                        ease: [0.34, 1.56, 0.64, 1],
                        type: 'spring',
                        stiffness: 200,
                      }}
                    >
                      <motion.div
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-purple-400 to-cyber-cyan-400 flex items-center justify-center shadow-lg"
                        animate={{
                          scale: [1, 1.2, 1],
                          boxShadow: [
                            `0 0 20px ${primaryRgba}0.8), 0 0 40px ${secondaryRgba}0.4)`,
                            `0 0 30px ${primaryRgba}1), 0 0 60px ${secondaryRgba}0.6)`,
                            `0 0 20px ${primaryRgba}0.8), 0 0 40px ${secondaryRgba}0.4)`,
                          ],
                        }}
                        transition={{
                          scale: {
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          },
                          boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          },
                        }}
                      >
                        <Check className="w-7 h-7 text-white" strokeWidth={3} />
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Enhanced Glow on Hover */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{
                      opacity: 1,
                      transition: { duration: 0.2 },
                    }}
                    style={{
                      background: `radial-gradient(circle at center, ${primaryRgba}0.25) 0%, transparent 70%)`,
                      boxShadow: `0 0 50px ${primaryRgba}0.7), 0 0 80px ${secondaryRgba}0.5)`,
                    }}
                  />

                  {/* Card Content */}
                  <div className="relative z-10 p-10 flex flex-col items-center gap-6">
                    {/* Theme Preview with Animation */}
                    <motion.div
                      className="w-full h-40 rounded-2xl mb-4 relative overflow-hidden"
                      animate={isSelected ? {
                        scale: [1, 1.05, 1],
                      } : {}}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${themeOption.colors.bg}`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${themeOption.colors.primary}, ${themeOption.colors.secondary})`,
                            boxShadow: `0 0 40px ${themeOption.colors.primary}80`,
                          }}
                          animate={isSelected ? {
                            rotate: [0, 360],
                            scale: [1, 1.1, 1],
                          } : {}}
                          transition={{
                            rotate: {
                              duration: 4,
                              repeat: Infinity,
                              ease: 'linear',
                            },
                            scale: {
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            },
                          }}
                        >
                          <Palette className="w-10 h-10 text-white" />
                        </motion.div>
                      </div>
                      
                      {/* Animated Overlay */}
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${primaryRgba}0.2), transparent, ${secondaryRgba}0.2))`,
                            backgroundSize: '200% 200%',
                          }}
                          animate={{
                            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      )}
                    </motion.div>

                    <div className="text-center">
                      <h3 className={`text-2xl font-bold mb-2 ${themeOption.value === 'brideware-purple' ? 'bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent' : 'text-gray-800'}`}>
                        {themeOption.name}
                      </h3>
                      <p className={`text-sm ${themeOption.value === 'brideware-purple' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {themeOption.description}
                      </p>
                    </div>

                    {/* Color Swatches with Animation */}
                    <div className="flex gap-3 mt-4">
                      {[themeOption.colors.primary, themeOption.colors.secondary].map((color, idx) => (
                        <motion.div
                          key={idx}
                          className="w-10 h-10 rounded-full border-2 border-white/20 relative overflow-hidden"
                          style={{
                            background: color,
                            boxShadow: `0 0 15px ${color}80`,
                          }}
                          animate={isSelected ? {
                            scale: [1, 1.2, 1],
                            boxShadow: [
                              `0 0 15px ${color}80`,
                              `0 0 25px ${color}CC`,
                              `0 0 15px ${color}80`,
                            ],
                          } : {}}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: idx * 0.2,
                            ease: 'easeInOut',
                          }}
                        >
                          {isSelected && (
                            <motion.div
                              className="absolute inset-0 rounded-full"
                              style={{
                                background: `radial-gradient(circle, ${secondaryRgba}0.5), transparent)`,
                              }}
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: idx * 0.2,
                                ease: 'easeOut',
                              }}
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </HolographicEffect>
          </motion.button>
        );
      })}
    </div>
  );
}
