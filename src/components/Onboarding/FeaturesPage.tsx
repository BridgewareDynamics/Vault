import { motion } from 'framer-motion';
import { memo } from 'react';
import { FileText, FolderOpen, Shield, Search, Layers, Settings, Map as MapIcon } from 'lucide-react';
import { Theme } from '../../types';
import { HolographicEffect } from '../Shared/HolographicEffect';
import { ScanLine } from '../Shared/ScanLine';

interface FeaturesPageProps {
  theme?: Theme;
}

export const FeaturesPage = memo(function FeaturesPage({ theme = 'brideware-purple' }: FeaturesPageProps) {
  const isPastel = theme === 'pastel';
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';
  const cardBg = isPastel 
    ? 'from-slate-100/90 via-pink-50/90 to-slate-100/90' 
    : 'from-gray-900/90 via-gray-800/90 to-gray-900/90';
  
  const features = [
    {
      icon: FileText,
      title: 'PDF to PNG',
      description: 'Extract individual pages from PDF files with customizable quality settings and batch processing',
      color: 'from-purple-600 to-cyan-600',
      details: ['High-quality extraction', 'Batch processing', 'Custom DPI settings', 'Multiple format support'],
    },
    {
      icon: FolderOpen,
      title: 'The Vault',
      description: 'Organize your research materials in a structured archive system with case management',
      color: 'from-purple-600 to-cyan-600',
      details: ['Case folders', 'Category tags', 'Background images', 'Quick search'],
    },
    {
      icon: MapIcon,
      title: 'Map',
      description: 'Build research timelines with dated blocks, attachments, and notes',
      color: 'from-purple-600 to-cyan-600',
      details: ['Tier-based chronology', 'File attachments', 'Timeline canvas', 'Vault & case save'],
    },
    {
      icon: Shield,
      title: 'PDF Audit',
      description: 'Comprehensive security and redaction analysis for your documents',
      color: 'from-purple-600 to-cyan-600',
      details: ['Security analysis', 'Redaction detection', 'Metadata extraction', 'Compliance reports'],
    },
  ];

  const additionalFeatures = [
    { icon: Search, title: 'Advanced Search', description: 'Find files quickly across growing research libraries' },
    { icon: Layers, title: 'Connected Workflow', description: 'Move from archive records into maps without losing context' },
    { icon: Settings, title: 'Customizable', description: 'Tailor themes and workspace behavior to your workflow' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 py-12 overflow-hidden">
      <ScanLine theme={theme} speed={12} />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        className="text-center space-y-16 max-w-7xl w-full relative z-10"
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
            Powerful Features
          </motion.h2>
          <motion.p
            className={`text-xl ${isPastel ? 'text-gray-600' : 'text-gray-300'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
            style={{ willChange: 'opacity' }}
          >
            Extract, archive, map, and audit from one connected research workspace
          </motion.p>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1],
                  delay: 0.4 + index * 0.1,
                }}
                className="relative group"
                whileHover={{ 
                  y: -6,
                  scale: 1.02,
                  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
                }}
                style={{ 
                  willChange: 'transform, opacity',
                  transform: 'translate3d(0, 0, 0)',
                }}
              >
                <HolographicEffect intensity={0.25} className="rounded-3xl overflow-hidden">
                  <motion.div
                    className="rounded-3xl p-[3px] overflow-hidden"
                    style={{
                      backgroundImage: `linear-gradient(45deg, ${primaryRgba}0.9), ${secondaryRgba}0.9), ${primaryRgba}0.9))`,
                      backgroundSize: '200% 200%',
                    }}
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <div
                      className={`w-full relative overflow-hidden rounded-3xl bg-gradient-to-br ${cardBg} backdrop-blur-xl shadow-2xl transition-all duration-200`}
                      style={{
                        boxShadow: `0 0 40px ${primaryRgba}0.4), inset 0 0 40px ${primaryRgba}0.1)`,
                      }}
                    >
                      {/* Enhanced Glow on Hover */}
                      <motion.div
                        className="absolute inset-0 rounded-3xl pointer-events-none"
                        initial={{ opacity: 0 }}
                        whileHover={{
                          opacity: 1,
                          transition: { duration: 0.2 },
                        }}
                        style={{
                          background: `radial-gradient(circle at center, ${primaryRgba}0.3) 0%, transparent 70%)`,
                          boxShadow: `0 0 60px ${primaryRgba}0.8), 0 0 100px ${secondaryRgba}0.5)`,
                        }}
                      />

                      {/* Card Content */}
                      <div className="relative z-10 p-10 flex flex-col items-center gap-6">
                        <motion.div
                          className="relative"
                          animate={{
                            filter: [
                              `drop-shadow(0 0 20px ${primaryRgba}0.7))`,
                              `drop-shadow(0 0 30px ${primaryRgba}1))`,
                              `drop-shadow(0 0 20px ${primaryRgba}0.7))`,
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: index * 0.3,
                          }}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${isPastel ? 'from-purple-300 to-pink-300' : 'from-purple-600 to-cyan-600'} rounded-3xl blur-2xl opacity-60`}></div>
                          <motion.div
                            className={`relative p-6 bg-gradient-to-br ${isPastel ? 'from-purple-300/90 to-pink-300/90' : 'from-purple-600/90 to-cyan-600/90'} rounded-3xl shadow-2xl border ${isPastel ? 'border-purple-300/50' : 'border-cyber-purple-400/50'}`}
                            whileHover={{
                              scale: 1.15,
                              rotate: [0, -5, 5, -5, 5, 0],
                              transition: { duration: 0.4, ease: 'easeOut' },
                            }}
                          >
                            <Icon className="w-14 h-14 text-white" />
                          </motion.div>
                        </motion.div>
                        
                        <div className="text-center space-y-3">
                          <h3 className={`text-2xl font-bold ${isPastel ? 'text-gray-800' : 'text-white'} ${isPastel ? '' : 'bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent'}`}>
                            {isPastel ? feature.title : <span className="bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent">{feature.title}</span>}
                          </h3>
                          <p className={`text-sm ${isPastel ? 'text-gray-600' : 'text-gray-300'}`}>{feature.description}</p>
                          
                          {/* Feature Details */}
                          <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {feature.details.map((detail, idx) => (
                              <motion.span
                                key={idx}
                                className={`text-xs px-3 py-1 rounded-full ${isPastel ? 'bg-purple-100 text-purple-700' : 'bg-cyber-purple-400/20 text-cyber-cyan-400'} border ${isPastel ? 'border-purple-300/30' : 'border-cyber-purple-400/30'}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 + index * 0.15 + idx * 0.1 }}
                              >
                                {detail}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </HolographicEffect>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{ 
            willChange: 'transform, opacity',
            transform: 'translate3d(0, 0, 0)',
          }}
        >
          {additionalFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className={`flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br ${cardBg} backdrop-blur-xl border ${isPastel ? 'border-purple-300/20' : 'border-cyber-purple-400/20'} overflow-hidden`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.08 }}
                whileHover={{ 
                  scale: 1.03,
                  x: 3,
                  transition: { duration: 0.2 }
                }}
                style={{ 
                  willChange: 'transform, opacity',
                  transform: 'translate3d(0, 0, 0)',
                  boxShadow: `0 0 20px ${primaryRgba}0.2), inset 0 0 20px ${primaryRgba}0.05)`,
                }}
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${isPastel ? 'from-purple-300/90 to-pink-300/90' : 'from-purple-600/90 to-cyan-600/90'}`}>
                  <Icon className={`w-6 h-6 ${isPastel ? 'text-purple-700' : 'text-white'}`} />
                </div>
                <div>
                  <h4 className={`font-semibold ${isPastel ? 'text-gray-800' : 'text-white'}`}>{feature.title}</h4>
                  <p className={`text-xs ${isPastel ? 'text-gray-600' : 'text-gray-400'}`}>{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
});
