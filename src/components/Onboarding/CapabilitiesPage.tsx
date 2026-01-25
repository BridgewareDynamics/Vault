import { motion } from 'framer-motion';
import { memo } from 'react';
import { GraduationCap, Briefcase, FileSearch, Users, BookOpen, Target } from 'lucide-react';
import { Theme } from '../../types';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { NeuralNetwork } from '../Shared/NeuralNetwork';

interface CapabilitiesPageProps {
  theme?: Theme;
}

export const CapabilitiesPage = memo(function CapabilitiesPage({ theme = 'brideware-purple' }: CapabilitiesPageProps) {
  const isPastel = theme === 'pastel';
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
  const cardBg = isPastel 
    ? 'from-slate-100/90 via-pink-50/90 to-slate-100/90' 
    : 'from-gray-900/90 via-gray-800/90 to-gray-900/90';

  const useCases = [
    {
      icon: GraduationCap,
      title: 'Academic Research',
      description: 'Organize thesis materials, research papers, and study documents with ease',
      color: 'from-purple-600 to-cyan-600',
    },
    {
      icon: Briefcase,
      title: 'Legal Practice',
      description: 'Manage case files, evidence, and legal documents securely',
      color: 'from-purple-600 to-cyan-600',
    },
    {
      icon: FileSearch,
      title: 'Document Analysis',
      description: 'Extract and analyze PDF content for research and compliance',
      color: 'from-purple-600 to-cyan-600',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share organized archives with research teams and colleagues',
      color: 'from-purple-600 to-cyan-600',
    },
    {
      icon: BookOpen,
      title: 'Library Management',
      description: 'Catalog and organize digital library collections efficiently',
      color: 'from-purple-600 to-cyan-600',
    },
    {
      icon: Target,
      title: 'Project Organization',
      description: 'Structure project documents and resources systematically',
      color: 'from-purple-600 to-cyan-600',
    },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 py-12 overflow-hidden">
      <NeuralNetwork theme={theme} nodeCount={15} />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        className="text-center space-y-12 max-w-7xl w-full relative z-10"
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
            Perfect For
          </motion.h2>
          <motion.p
            className={`text-xl ${isPastel ? 'text-gray-600' : 'text-gray-300'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
            style={{ willChange: 'opacity' }}
          >
            Discover how The Vault can transform your workflow
          </motion.p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1],
                  delay: 0.4 + index * 0.08,
                }}
                className="relative group"
                whileHover={{ 
                  y: -5,
                  scale: 1.02,
                  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
                }}
                style={{ 
                  willChange: 'transform, opacity',
                  transform: 'translate3d(0, 0, 0)',
                }}
              >
                <HolographicEffect intensity={0.2} className="rounded-3xl overflow-hidden">
                  <motion.div
                    className={`flex flex-col gap-4 p-8 rounded-3xl bg-gradient-to-br ${cardBg} backdrop-blur-xl border ${isPastel ? 'border-purple-300/20' : 'border-cyber-purple-400/20'} relative overflow-hidden`}
                    style={{
                      boxShadow: `0 0 30px ${primaryRgba}0.3), inset 0 0 30px ${primaryRgba}0.1)`,
                    }}
                    whileHover={{
                      boxShadow: `0 0 50px ${primaryRgba}0.6), inset 0 0 50px ${primaryRgba}0.2)`,
                    }}
                  >
                    {/* Animated Background */}
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(circle at center, ${primaryRgba}0.15), transparent)`,
                      }}
                    />

                    {/* Icon */}
                    <motion.div
                      className="relative z-10"
                      animate={{
                        filter: [
                          `drop-shadow(0 0 10px ${primaryRgba}0.5))`,
                          `drop-shadow(0 0 20px ${primaryRgba}0.8))`,
                          `drop-shadow(0 0 10px ${primaryRgba}0.5))`,
                        ],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: index * 0.2,
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${isPastel ? 'from-purple-300 to-pink-300' : 'from-purple-600 to-cyan-600'} rounded-3xl blur-xl opacity-40`}></div>
                      <div className={`relative p-4 bg-gradient-to-br ${isPastel ? 'from-purple-300/90 to-pink-300/90' : 'from-purple-600/90 to-cyan-600/90'} rounded-2xl border ${isPastel ? 'border-purple-300/50' : 'border-cyber-purple-400/50'} w-fit`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </motion.div>
                    
                    {/* Content */}
                    <div className="relative z-10 space-y-2">
                      <h3 className={`text-xl font-bold ${isPastel ? 'text-gray-800' : 'text-white'} ${isPastel ? '' : 'bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent'}`}>
                        {isPastel ? useCase.title : <span className="bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent">{useCase.title}</span>}
                      </h3>
                      <p className={`text-sm ${isPastel ? 'text-gray-600' : 'text-gray-300'}`}>{useCase.description}</p>
                    </div>

                    {/* Corner Accent */}
                    <motion.div
                      className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-tr-3xl"
                      style={{
                        background: `linear-gradient(135deg, ${primaryRgba}0.2), transparent)`,
                      }}
                    />
                  </motion.div>
                </HolographicEffect>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
});
