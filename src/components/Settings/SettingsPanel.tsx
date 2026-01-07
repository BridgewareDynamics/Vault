import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Cpu, MemoryStick, Monitor, Zap, Image, Gauge, FileText, TrendingUp } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { formatBytes } from '../../utils/memoryMonitor';
import { useToast } from '../Toast/ToastContext';
import { WordEditorPanel } from '../WordEditor/WordEditorPanel';
import { WordEditorDialog } from '../WordEditor/WordEditorDialog';
import { useWordEditor } from '../../contexts/WordEditorContext';

interface SettingsPanelProps {
  hideWordEditorButton?: boolean;
  isArchiveVisible?: boolean;
  hideFixedButtons?: boolean;
}

export function SettingsPanel({ hideWordEditorButton = false, isArchiveVisible = false, hideFixedButtons = false }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWordEditorOpen, setIsWordEditorOpen] = useState(false);
  const [showWordEditorDialog, setShowWordEditorDialog] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [openLibraryOnMount, setOpenLibraryOnMount] = useState(false);
  const [memoryInfo, setMemoryInfo] = useState<{ used: number; total: number } | null>(null);
  const { isOpen: isWordEditorContextOpen, setIsOpen: setWordEditorContextOpen } = useWordEditor();

  // Listen for reattach data from detached window
  useEffect(() => {
    const handleReattach = (_event: CustomEvent<{ content: string; filePath?: string | null; viewState?: 'editor' | 'library' | 'bookmarkLibrary'; casePath?: string | null }>) => {
      setIsWordEditorOpen(true);
      setWordEditorContextOpen(true);
    };

    const handleCloseForBookmark = () => {
      setIsWordEditorOpen(false);
      setWordEditorContextOpen(false);
      setOpenLibraryOnMount(false);
    };

    const handleOpenSettings = () => {
      setIsOpen(true);
    };

    const handleOpenWordEditorDialog = () => {
      setShowWordEditorDialog(true);
    };

    const handleOpenWordEditorFromViewer = () => {
      // Open word editor panel when triggered from PDF viewer
      setIsWordEditorOpen(true);
      setWordEditorContextOpen(true);
    };

    window.addEventListener('reattach-word-editor-data' as any, handleReattach as EventListener);
    window.addEventListener('close-word-editor-for-bookmark' as any, handleCloseForBookmark as EventListener);
    window.addEventListener('open-settings' as any, handleOpenSettings as EventListener);
    window.addEventListener('open-word-editor-dialog' as any, handleOpenWordEditorDialog as EventListener);
    window.addEventListener('open-word-editor-from-viewer' as any, handleOpenWordEditorFromViewer as EventListener);
    return () => {
      window.removeEventListener('reattach-word-editor-data' as any, handleReattach as EventListener);
      window.removeEventListener('close-word-editor-for-bookmark' as any, handleCloseForBookmark as EventListener);
      window.removeEventListener('open-settings' as any, handleOpenSettings as EventListener);
      window.removeEventListener('open-word-editor-dialog' as any, handleOpenWordEditorDialog as EventListener);
      window.removeEventListener('open-word-editor-from-viewer' as any, handleOpenWordEditorFromViewer as EventListener);
    };
  }, [setWordEditorContextOpen]);

  // Sync local state with context state - when context opens, open local state too
  useEffect(() => {
    if (isWordEditorContextOpen && !isWordEditorOpen) {
      setIsWordEditorOpen(true);
    }
  }, [isWordEditorContextOpen, isWordEditorOpen]);

  const {
    settings,
    loading,
    toggleHardwareAcceleration,
    toggleFullscreen,
    setRamLimit,
    setExtractionQuality,
    setThumbnailSize,
    setPerformanceMode,
  } = useSettings();
  const toast = useToast();

  // Load memory info periodically
  useEffect(() => {
    const updateMemoryInfo = async () => {
      try {
        if (window.electronAPI && typeof window.electronAPI.getSystemMemory === 'function') {
          const systemMemory = await window.electronAPI.getSystemMemory();
          if (systemMemory && typeof systemMemory.usedMemory === 'number' && typeof systemMemory.totalMemory === 'number') {
            setMemoryInfo({
              used: systemMemory.usedMemory,
              total: systemMemory.totalMemory,
            });
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to get memory info:', error);
        }
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  // Don't return null - show icon even while loading, just disable interaction
  if (loading || !settings) {
    return (
      <motion.button
        disabled
        className="fixed bottom-0 right-4 z-40 p-3 bg-gray-800/90 text-gray-500 rounded-full border border-gray-700/60 shadow-lg backdrop-blur-sm transition-colors cursor-not-allowed"
        aria-label="Settings (loading)"
      >
        <Settings size={24} />
      </motion.button>
    );
  }

  const handleRamLimitChange = async (value: number) => {
    try {
      await setRamLimit(value);
      toast.success(`RAM limit set to ${value}MB`);
    } catch (error) {
      toast.error('Failed to update RAM limit');
    }
  };

  const handleHardwareAccelerationToggle = async () => {
    try {
      await toggleHardwareAcceleration();
      toast.info('Hardware acceleration change requires app restart to take full effect');
    } catch (error) {
      toast.error('Failed to toggle hardware acceleration');
    }
  };

  const handleFullscreenToggle = async () => {
    try {
      await toggleFullscreen();
    } catch (error) {
      toast.error('Failed to toggle fullscreen');
    }
  };

  const handleExtractionQualityChange = async (quality: 'high' | 'medium' | 'low') => {
    try {
      await setExtractionQuality(quality);
      toast.success(`Extraction quality set to ${quality}`);
    } catch (error) {
      toast.error('Failed to update extraction quality');
    }
  };

  const handleThumbnailSizeChange = async (size: number) => {
    try {
      await setThumbnailSize(size);
      toast.success(`Thumbnail size set to ${size}px`);
    } catch (error) {
      toast.error('Failed to update thumbnail size');
    }
  };

  const handlePerformanceModeChange = async (mode: 'auto' | 'high' | 'balanced' | 'low') => {
    try {
      await setPerformanceMode(mode);
      toast.success(`Performance mode set to ${mode}`);
    } catch (error) {
      toast.error('Failed to update performance mode');
    }
  };

  const memoryUsagePercent = memoryInfo
    ? Math.round((memoryInfo.used / memoryInfo.total) * 100)
    : null;

  return (
    <>
      {/* Enhanced Word Editor Icon Button */}
      {!hideFixedButtons && !hideWordEditorButton && (
        <motion.button
          onClick={() => setShowWordEditorDialog(true)}
          className="fixed bottom-0 right-4 z-40 p-3.5 bg-gradient-to-br from-purple-600/90 via-purple-500/90 to-cyan-600/90 hover:from-purple-600 hover:via-purple-500 hover:to-cyan-600 text-white rounded-full border border-purple-400/30 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 backdrop-blur-sm transition-all"
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open word editor"
          style={{ marginBottom: '140px' }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-sm"></div>
            <FileText size={22} className="relative z-10" />
          </div>
        </motion.button>
      )}

      {/* Enhanced Settings Icon Button */}
      {!hideFixedButtons && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-0 right-4 z-40 p-3.5 bg-gradient-to-br from-purple-600/90 via-purple-500/90 to-cyan-600/90 hover:from-purple-600 hover:via-purple-500 hover:to-cyan-600 text-white rounded-full border border-purple-400/30 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 backdrop-blur-sm transition-all"
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open settings"
          style={{ marginBottom: '80px' }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-sm"></div>
            <Settings size={22} className="relative z-10" />
          </div>
        </motion.button>
      )}

      {/* Enhanced Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Enhanced Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Enhanced Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-96 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 backdrop-blur-xl border-r border-cyber-purple-400/30 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-cyber-purple-400/20">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                      <div className="relative p-4 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                        <Settings className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                        Settings
                      </h2>
                      <p className="text-sm text-gray-400 mt-1">Configure your experience</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-gray-800/80 rounded-xl transition-colors text-gray-400 hover:text-white"
                    aria-label="Close settings"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Enhanced Memory Usage Display */}
                {memoryInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-5 bg-gray-800/50 rounded-xl border border-cyber-purple-400/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                          <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                            <MemoryStick className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-300">System Memory</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 rounded-lg border border-cyber-purple-400/20">
                        <TrendingUp className="w-3.5 h-3.5 text-cyber-purple-400" />
                        <span className="text-xs font-medium text-gray-300">{memoryUsagePercent}%</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mb-3 font-mono">
                      {formatBytes(memoryInfo.used)} / {formatBytes(memoryInfo.total)}
                    </div>
                    <div className="relative w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${memoryUsagePercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 rounded-full shadow-lg"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Settings Sections */}
                <div className="space-y-5">
                  {/* Hardware Acceleration */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/30 hover:border-cyber-purple-400/30 transition-all backdrop-blur-sm"
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                        <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                          <Cpu className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-300">Hardware Acceleration</span>
                    </label>
                    <motion.button
                      onClick={handleHardwareAccelerationToggle}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative overflow-hidden group w-full p-3.5 rounded-xl border-2 transition-all font-medium ${
                        settings.hardwareAcceleration
                          ? 'bg-cyber-purple-500/20 border-cyber-purple-500/60 text-white shadow-lg shadow-cyber-purple-500/20'
                          : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600/50'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                        settings.hardwareAcceleration
                          ? 'from-purple-600/10 via-purple-600/5 to-cyan-600/10'
                          : 'from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/5 group-hover:via-purple-600/3 group-hover:to-cyan-600/5'
                      }`}></div>
                      <span className="relative z-10">{settings.hardwareAcceleration ? 'Enabled' : 'Disabled'}</span>
                    </motion.button>
                    <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                      Boosts performance for PDF extraction and rendering. Requires restart.
                    </p>
                  </motion.div>

                  {/* RAM Limit */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/30 hover:border-cyber-purple-400/30 transition-all backdrop-blur-sm"
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                        <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                          <MemoryStick className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-300">
                        RAM Limit: <span className="text-cyber-purple-400">{settings.ramLimitMB}MB</span>
                      </span>
                    </label>
                    <div className="relative mb-2">
                      <input
                        type="range"
                        min="512"
                        max="8192"
                        step="256"
                        value={settings.ramLimitMB}
                        onChange={(e) => handleRamLimitChange(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-cyber-purple-500"
                        style={{
                          background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((settings.ramLimitMB - 512) / (8192 - 512)) * 100}%, rgb(55, 65, 81) ${((settings.ramLimitMB - 512) / (8192 - 512)) * 100}%, rgb(55, 65, 81) 100%)`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-3">
                      <span>512MB</span>
                      <span>8192MB</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Memory threshold for automatic cleanup triggers.
                    </p>
                  </motion.div>

                  {/* Fullscreen */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/30 hover:border-cyber-purple-400/30 transition-all backdrop-blur-sm"
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                        <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                          <Monitor className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-300">Fullscreen</span>
                    </label>
                    <motion.button
                      onClick={handleFullscreenToggle}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative overflow-hidden group w-full p-3.5 rounded-xl border-2 transition-all font-medium ${
                        settings.fullscreen
                          ? 'bg-cyber-purple-500/20 border-cyber-purple-500/60 text-white shadow-lg shadow-cyber-purple-500/20'
                          : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600/50'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                        settings.fullscreen
                          ? 'from-purple-600/10 via-purple-600/5 to-cyan-600/10'
                          : 'from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/5 group-hover:via-purple-600/3 group-hover:to-cyan-600/5'
                      }`}></div>
                      <span className="relative z-10">{settings.fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                    </motion.button>
                  </motion.div>

                  {/* Extraction Quality */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/30 hover:border-cyber-purple-400/30 transition-all backdrop-blur-sm"
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                        <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-300">Extraction Quality</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>
                      <select
                        value={settings.extractionQuality}
                        onChange={(e) => handleExtractionQualityChange(e.target.value as 'high' | 'medium' | 'low')}
                        className="relative w-full p-3.5 bg-gray-800/70 hover:bg-gray-800/80 border-2 border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 rounded-xl text-white focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                      Higher quality uses more memory but produces better results.
                    </p>
                  </motion.div>

                  {/* Thumbnail Size */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/30 hover:border-cyber-purple-400/30 transition-all backdrop-blur-sm"
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                        <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                          <Image className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-300">
                        Thumbnail Size: <span className="text-cyber-purple-400">{settings.thumbnailSize}px</span>
                      </span>
                    </label>
                    <div className="relative mb-2">
                      <input
                        type="range"
                        min="100"
                        max="400"
                        step="50"
                        value={settings.thumbnailSize}
                        onChange={(e) => handleThumbnailSizeChange(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-cyber-purple-500"
                        style={{
                          background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((settings.thumbnailSize - 100) / (400 - 100)) * 100}%, rgb(55, 65, 81) ${((settings.thumbnailSize - 100) / (400 - 100)) * 100}%, rgb(55, 65, 81) 100%)`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>100px</span>
                      <span>400px</span>
                    </div>
                  </motion.div>

                  {/* Performance Mode */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/30 hover:border-cyber-purple-400/30 transition-all backdrop-blur-sm"
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                        <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                          <Gauge className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-300">Performance Mode</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>
                      <select
                        value={settings.performanceMode}
                        onChange={(e) => handlePerformanceModeChange(e.target.value as 'auto' | 'high' | 'balanced' | 'low')}
                        className="relative w-full p-3.5 bg-gray-800/70 hover:bg-gray-800/80 border-2 border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 rounded-xl text-white focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      >
                        <option value="auto">Auto</option>
                        <option value="high">High</option>
                        <option value="balanced">Balanced</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                      Automatically adjusts settings based on system capabilities.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Word Editor Dialog */}
      <WordEditorDialog
        isOpen={showWordEditorDialog}
        onClose={() => setShowWordEditorDialog(false)}
        onOpenFile={(filePath) => {
          setCurrentFilePath(filePath);
          setIsWordEditorOpen(true);
          setWordEditorContextOpen(true);
          setShowWordEditorDialog(false);
        }}
        onNewFile={async (fileName, casePath) => {
          try {
            if (!window.electronAPI) {
              toast.error('Electron API not available');
              return;
            }
            const filePath = await window.electronAPI.createCaseNote(casePath, fileName, '');
            setCurrentFilePath(filePath);
            setIsWordEditorOpen(true);
            setWordEditorContextOpen(true);
            setShowWordEditorDialog(false);
            toast.success('Document created');
          } catch (error) {
            toast.error('Failed to create document');
            console.error('Create file error:', error);
          }
        }}
        onOpenLibrary={() => {
          setOpenLibraryOnMount(true);
          setIsWordEditorOpen(true);
          setWordEditorContextOpen(true);
          setShowWordEditorDialog(false);
        }}
      />

      {/* Word Editor Panel */}
      {isArchiveVisible && isWordEditorOpen ? (
        (() => {
          const container = document.getElementById('word-editor-inline-container');
          if (!container) {
            return (
              <WordEditorPanel
                isOpen={isWordEditorOpen}
                onClose={() => {
                  setIsWordEditorOpen(false);
                  setWordEditorContextOpen(false);
                  setOpenLibraryOnMount(false);
                  // Dispatch event to reset overlay mode flag
                  window.dispatchEvent(new CustomEvent('close-word-editor'));
                }}
                initialFilePath={currentFilePath}
                openLibrary={openLibraryOnMount}
                layoutMode="overlay"
              />
            );
          }
          return createPortal(
            <WordEditorPanel
              isOpen={isWordEditorOpen}
              onClose={() => {
                setIsWordEditorOpen(false);
                setWordEditorContextOpen(false);
                setOpenLibraryOnMount(false);
                // Dispatch event to reset overlay mode flag
                window.dispatchEvent(new CustomEvent('close-word-editor'));
              }}
              initialFilePath={currentFilePath}
              openLibrary={openLibraryOnMount}
              layoutMode="inline"
            />,
            container
          );
        })()
      ) : (
        <WordEditorPanel
          isOpen={isWordEditorOpen}
          onClose={() => {
            setIsWordEditorOpen(false);
            setWordEditorContextOpen(false);
            setOpenLibraryOnMount(false);
            // Dispatch event to reset overlay mode flag
            window.dispatchEvent(new CustomEvent('close-word-editor'));
          }}
          initialFilePath={currentFilePath}
          openLibrary={openLibraryOnMount}
          layoutMode="overlay"
        />
      )}
    </>
  );
}
