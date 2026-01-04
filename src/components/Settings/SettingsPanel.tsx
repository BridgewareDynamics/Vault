import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Cpu, MemoryStick, Monitor, Zap, Image, Gauge, FileText } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { formatBytes } from '../../utils/memoryMonitor';
import { useToast } from '../Toast/ToastContext';
import { WordEditorPanel } from '../WordEditor/WordEditorPanel';
import { WordEditorDialog } from '../WordEditor/WordEditorDialog';
import { useWordEditor } from '../../contexts/WordEditorContext';

interface SettingsPanelProps {
  hideWordEditorButton?: boolean;
  isArchiveVisible?: boolean;
}

export function SettingsPanel({ hideWordEditorButton = false, isArchiveVisible = false }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWordEditorOpen, setIsWordEditorOpen] = useState(false);
  const [showWordEditorDialog, setShowWordEditorDialog] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [openLibraryOnMount, setOpenLibraryOnMount] = useState(false);
  const [memoryInfo, setMemoryInfo] = useState<{ used: number; total: number } | null>(null);
  const { setIsOpen: setWordEditorContextOpen } = useWordEditor();

  // Listen for reattach data from detached window
  useEffect(() => {
    const handleReattach = (_event: CustomEvent<{ content: string; filePath?: string | null }>) => {
      // Open the word editor panel when reattaching
      setIsWordEditorOpen(true);
      setWordEditorContextOpen(true);
    };

    // Listen for bookmark open events that should close the word editor
    const handleCloseForBookmark = () => {
      setIsWordEditorOpen(false);
      setWordEditorContextOpen(false);
      setOpenLibraryOnMount(false);
    };

    window.addEventListener('reattach-word-editor-data' as any, handleReattach as EventListener);
    window.addEventListener('close-word-editor-for-bookmark' as any, handleCloseForBookmark as EventListener);
    return () => {
      window.removeEventListener('reattach-word-editor-data' as any, handleReattach as EventListener);
      window.removeEventListener('close-word-editor-for-bookmark' as any, handleCloseForBookmark as EventListener);
    };
  }, [setWordEditorContextOpen]);
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
        // Silently fail - memory info is not critical for app functionality
        // Only log in development to avoid test noise
        if (import.meta.env.DEV) {
          console.error('Failed to get memory info:', error);
        }
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 2000); // Update every 2 seconds
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
      {/* Word Editor Icon Button - Below Settings */}
      {!hideWordEditorButton && (
        <motion.button
          onClick={() => setShowWordEditorDialog(true)}
          className="fixed bottom-0 right-4 z-40 p-3 bg-gray-800/90 hover:bg-gray-700 text-white rounded-full border border-cyber-purple-500/60 shadow-lg backdrop-blur-sm transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open word editor"
          style={{ marginBottom: '140px' }} // Offset above Settings button
        >
          <FileText size={24} />
        </motion.button>
      )}

      {/* Settings Icon Button - Bottom Right */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-0 right-4 z-40 p-3 bg-gray-800/90 hover:bg-gray-700 text-white rounded-full border border-cyber-purple-500/60 shadow-lg backdrop-blur-sm transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open settings"
        style={{ marginBottom: '80px' }} // Offset above ToastContainer
      >
        <Settings size={24} />
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-96 bg-gray-900/95 backdrop-blur-lg border-r border-cyber-purple-500/30 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
                    Settings
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Close settings"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Memory Usage Display */}
                {memoryInfo && (
                  <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-cyber-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <MemoryStick size={18} className="text-cyber-purple-400" />
                      <span className="text-sm font-medium text-gray-300">System Memory</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {formatBytes(memoryInfo.used)} / {formatBytes(memoryInfo.total)} ({memoryUsagePercent}%)
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyber-purple-500 to-cyber-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${memoryUsagePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Hardware Acceleration */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 mb-3">
                    <Cpu size={18} className="text-cyber-purple-400" />
                    <span className="text-sm font-medium text-gray-300">Hardware Acceleration</span>
                  </label>
                  <button
                    onClick={handleHardwareAccelerationToggle}
                    className={`w-full p-3 rounded-lg border transition-colors ${settings.hardwareAcceleration
                        ? 'bg-cyber-purple-500/20 border-cyber-purple-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}
                  >
                    {settings.hardwareAcceleration ? 'Enabled' : 'Disabled'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Boosts performance for PDF extraction and rendering. Requires restart.
                  </p>
                </div>

                {/* RAM Limit */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 mb-3">
                    <MemoryStick size={18} className="text-cyber-purple-400" />
                    <span className="text-sm font-medium text-gray-300">
                      RAM Limit: {settings.ramLimitMB}MB
                    </span>
                  </label>
                  <input
                    type="range"
                    min="512"
                    max="8192"
                    step="256"
                    value={settings.ramLimitMB}
                    onChange={(e) => handleRamLimitChange(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyber-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>512MB</span>
                    <span>8192MB</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Memory threshold for automatic cleanup triggers.
                  </p>
                </div>

                {/* Fullscreen */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 mb-3">
                    <Monitor size={18} className="text-cyber-purple-400" />
                    <span className="text-sm font-medium text-gray-300">Fullscreen</span>
                  </label>
                  <button
                    onClick={handleFullscreenToggle}
                    className={`w-full p-3 rounded-lg border transition-colors ${settings.fullscreen
                        ? 'bg-cyber-purple-500/20 border-cyber-purple-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}
                  >
                    {settings.fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  </button>
                </div>

                {/* Extraction Quality */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 mb-3">
                    <Zap size={18} className="text-cyber-purple-400" />
                    <span className="text-sm font-medium text-gray-300">Extraction Quality</span>
                  </label>
                  <select
                    value={settings.extractionQuality}
                    onChange={(e) => handleExtractionQualityChange(e.target.value as 'high' | 'medium' | 'low')}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyber-purple-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Higher quality uses more memory but produces better results.
                  </p>
                </div>

                {/* Thumbnail Size */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 mb-3">
                    <Image size={18} className="text-cyber-purple-400" />
                    <span className="text-sm font-medium text-gray-300">
                      Thumbnail Size: {settings.thumbnailSize}px
                    </span>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="400"
                    step="50"
                    value={settings.thumbnailSize}
                    onChange={(e) => handleThumbnailSizeChange(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyber-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>100px</span>
                    <span>400px</span>
                  </div>
                </div>

                {/* Performance Mode */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 mb-3">
                    <Gauge size={18} className="text-cyber-purple-400" />
                    <span className="text-sm font-medium text-gray-300">Performance Mode</span>
                  </label>
                  <select
                    value={settings.performanceMode}
                    onChange={(e) => handlePerformanceModeChange(e.target.value as 'auto' | 'high' | 'balanced' | 'low')}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyber-purple-500"
                  >
                    <option value="auto">Auto</option>
                    <option value="high">High</option>
                    <option value="balanced">Balanced</option>
                    <option value="low">Low</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Automatically adjusts settings based on system capabilities.
                  </p>
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
        onNewFile={async (fileName) => {
          try {
            if (!window.electronAPI) {
              toast.error('Electron API not available');
              return;
            }
            // Create empty file
            const filePath = await window.electronAPI.createTextFile(fileName, '');
            setCurrentFilePath(filePath);
            setIsWordEditorOpen(true);
            setWordEditorContextOpen(true);
            setShowWordEditorDialog(false);
          } catch (error) {
            toast.error('Failed to create file');
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
        // Render in inline container using portal
        (() => {
          // Use useEffect to ensure container exists, but for now try immediate render
          const container = document.getElementById('word-editor-inline-container');
          if (!container) {
            // Container doesn't exist yet, render in overlay mode as fallback
            return (
              <WordEditorPanel
                isOpen={isWordEditorOpen}
                onClose={() => {
                  setIsWordEditorOpen(false);
                  setWordEditorContextOpen(false);
                  setOpenLibraryOnMount(false);
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
              }}
              initialFilePath={currentFilePath}
              openLibrary={openLibraryOnMount}
              layoutMode="inline"
            />,
            container
          );
        })()
      ) : (
        // Render in overlay mode (normal)
        <WordEditorPanel
          isOpen={isWordEditorOpen}
          onClose={() => {
            setIsWordEditorOpen(false);
            setWordEditorContextOpen(false);
            setOpenLibraryOnMount(false);
          }}
          initialFilePath={currentFilePath}
          openLibrary={openLibraryOnMount}
          layoutMode="overlay"
        />
      )}
    </>
  );
}

