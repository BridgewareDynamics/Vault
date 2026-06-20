import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Cpu, MemoryStick, Monitor, Zap, Image, Gauge, FileText, TrendingUp, Palette, Check } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { formatBytes } from '../../utils/memoryMonitor';
import { logger } from '../../utils/logger';
import { useToast } from '../Toast/ToastContext';
import { WordEditorPanel } from '../WordEditor/WordEditorPanel';
import { WordEditorDialog } from '../WordEditor/WordEditorDialog';
import { useWordEditor } from '../../contexts/WordEditorContext';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';

interface SettingsPanelProps {
  hideWordEditorButton?: boolean;
  isArchiveVisible?: boolean;
  hideFixedButtons?: boolean;
  inlineWordEditorContainerId?: string;
}

export function SettingsPanel({
  hideWordEditorButton = false,
  isArchiveVisible = false,
  hideFixedButtons = false,
  inlineWordEditorContainerId,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWordEditorOpen, setIsWordEditorOpen] = useState(false);
  const [showWordEditorDialog, setShowWordEditorDialog] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [openLibraryOnMount, setOpenLibraryOnMount] = useState(false);
  const [memoryInfo, setMemoryInfo] = useState<{ used: number; total: number } | null>(null);
  const [inlineContainerAvailable, setInlineContainerAvailable] = useState(false);
  const { isOpen: isWordEditorContextOpen, setIsOpen: setWordEditorContextOpen } = useWordEditor();
  const resolvedInlineContainerId =
    inlineWordEditorContainerId ?? (isArchiveVisible ? 'word-editor-inline-container' : undefined);

  const closeWordEditorPanel = useCallback(() => {
    setIsWordEditorOpen(false);
    setWordEditorContextOpen(false);
    setOpenLibraryOnMount(false);
    window.dispatchEvent(new CustomEvent('close-word-editor'));
  }, [setWordEditorContextOpen]);

  // Listen for reattach data from detached window
  useEffect(() => {
    const handleReattach = () => {
      // When an inline editor container exists for the current workspace, prefer docking
      // back into that layout instead of forcing the shared overlay experience.
      if (!resolvedInlineContainerId) {
        // Use the same event that opening from viewer uses to ensure consistent behavior
        // This ensures the PDF viewer's ref is set immediately
        window.dispatchEvent(new CustomEvent('open-word-editor-from-viewer'));
      }
      setIsWordEditorOpen(true);
      setWordEditorContextOpen(true);
    };

    const handleCloseForBookmark = () => {
      closeWordEditorPanel();
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

    const handleOpenWordEditorPanel = (
      event: CustomEvent<{ filePath?: string | null; openLibrary?: boolean }>
    ) => {
      if (event.detail && 'filePath' in event.detail) {
        setCurrentFilePath(event.detail.filePath ?? null);
      }
      setOpenLibraryOnMount(Boolean(event.detail?.openLibrary));
      setIsWordEditorOpen(true);
      setWordEditorContextOpen(true);
    };

    const handleCloseWordEditorPanel = () => {
      closeWordEditorPanel();
    };

    window.addEventListener('reattach-word-editor-data', handleReattach as EventListener);
    window.addEventListener('close-word-editor-for-bookmark', handleCloseForBookmark as EventListener);
    window.addEventListener('open-settings', handleOpenSettings as EventListener);
    window.addEventListener('open-word-editor-dialog', handleOpenWordEditorDialog as EventListener);
    window.addEventListener('open-word-editor-from-viewer', handleOpenWordEditorFromViewer as EventListener);
    window.addEventListener('open-word-editor-panel', handleOpenWordEditorPanel as EventListener);
    window.addEventListener('close-word-editor-panel', handleCloseWordEditorPanel as EventListener);
    return () => {
      window.removeEventListener('reattach-word-editor-data', handleReattach as EventListener);
      window.removeEventListener('close-word-editor-for-bookmark', handleCloseForBookmark as EventListener);
      window.removeEventListener('open-settings', handleOpenSettings as EventListener);
      window.removeEventListener('open-word-editor-dialog', handleOpenWordEditorDialog as EventListener);
      window.removeEventListener('open-word-editor-from-viewer', handleOpenWordEditorFromViewer as EventListener);
      window.removeEventListener('open-word-editor-panel', handleOpenWordEditorPanel as EventListener);
      window.removeEventListener('close-word-editor-panel', handleCloseWordEditorPanel as EventListener);
    };
  }, [closeWordEditorPanel, resolvedInlineContainerId, setWordEditorContextOpen]);

  // Sync local state with context state - when context opens, open local state too
  useEffect(() => {
    if (isWordEditorContextOpen && !isWordEditorOpen) {
      setIsWordEditorOpen(true);
    }
  }, [isWordEditorContextOpen, isWordEditorOpen]);

  // Check for inline container availability, especially important when reattaching in archive mode
  useEffect(() => {
    if (!resolvedInlineContainerId || !isWordEditorOpen) {
      setInlineContainerAvailable(false);
      return;
    }

    // Check if container exists
    const checkContainer = () => {
      const container = document.getElementById(resolvedInlineContainerId);
      setInlineContainerAvailable(!!container);
    };

    // Check immediately
    checkContainer();

    // Also check after a short delay to catch cases where container is created asynchronously
    // This is especially important when reattaching
    const timeoutId = setTimeout(checkContainer, 50);
    
    // Use MutationObserver to watch for container creation
    const observer = new MutationObserver(() => {
      checkContainer();
    });

    // Observe the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [resolvedInlineContainerId, isWordEditorOpen]);

  const {
    settings,
    loading,
    toggleHardwareAcceleration,
    toggleFullscreen,
    setRamLimit,
    setExtractionQuality,
    setThumbnailSize,
    setPerformanceMode,
    updateSettings,
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
          logger.error('Failed to get memory info:', error);
        }
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  // Don't return null - show icon even while loading, just disable interaction
  // Get theme from settings if available, otherwise default
  const currentTheme: Theme = settings?.theme || 'brideware-purple';
  const isPastelLoading = currentTheme === 'pastel';

  if (loading || !settings) {
    return (
      <motion.button
        disabled
        className={`fixed bottom-0 right-4 z-40 p-3 rounded-full border shadow-lg backdrop-blur-sm transition-colors cursor-not-allowed ${
          isPastelLoading
            ? 'bg-pink-100/90 text-gray-400 border-pink-200/60'
            : 'bg-gray-800/90 text-gray-500 border-gray-700/60'
        }`}
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

  const handleThemeChange = async (theme: Theme) => {
    try {
      await updateSettings({ theme });
      toast.success(`Theme changed to ${theme === 'brideware-purple' ? 'Brideware Purple' : 'Pastel'}`);
    } catch (error) {
      toast.error('Failed to update theme');
    }
  };

  const memoryUsagePercent = memoryInfo
    ? Math.round((memoryInfo.used / memoryInfo.total) * 100)
    : null;

  // Theme-aware styling
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);

  return (
    <>
      {/* Enhanced Word Editor Icon Button */}
      {!hideFixedButtons && !hideWordEditorButton && (
        <motion.button
          onClick={() => setShowWordEditorDialog(true)}
          className={`fixed bottom-0 right-4 z-40 p-3.5 rounded-full border shadow-lg hover:shadow-xl backdrop-blur-sm transition-all ${
            isPastel
              ? 'bg-gradient-to-br from-pink-200/90 via-purple-200/90 to-blue-200/90 hover:from-pink-200 hover:via-purple-200 hover:to-blue-200 text-gray-800 border-pink-300/40 hover:shadow-pink-300/30'
              : 'bg-gradient-to-br from-purple-600/90 via-purple-500/90 to-cyan-600/90 hover:from-purple-600 hover:via-purple-500 hover:to-cyan-600 text-white border-purple-400/30 hover:shadow-purple-500/30'
          }`}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open word editor"
          style={{ marginBottom: '140px' }}
        >
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-sm ${isPastel ? 'bg-white/30' : 'bg-white/20'}`}></div>
            <FileText size={22} className="relative z-10" />
          </div>
        </motion.button>
      )}

      {/* Enhanced Settings Icon Button */}
      {!hideFixedButtons && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed bottom-0 right-4 z-40 p-3.5 rounded-full border shadow-lg hover:shadow-xl backdrop-blur-sm transition-all ${
            isPastel
              ? 'bg-gradient-to-br from-pink-200/90 via-purple-200/90 to-blue-200/90 hover:from-pink-200 hover:via-purple-200 hover:to-blue-200 text-gray-800 border-pink-300/40 hover:shadow-pink-300/30'
              : 'bg-gradient-to-br from-purple-600/90 via-purple-500/90 to-cyan-600/90 hover:from-purple-600 hover:via-purple-500 hover:to-cyan-600 text-white border-purple-400/30 hover:shadow-purple-500/30'
          }`}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open settings"
          style={{ marginBottom: '80px' }}
        >
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-sm ${isPastel ? 'bg-white/30' : 'bg-white/20'}`}></div>
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
              className={`fixed inset-0 backdrop-blur-sm z-40 ${
                isPastel ? 'bg-pink-200/40' : 'bg-black/60'
              }`}
            />

            {/* Enhanced Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed left-0 top-0 bottom-0 w-96 backdrop-blur-xl border-r shadow-2xl z-50 overflow-y-auto ${
                isPastel
                  ? 'bg-gradient-to-br from-slate-50 via-pink-50/50 to-slate-50 border-pink-200/40'
                  : 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-cyber-purple-400/30'
              }`}
            >
              <div className="p-6">
                {/* Enhanced Header */}
                <div className={`flex items-center justify-between mb-8 pb-6 border-b ${
                  isPastel ? 'border-pink-200/40' : 'border-cyber-purple-400/20'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {isPastel ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-purple-200 rounded-2xl blur-xl opacity-50"></div>
                          <div className="relative p-4 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl shadow-lg border-2 border-pink-200/40">
                            <Settings className="w-8 h-8 text-pink-500" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                          <div className="relative p-4 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                            <Settings className="w-8 h-8 text-white" />
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <h2 className={`text-3xl font-bold bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] ${
                        isPastel
                          ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400'
                          : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400'
                      }`}>
                        Settings
                      </h2>
                      <p className={`text-sm mt-1 ${isPastel ? 'text-gray-600' : 'text-gray-400'}`}>Configure your experience</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-xl transition-colors ${
                      isPastel
                        ? 'hover:bg-pink-100/80 text-gray-600 hover:text-gray-800'
                        : 'hover:bg-gray-800/80 text-gray-400 hover:text-white'
                    }`}
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
                    className={`mb-6 p-5 rounded-xl border backdrop-blur-sm ${
                      isPastel
                        ? 'bg-white/80 border-pink-200/40 shadow-lg'
                        : 'bg-gray-800/50 border-cyber-purple-400/30'
                    }`}
                    style={isPastel ? {
                      boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                    } : {}}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          {isPastel ? (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-lg blur-sm"></div>
                              <div className="relative p-2 bg-gradient-to-br from-pink-100/80 to-purple-100/80 rounded-lg border border-pink-200/30">
                                <MemoryStick className="w-5 h-5 text-pink-500" />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                              <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                                <MemoryStick className="w-5 h-5 text-white" />
                              </div>
                            </>
                          )}
                        </div>
                        <span className={`text-sm font-semibold ${isPastel ? 'text-gray-800' : 'text-gray-300'}`}>System Memory</span>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                        isPastel
                          ? 'bg-pink-50/80 border-pink-200/40'
                          : 'bg-gray-800/60 border-cyber-purple-400/20'
                      }`}>
                        <TrendingUp className={`w-3.5 h-3.5 ${isPastel ? 'text-pink-500' : 'text-cyber-purple-400'}`} />
                        <span className={`text-xs font-medium ${isPastel ? 'text-gray-800' : 'text-gray-300'}`}>{memoryUsagePercent}%</span>
                      </div>
                    </div>
                    <div className={`text-xs mb-3 font-mono ${isPastel ? 'text-gray-600' : 'text-gray-400'}`}>
                      {formatBytes(memoryInfo.used)} / {formatBytes(memoryInfo.total)}
                    </div>
                    <div className={`relative w-full rounded-full h-2.5 overflow-hidden ${
                      isPastel ? 'bg-pink-100/50' : 'bg-gray-700/50'
                    }`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${memoryUsagePercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`absolute left-0 top-0 h-full rounded-full shadow-lg ${
                          isPastel
                            ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400'
                            : 'bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600'
                        }`}
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
                    className={`p-5 rounded-xl border transition-all backdrop-blur-sm ${
                      isPastel
                        ? 'bg-white/80 border-pink-200/40 hover:border-pink-300/50 shadow-lg'
                        : 'bg-gray-800/40 border-gray-700/30 hover:border-cyber-purple-400/30'
                    }`}
                    style={isPastel ? {
                      boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                    } : {}}
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        {isPastel ? (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-pink-100/80 to-purple-100/80 rounded-lg border border-pink-200/30">
                              <Cpu className="w-5 h-5 text-pink-500" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                              <Cpu className="w-5 h-5 text-white" />
                            </div>
                          </>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isPastel ? 'text-gray-800' : 'text-gray-300'}`}>Hardware Acceleration</span>
                    </label>
                    <motion.button
                      onClick={handleHardwareAccelerationToggle}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative overflow-hidden group w-full p-3.5 rounded-xl border-2 transition-all font-medium ${
                        settings.hardwareAcceleration
                          ? isPastel
                            ? 'bg-pink-100/80 border-pink-400/60 text-gray-800 shadow-lg shadow-pink-400/20'
                            : 'bg-cyber-purple-500/20 border-cyber-purple-500/60 text-white shadow-lg shadow-cyber-purple-500/20'
                          : isPastel
                            ? 'bg-white/60 border-pink-200/50 text-gray-600 hover:border-pink-300/60'
                            : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600/50'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                        settings.hardwareAcceleration
                          ? isPastel
                            ? 'from-pink-200/20 via-purple-200/10 to-blue-200/20'
                            : 'from-purple-600/10 via-purple-600/5 to-cyan-600/10'
                          : isPastel
                            ? 'from-pink-200/0 via-purple-200/0 to-blue-200/0 group-hover:from-pink-200/10 group-hover:via-purple-200/5 group-hover:to-blue-200/10'
                            : 'from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/5 group-hover:via-purple-600/3 group-hover:to-cyan-600/5'
                      }`}></div>
                      <span className="relative z-10">{settings.hardwareAcceleration ? 'Enabled' : 'Disabled'}</span>
                    </motion.button>
                    <p className={`text-xs mt-3 leading-relaxed ${isPastel ? 'text-gray-600' : 'text-gray-500'}`}>
                      Boosts performance for PDF extraction and rendering. Requires restart.
                    </p>
                  </motion.div>

                  {/* RAM Limit */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className={`p-5 rounded-xl border transition-all backdrop-blur-sm ${
                      isPastel
                        ? 'bg-white/80 border-pink-200/40 hover:border-pink-300/50 shadow-lg'
                        : 'bg-gray-800/40 border-gray-700/30 hover:border-cyber-purple-400/30'
                    }`}
                    style={isPastel ? {
                      boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                    } : {}}
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        {isPastel ? (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-pink-100/80 to-purple-100/80 rounded-lg border border-pink-200/30">
                              <MemoryStick className="w-5 h-5 text-pink-500" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                              <MemoryStick className="w-5 h-5 text-white" />
                            </div>
                          </>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isPastel ? 'text-gray-800' : 'text-gray-300'}`}>
                        RAM Limit: <span className={isPastel ? 'text-pink-500' : 'text-cyber-purple-400'}>{settings.ramLimitMB}MB</span>
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
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                          isPastel ? 'accent-pink-400' : 'accent-cyber-purple-500'
                        }`}
                        style={isPastel ? {
                          background: `linear-gradient(to right, rgb(251, 182, 206) 0%, rgb(251, 182, 206) ${((settings.ramLimitMB - 512) / (8192 - 512)) * 100}%, rgb(241, 245, 249) ${((settings.ramLimitMB - 512) / (8192 - 512)) * 100}%, rgb(241, 245, 249) 100%)`
                        } : {
                          background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((settings.ramLimitMB - 512) / (8192 - 512)) * 100}%, rgb(55, 65, 81) ${((settings.ramLimitMB - 512) / (8192 - 512)) * 100}%, rgb(55, 65, 81) 100%)`
                        }}
                      />
                    </div>
                    <div className={`flex justify-between text-xs mb-3 ${isPastel ? 'text-gray-600' : 'text-gray-500'}`}>
                      <span>512MB</span>
                      <span>8192MB</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isPastel ? 'text-gray-600' : 'text-gray-500'}`}>
                      Memory threshold for automatic cleanup triggers.
                    </p>
                  </motion.div>

                  {/* Fullscreen */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`p-5 rounded-xl border transition-all backdrop-blur-sm ${
                      isPastel
                        ? 'bg-white/80 border-pink-200/40 hover:border-pink-300/50 shadow-lg'
                        : 'bg-gray-800/40 border-gray-700/30 hover:border-cyber-purple-400/30'
                    }`}
                    style={isPastel ? {
                      boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                    } : {}}
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        {isPastel ? (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-pink-100/80 to-purple-100/80 rounded-lg border border-pink-200/30">
                              <Monitor className="w-5 h-5 text-pink-500" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                              <Monitor className="w-5 h-5 text-white" />
                            </div>
                          </>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isPastel ? 'text-gray-800' : 'text-gray-300'}`}>Fullscreen</span>
                    </label>
                    <motion.button
                      onClick={handleFullscreenToggle}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative overflow-hidden group w-full p-3.5 rounded-xl border-2 transition-all font-medium ${
                        settings.fullscreen
                          ? isPastel
                            ? 'bg-pink-100/80 border-pink-400/60 text-gray-800 shadow-lg shadow-pink-400/20'
                            : 'bg-cyber-purple-500/20 border-cyber-purple-500/60 text-white shadow-lg shadow-cyber-purple-500/20'
                          : isPastel
                            ? 'bg-white/60 border-pink-200/50 text-gray-600 hover:border-pink-300/60'
                            : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600/50'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                        settings.fullscreen
                          ? isPastel
                            ? 'from-pink-200/20 via-purple-200/10 to-blue-200/20'
                            : 'from-purple-600/10 via-purple-600/5 to-cyan-600/10'
                          : isPastel
                            ? 'from-pink-200/0 via-purple-200/0 to-blue-200/0 group-hover:from-pink-200/10 group-hover:via-purple-200/5 group-hover:to-blue-200/10'
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
                    className={`p-5 rounded-xl border transition-all backdrop-blur-sm ${
                      isPastel
                        ? 'bg-white/80 border-pink-200/40 hover:border-pink-300/50 shadow-lg'
                        : 'bg-gray-800/40 border-gray-700/30 hover:border-cyber-purple-400/30'
                    }`}
                    style={isPastel ? {
                      boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                    } : {}}
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        {isPastel ? (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-pink-100/80 to-purple-100/80 rounded-lg border border-pink-200/30">
                              <Zap className="w-5 h-5 text-pink-500" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                          </>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isPastel ? 'text-gray-800' : 'text-gray-300'}`}>Extraction Quality</span>
                    </label>
                    <div className="relative">
                      {isPastel ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-xl blur-sm"></div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>
                      )}
                      <select
                        value={settings.extractionQuality}
                        onChange={(e) => handleExtractionQualityChange(e.target.value as 'high' | 'medium' | 'low')}
                        className={`relative w-full p-3.5 border-2 rounded-xl focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                          isPastel
                            ? 'bg-white/90 hover:bg-white border-pink-200/50 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20 text-gray-800'
                            : 'bg-gray-800/70 hover:bg-gray-800/80 border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 text-white'
                        }`}
                      >
                        <option value="high" className={isPastel ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'}>High</option>
                        <option value="medium" className={isPastel ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'}>Medium</option>
                        <option value="low" className={isPastel ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'}>Low</option>
                      </select>
                    </div>
                    <p className={`text-xs mt-3 leading-relaxed ${isPastel ? 'text-gray-600' : 'text-gray-500'}`}>
                      Higher quality uses more memory but produces better results.
                    </p>
                  </motion.div>

                  {/* Thumbnail Size */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`p-5 rounded-xl border transition-all backdrop-blur-sm ${
                      isPastel
                        ? 'bg-white/80 border-pink-200/40 hover:border-pink-300/50 shadow-lg'
                        : 'bg-gray-800/40 border-gray-700/30 hover:border-cyber-purple-400/30'
                    }`}
                    style={isPastel ? {
                      boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                    } : {}}
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        {isPastel ? (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-pink-100/80 to-purple-100/80 rounded-lg border border-pink-200/30">
                              <Image className="w-5 h-5 text-pink-500" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                              <Image className="w-5 h-5 text-white" />
                            </div>
                          </>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isPastel ? 'text-gray-800' : 'text-gray-300'}`}>
                        Thumbnail Size: <span className={isPastel ? 'text-pink-500' : 'text-cyber-purple-400'}>{settings.thumbnailSize}px</span>
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
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                          isPastel ? 'accent-pink-400' : 'accent-cyber-purple-500'
                        }`}
                        style={isPastel ? {
                          background: `linear-gradient(to right, rgb(251, 182, 206) 0%, rgb(251, 182, 206) ${((settings.thumbnailSize - 100) / (400 - 100)) * 100}%, rgb(241, 245, 249) ${((settings.thumbnailSize - 100) / (400 - 100)) * 100}%, rgb(241, 245, 249) 100%)`
                        } : {
                          background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((settings.thumbnailSize - 100) / (400 - 100)) * 100}%, rgb(55, 65, 81) ${((settings.thumbnailSize - 100) / (400 - 100)) * 100}%, rgb(55, 65, 81) 100%)`
                        }}
                      />
                    </div>
                    <div className={`flex justify-between text-xs ${isPastel ? 'text-gray-600' : 'text-gray-500'}`}>
                      <span>100px</span>
                      <span>400px</span>
                    </div>
                  </motion.div>

                  {/* Performance Mode */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className={`p-5 rounded-xl border transition-all backdrop-blur-sm ${
                      isPastel
                        ? 'bg-white/80 border-pink-200/40 hover:border-pink-300/50 shadow-lg'
                        : 'bg-gray-800/40 border-gray-700/30 hover:border-cyber-purple-400/30'
                    }`}
                    style={isPastel ? {
                      boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                    } : {}}
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        {isPastel ? (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-pink-100/80 to-purple-100/80 rounded-lg border border-pink-200/30">
                              <Gauge className="w-5 h-5 text-pink-500" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                              <Gauge className="w-5 h-5 text-white" />
                            </div>
                          </>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isPastel ? 'text-gray-800' : 'text-gray-300'}`}>Performance Mode</span>
                    </label>
                    <div className="relative">
                      {isPastel ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-xl blur-sm"></div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>
                      )}
                      <select
                        value={settings.performanceMode}
                        onChange={(e) => handlePerformanceModeChange(e.target.value as 'auto' | 'high' | 'balanced' | 'low')}
                        className={`relative w-full p-3.5 border-2 rounded-xl focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                          isPastel
                            ? 'bg-white/90 hover:bg-white border-pink-200/50 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20 text-gray-800'
                            : 'bg-gray-800/70 hover:bg-gray-800/80 border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 text-white'
                        }`}
                      >
                        <option value="auto" className={isPastel ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'}>Auto</option>
                        <option value="high" className={isPastel ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'}>High</option>
                        <option value="balanced" className={isPastel ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'}>Balanced</option>
                        <option value="low" className={isPastel ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'}>Low</option>
                      </select>
                    </div>
                    <p className={`text-xs mt-3 leading-relaxed ${isPastel ? 'text-gray-600' : 'text-gray-500'}`}>
                      Automatically adjusts settings based on system capabilities.
                    </p>
                  </motion.div>

                  {/* Theme Selection */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`p-5 rounded-xl border transition-all backdrop-blur-sm ${
                      isPastel
                        ? 'bg-white/80 border-pink-200/40 hover:border-pink-300/50 shadow-lg'
                        : 'bg-gray-800/40 border-gray-700/30 hover:border-cyber-purple-400/30'
                    }`}
                    style={isPastel ? {
                      boxShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                    } : {}}
                  >
                    <label className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        {isPastel ? (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-pink-100/80 to-purple-100/80 rounded-lg border border-pink-200/30">
                              <Palette className="w-5 h-5 text-pink-500" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
                            <div className="relative p-2 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                              <Palette className="w-5 h-5 text-white" />
                            </div>
                          </>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isPastel ? 'text-gray-800' : 'text-gray-300'}`}>Theme</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'brideware-purple' as Theme, name: 'Brideware Purple', colors: { primary: '#c084fc', secondary: '#22d3ee' } },
                        { value: 'pastel' as Theme, name: 'Pastel', colors: { primary: '#d8b4fe', secondary: '#a5b4fc' } },
                      ].map((themeOption) => {
                        const isSelected = settings.theme === themeOption.value;
                        return (
                          <motion.button
                            key={themeOption.value}
                            onClick={() => handleThemeChange(themeOption.value)}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative overflow-hidden p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? isPastel
                                  ? 'bg-pink-100/80 border-pink-400/60 shadow-lg shadow-pink-400/20'
                                  : 'bg-cyber-purple-500/20 border-cyber-purple-500/60 shadow-lg shadow-cyber-purple-500/20'
                                : isPastel
                                  ? 'bg-white/60 border-pink-200/50 hover:border-pink-300/60'
                                  : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50'
                            }`}
                            style={isPastel && isSelected ? {
                              boxShadow: '0 4px 20px rgba(251, 182, 206, 0.25), 0 0 0 1px rgba(251, 182, 206, 0.2)',
                            } : {}}
                          >
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute top-2 right-2 z-10"
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                                  isPastel
                                    ? 'bg-gradient-to-br from-pink-400 to-purple-400'
                                    : 'bg-gradient-to-br from-cyber-purple-400 to-cyber-cyan-400'
                                }`}>
                                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                </div>
                              </motion.div>
                            )}
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex gap-2">
                                <div
                                  className={`w-8 h-8 rounded-full border-2 ${
                                    isPastel ? 'border-white/40' : 'border-white/20'
                                  }`}
                                  style={{
                                    background: themeOption.colors.primary,
                                    boxShadow: `0 0 10px ${themeOption.colors.primary}80`,
                                  }}
                                />
                                <div
                                  className={`w-8 h-8 rounded-full border-2 ${
                                    isPastel ? 'border-white/40' : 'border-white/20'
                                  }`}
                                  style={{
                                    background: themeOption.colors.secondary,
                                    boxShadow: `0 0 10px ${themeOption.colors.secondary}80`,
                                  }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${
                                isSelected
                                  ? isPastel ? 'text-gray-800' : 'text-white'
                                  : isPastel ? 'text-gray-600' : 'text-gray-400'
                              }`}>
                                {themeOption.name}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                    <p className={`text-xs mt-3 leading-relaxed ${isPastel ? 'text-gray-600' : 'text-gray-500'}`}>
                      Choose your preferred color theme for the application.
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
            logger.error('Create file error:', error);
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
      {resolvedInlineContainerId && isWordEditorOpen ? (
        (() => {
          // When a workspace provides an inline container, try to render side-by-side there first.
          // Use the state variable to track availability (updated by effect)
          const container = inlineContainerAvailable 
            ? document.getElementById(resolvedInlineContainerId)
            : null;
          
          if (!container) {
            // Container not found - this can happen during initial render or reattach
            // Use overlay mode as fallback, but this should be rare in archive mode
            return (
              <WordEditorPanel
                isOpen={isWordEditorOpen}
                onClose={() => {
                  closeWordEditorPanel();
                }}
                initialFilePath={currentFilePath}
                openLibrary={openLibraryOnMount}
                layoutMode="overlay"
              />
            );
          }
          // Container exists - use inline mode for side-by-side layout
          return createPortal(
            <WordEditorPanel
              isOpen={isWordEditorOpen}
              onClose={() => {
                closeWordEditorPanel();
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
            closeWordEditorPanel();
          }}
          initialFilePath={currentFilePath}
          openLibrary={openLibraryOnMount}
          layoutMode="overlay"
        />
      )}
    </>
  );
}
