import { MemoryMonitor, getMemoryInfo, formatBytes, requestGarbageCollection } from './memoryMonitor';
import { AppSettings } from '../types';
import { logger } from './logger';

/**
 * Memory Manager - Integrates RAM control with memory monitoring
 * Triggers cleanup when memory threshold is exceeded
 */
export class MemoryManager {
  private monitor: MemoryMonitor | null = null;
  private settings: AppSettings | null = null;
  private cleanupCallbacks: Set<() => void> = new Set();
  private isCleaningUp = false;

  /**
   * Initialize memory manager with settings
   */
  initialize(settings: AppSettings): void {
    this.settings = settings;
    this.startMonitoring();
  }

  /**
   * Update settings and restart monitoring if needed
   */
  updateSettings(settings: AppSettings): void {
    const ramLimitChanged = this.settings?.ramLimitMB !== settings.ramLimitMB;
    this.settings = settings;

    if (ramLimitChanged) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    if (!this.settings) {
      return;
    }

    // Convert MB to bytes for comparison
    const ramLimitBytes = this.settings.ramLimitMB * 1024 * 1024;

    this.monitor = new MemoryMonitor(() => {
      void this.triggerCleanup();
    }, {
      maxUsedBytes: ramLimitBytes,
      intervalMs: 5000,
    });

    this.monitor.start();
  }

  /**
   * Stop memory monitoring
   */
  private stopMonitoring(): void {
    if (this.monitor) {
      this.monitor.stop();
      this.monitor = null;
    }
  }

  /**
   * Register a cleanup callback
   */
  registerCleanupCallback(callback: () => void): () => void {
    this.cleanupCallbacks.add(callback);
    // Return unregister function
    return () => {
      this.cleanupCallbacks.delete(callback);
    };
  }

  /**
   * Trigger cleanup when memory threshold is exceeded
   */
  private async triggerCleanup(): Promise<void> {
    if (this.isCleaningUp) {
      return; // Already cleaning up
    }

    this.isCleaningUp = true;

    try {
      if (import.meta.env.DEV) {
        logger.info('[MemoryManager] Memory threshold exceeded, triggering cleanup...');
      }

      const memoryInfo = getMemoryInfo();
      if (memoryInfo && import.meta.env.DEV) {
        logger.info(`[MemoryManager] Memory before cleanup: ${formatBytes(memoryInfo.usedJSHeapSize)}`);
      }

      // Execute all registered cleanup callbacks
      for (const callback of this.cleanupCallbacks) {
        try {
          callback();
        } catch (error) {
          logger.error('[MemoryManager] Cleanup callback error:', error);
        }
      }

      // Request garbage collection if available
      requestGarbageCollection();

      // Wait a bit for GC to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check memory after cleanup
      const memoryInfoAfter = getMemoryInfo();
      if (memoryInfoAfter && memoryInfo && import.meta.env.DEV) {
        const freed = memoryInfo.usedJSHeapSize - memoryInfoAfter.usedJSHeapSize;
        logger.info(
          `[MemoryManager] Memory after cleanup: ${formatBytes(memoryInfoAfter.usedJSHeapSize)} (freed: ${formatBytes(freed)})`,
        );
      }
    } catch (error) {
      logger.error('[MemoryManager] Cleanup error:', error);
    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): { used: number; total: number; percent: number } | null {
    const info = getMemoryInfo();
    if (!info) {
      return null;
    }

    return {
      used: info.usedJSHeapSize,
      total: info.jsHeapSizeLimit,
      percent: Math.round((info.usedJSHeapSize / info.jsHeapSizeLimit) * 100),
    };
  }

  /**
   * Manually trigger cleanup
   */
  async manualCleanup(): Promise<void> {
    await this.triggerCleanup();
  }

  /**
   * Cleanup on shutdown
   */
  shutdown(): void {
    this.stopMonitoring();
    this.cleanupCallbacks.clear();
  }
}

// Singleton instance
let memoryManagerInstance: MemoryManager | null = null;

/**
 * Get the global memory manager instance
 */
export function getMemoryManager(): MemoryManager {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager();
  }
  return memoryManagerInstance;
}














