import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown } from 'lucide-react';
import { ConversionSettings } from '../types';

interface PDFExtractionSettingsProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
  totalPages: number;
  isOpen: boolean;
  onToggle: () => void;
  isPastel?: boolean;
}

const DPI_OPTIONS = [72, 150, 300, 600];
const PRESETS = {
  highQuality: { dpi: 300, quality: 95, format: 'png' as const, colorSpace: 'rgb' as const },
  standard: { dpi: 150, quality: 85, format: 'jpeg' as const, colorSpace: 'rgb' as const },
  webOptimized: { dpi: 72, quality: 80, format: 'jpeg' as const, colorSpace: 'rgb' as const },
};

export function PDFExtractionSettings({
  settings,
  onSettingsChange,
  totalPages: _totalPages,
  isOpen,
  onToggle,
  isPastel = false,
}: PDFExtractionSettingsProps) {
  const applyPreset = (preset: { dpi: number; quality: number; format: 'png' | 'jpeg'; colorSpace: 'rgb' | 'grayscale' }) => {
    onSettingsChange({
      ...settings,
      ...preset,
      pageRange: 'all',
      compressionLevel: preset.format === 'png' ? 6 : undefined,
    });
  };

  const handlePageRangeChange = (type: 'all' | 'custom' | 'selected', customRange?: string) => {
    if (type === 'all') {
      onSettingsChange({ ...settings, pageRange: 'all', customPageRange: '' });
    } else if (type === 'custom' && customRange !== undefined) {
      onSettingsChange({ ...settings, pageRange: 'custom', customPageRange: customRange });
    } else if (type === 'selected') {
      onSettingsChange({ ...settings, pageRange: 'selected', customPageRange: '' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Settings Toggle Button */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-700/50 hover:bg-gray-700/70 rounded-xl transition-all border border-gray-600/50 hover:border-cyber-purple-400/50"
        aria-label="Toggle Settings"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-gray-300" />
          <span className="font-semibold text-gray-200">Conversion Settings</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-xl p-6 space-y-6 border overflow-hidden ${
              isPastel
                ? 'bg-white/80 border-pink-200/40'
                : 'bg-gray-900/60 border-cyber-purple-400/30'
            }`}
            style={isPastel ? {
              boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
            } : {}}
          >
            {/* Presets */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>Quick Presets</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => applyPreset(PRESETS.highQuality)}
                  className={`px-4 py-2.5 rounded-lg text-sm transition-all border ${
                    isPastel
                      ? 'bg-pink-50/80 hover:bg-pink-100/80 border-pink-200/50 hover:border-pink-300/50 text-gray-700 hover:text-gray-900'
                      : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-cyber-purple-400/50 text-gray-300 hover:text-white'
                  }`}
                >
                  High Quality
                </button>
                <button
                  onClick={() => applyPreset(PRESETS.standard)}
                  className={`px-4 py-2.5 rounded-lg text-sm transition-all border ${
                    isPastel
                      ? 'bg-pink-50/80 hover:bg-pink-100/80 border-pink-200/50 hover:border-pink-300/50 text-gray-700 hover:text-gray-900'
                      : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-cyber-purple-400/50 text-gray-300 hover:text-white'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => applyPreset(PRESETS.webOptimized)}
                  className={`px-4 py-2.5 rounded-lg text-sm transition-all border ${
                    isPastel
                      ? 'bg-pink-50/80 hover:bg-pink-100/80 border-pink-200/50 hover:border-pink-300/50 text-gray-700 hover:text-gray-900'
                      : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-cyber-purple-400/50 text-gray-300 hover:text-white'
                  }`}
                >
                  Web Optimized
                </button>
              </div>
            </div>

            {/* DPI Selection */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>
                DPI (Resolution)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DPI_OPTIONS.map((dpi) => (
                  <button
                    key={dpi}
                    onClick={() => onSettingsChange({ ...settings, dpi })}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      settings.dpi === dpi
                        ? isPastel
                          ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white border-2 border-pink-300'
                          : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-2 border-cyber-purple-400'
                        : isPastel
                        ? 'bg-pink-50/80 hover:bg-pink-100/80 border border-pink-200/50 text-gray-700 hover:text-gray-900'
                        : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white'
                    }`}
                  >
                    {dpi}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>Output Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onSettingsChange({ ...settings, format: 'png' })}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    settings.format === 'png'
                      ? isPastel
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white border-2 border-pink-300'
                        : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-2 border-cyber-purple-400'
                      : isPastel
                      ? 'bg-pink-50/80 hover:bg-pink-100/80 border border-pink-200/50 text-gray-700 hover:text-gray-900'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  PNG
                </button>
                <button
                  onClick={() => onSettingsChange({ ...settings, format: 'jpeg' })}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    settings.format === 'jpeg'
                      ? isPastel
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white border-2 border-pink-300'
                        : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-2 border-cyber-purple-400'
                      : isPastel
                      ? 'bg-pink-50/80 hover:bg-pink-100/80 border border-pink-200/50 text-gray-700 hover:text-gray-900'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  JPEG
                </button>
              </div>
            </div>

            {/* Quality Slider (for JPEG) */}
            {settings.format === 'jpeg' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-semibold ${
                    isPastel ? 'text-gray-600' : 'text-gray-400'
                  }`}>Quality</label>
                  <span className={`text-sm font-medium ${
                    isPastel ? 'text-gray-700' : 'text-gray-300'
                  }`}>{settings.quality}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={settings.quality}
                  onChange={(e) => onSettingsChange({ ...settings, quality: parseInt(e.target.value) })}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                    isPastel ? 'accent-pink-400' : 'accent-cyber-purple-400'
                  }`}
                  style={{
                    background: isPastel
                      ? `linear-gradient(to right, rgb(244, 114, 182) 0%, rgb(244, 114, 182) ${settings.quality}%, rgb(229, 231, 235) ${settings.quality}%, rgb(229, 231, 235) 100%)`
                      : `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${settings.quality}%, rgb(55, 65, 81) ${settings.quality}%, rgb(55, 65, 81) 100%)`,
                  }}
                />
                <div className={`flex justify-between text-xs mt-1 ${
                  isPastel ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            )}

            {/* Color Space */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>Color Space</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onSettingsChange({ ...settings, colorSpace: 'rgb' })}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    settings.colorSpace === 'rgb'
                      ? isPastel
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white border-2 border-pink-300'
                        : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-2 border-cyber-purple-400'
                      : isPastel
                      ? 'bg-pink-50/80 hover:bg-pink-100/80 border border-pink-200/50 text-gray-700 hover:text-gray-900'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  RGB
                </button>
                <button
                  onClick={() => onSettingsChange({ ...settings, colorSpace: 'grayscale' })}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    settings.colorSpace === 'grayscale'
                      ? isPastel
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white border-2 border-pink-300'
                        : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-2 border-cyber-purple-400'
                      : isPastel
                      ? 'bg-pink-50/80 hover:bg-pink-100/80 border border-pink-200/50 text-gray-700 hover:text-gray-900'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  Grayscale
                </button>
              </div>
            </div>

            {/* Page Range Selection */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>Page Range</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageRangeChange('all')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      settings.pageRange === 'all' || !settings.pageRange
                        ? isPastel
                          ? 'bg-pink-500 text-white'
                          : 'bg-cyber-purple-500 text-white'
                        : isPastel
                        ? 'bg-pink-50/80 text-gray-700 hover:bg-pink-100/80'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handlePageRangeChange('custom', settings.customPageRange || '')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      settings.pageRange === 'custom'
                        ? isPastel
                          ? 'bg-pink-500 text-white'
                          : 'bg-cyber-purple-500 text-white'
                        : isPastel
                        ? 'bg-pink-50/80 text-gray-700 hover:bg-pink-100/80'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {settings.pageRange === 'custom' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="e.g., 1-5, 8, 10-12"
                      value={settings.customPageRange || ''}
                      onChange={(e) => {
                        handlePageRangeChange('custom', e.target.value);
                      }}
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${
                        isPastel
                          ? 'bg-white/80 border-pink-200/50 text-gray-700 focus:ring-pink-400'
                          : 'bg-gray-800 border-gray-700 text-white focus:ring-cyber-purple-400'
                      }`}
                    />
                    <p className={`text-xs ${
                      isPastel ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      Enter page numbers or ranges (e.g., 1-5, 8, 10-12)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* PNG Compression (if PNG format) */}
            {settings.format === 'png' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-semibold ${
                    isPastel ? 'text-gray-600' : 'text-gray-400'
                  }`}>Compression Level</label>
                  <span className={`text-sm font-medium ${
                    isPastel ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {settings.compressionLevel ?? 6}/9
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="9"
                  value={settings.compressionLevel ?? 6}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, compressionLevel: parseInt(e.target.value) })
                  }
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                    isPastel ? 'accent-pink-400' : 'accent-cyber-purple-400'
                  }`}
                  style={{
                    background: isPastel
                      ? `linear-gradient(to right, rgb(244, 114, 182) 0%, rgb(244, 114, 182) ${((settings.compressionLevel ?? 6) / 9) * 100}%, rgb(229, 231, 235) ${((settings.compressionLevel ?? 6) / 9) * 100}%, rgb(229, 231, 235) 100%)`
                      : `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((settings.compressionLevel ?? 6) / 9) * 100}%, rgb(55, 65, 81) ${((settings.compressionLevel ?? 6) / 9) * 100}%, rgb(55, 65, 81) 100%)`,
                  }}
                />
                <div className={`flex justify-between text-xs mt-1 ${
                  isPastel ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  <span>None</span>
                  <span>Maximum</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
