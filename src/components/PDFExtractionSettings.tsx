import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown } from 'lucide-react';
import { ConversionSettings } from '../types';

interface PDFExtractionSettingsProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
  totalPages: number;
  isOpen: boolean;
  onToggle: () => void;
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
  totalPages,
  isOpen,
  onToggle,
}: PDFExtractionSettingsProps) {
  const applyPreset = (preset: typeof PRESETS.highQuality) => {
    onSettingsChange({
      ...settings,
      ...preset,
      compressionLevel: preset.format === 'png' ? 6 : undefined,
    });
  };

  const handlePageRangeChange = (type: 'all' | 'range' | 'custom', value?: { start: number; end: number } | number[]) => {
    if (type === 'all') {
      const newSettings = { ...settings };
      delete newSettings.pageRange;
      onSettingsChange(newSettings);
    } else if (value) {
      onSettingsChange({ ...settings, pageRange: value });
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
            className="bg-gray-900/60 rounded-xl p-6 space-y-6 border border-cyber-purple-400/30 overflow-hidden"
          >
            {/* Presets */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">Quick Presets</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => applyPreset(PRESETS.highQuality)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyber-purple-400/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
                >
                  High Quality
                </button>
                <button
                  onClick={() => applyPreset(PRESETS.standard)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyber-purple-400/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
                >
                  Standard
                </button>
                <button
                  onClick={() => applyPreset(PRESETS.webOptimized)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyber-purple-400/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
                >
                  Web Optimized
                </button>
              </div>
            </div>

            {/* DPI Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                DPI (Resolution)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DPI_OPTIONS.map((dpi) => (
                  <button
                    key={dpi}
                    onClick={() => onSettingsChange({ ...settings, dpi })}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      settings.dpi === dpi
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-2 border-cyber-purple-400'
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
              <label className="block text-sm font-semibold text-gray-400 mb-3">Output Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onSettingsChange({ ...settings, format: 'png' })}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    settings.format === 'png'
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-2 border-cyber-purple-400'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  PNG
                </button>
                <button
                  onClick={() => onSettingsChange({ ...settings, format: 'jpeg' })}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    settings.format === 'jpeg'
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-2 border-cyber-purple-400'
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
                  <label className="text-sm font-semibold text-gray-400">Quality</label>
                  <span className="text-sm text-gray-300 font-medium">{settings.quality}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={settings.quality}
                  onChange={(e) => onSettingsChange({ ...settings, quality: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyber-purple-400"
                  style={{
                    background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${settings.quality}%, rgb(55, 65, 81) ${settings.quality}%, rgb(55, 65, 81) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            )}

            {/* Color Space */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">Color Space</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onSettingsChange({ ...settings, colorSpace: 'rgb' })}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    settings.colorSpace === 'rgb'
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-2 border-cyber-purple-400'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  RGB
                </button>
                <button
                  onClick={() => onSettingsChange({ ...settings, colorSpace: 'grayscale' })}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    settings.colorSpace === 'grayscale'
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-2 border-cyber-purple-400'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  Grayscale
                </button>
              </div>
            </div>

            {/* Page Range Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">Page Range</label>
              <div className="space-y-3">
                <button
                  onClick={() => handlePageRangeChange('all')}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    !settings.pageRange
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-2 border-cyber-purple-400'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  All Pages ({totalPages} pages)
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    placeholder="Start page"
                    value={
                      settings.pageRange && 'start' in settings.pageRange
                        ? settings.pageRange.start
                        : ''
                    }
                    onChange={(e) => {
                      const start = parseInt(e.target.value);
                      if (!isNaN(start) && start >= 1 && start <= totalPages) {
                        const end =
                          settings.pageRange && 'end' in settings.pageRange
                            ? settings.pageRange.end
                            : totalPages;
                        handlePageRangeChange('range', { start, end: Math.max(start, end) });
                      }
                    }}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
                  />
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    placeholder="End page"
                    value={
                      settings.pageRange && 'end' in settings.pageRange
                        ? settings.pageRange.end
                        : ''
                    }
                    onChange={(e) => {
                      const end = parseInt(e.target.value);
                      if (!isNaN(end) && end >= 1 && end <= totalPages) {
                        const start =
                          settings.pageRange && 'start' in settings.pageRange
                            ? settings.pageRange.start
                            : 1;
                        handlePageRangeChange('range', { start: Math.min(start, end), end });
                      }
                    }}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* PNG Compression (if PNG format) */}
            {settings.format === 'png' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-400">Compression Level</label>
                  <span className="text-sm text-gray-300 font-medium">
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
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyber-purple-400"
                  style={{
                    background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((settings.compressionLevel ?? 6) / 9) * 100}%, rgb(55, 65, 81) ${((settings.compressionLevel ?? 6) / 9) * 100}%, rgb(55, 65, 81) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
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
