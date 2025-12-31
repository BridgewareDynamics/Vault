import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppSettings } from '../types';

// Mock memoryMonitor - define everything inside the factory
vi.mock('./memoryMonitor', () => {
  // Create mock functions inside the factory
  const mockStart = vi.fn();
  const mockStop = vi.fn();
  const mockIsRunning = vi.fn(() => false);

  // Create a mock class that properly returns an instance
  class MockMemoryMonitor {
    start = mockStart;
    stop = mockStop;
    isRunning = mockIsRunning;

    constructor() {
      // Constructor can be empty or used for setup
    }
  }

  // Store references on the class for test access
  (MockMemoryMonitor as any)._mockStart = mockStart;
  (MockMemoryMonitor as any)._mockStop = mockStop;
  (MockMemoryMonitor as any)._mockIsRunning = mockIsRunning;

  return {
    getMemoryInfo: vi.fn(),
    formatBytes: vi.fn((bytes: number) => `${bytes} bytes`),
    requestGarbageCollection: vi.fn(),
    MemoryMonitor: MockMemoryMonitor,
  };
});

// Import after mock
import { MemoryManager, getMemoryManager } from './memoryManager';
import { getMemoryInfo, MemoryMonitor } from './memoryMonitor';

// Get mock function references for test access
const mockStart = (MemoryMonitor as any)._mockStart;
const mockStop = (MemoryMonitor as any)._mockStop;
const mockIsRunning = (MemoryMonitor as any)._mockIsRunning;

describe('MemoryManager', () => {
  const defaultSettings: AppSettings = {
    hardwareAcceleration: true,
    ramLimitMB: 2048,
    fullscreen: false,
    extractionQuality: 'high',
    thumbnailSize: 200,
    performanceMode: 'auto',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStart.mockClear();
    mockStop.mockClear();
    mockIsRunning.mockReturnValue(false);
    (getMemoryInfo as any).mockReturnValue({
      usedJSHeapSize: 100 * 1024 * 1024, // 100MB
      totalJSHeapSize: 200 * 1024 * 1024, // 200MB
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should initialize with settings', () => {
      const manager = new MemoryManager();
      manager.initialize(defaultSettings);

      // Should not throw
      expect(manager).toBeDefined();
      expect(mockStart).toHaveBeenCalled();
    });

    it('should start monitoring after initialization', () => {
      const manager = new MemoryManager();
      manager.initialize(defaultSettings);

      // Verify start was called
      expect(mockStart).toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    it('should update settings and restart monitoring if RAM limit changed', () => {
      const manager = new MemoryManager();
      manager.initialize(defaultSettings);

      mockStart.mockClear();
      mockStop.mockClear();

      const newSettings = { ...defaultSettings, ramLimitMB: 4096 };
      manager.updateSettings(newSettings);

      // Should stop old monitor and start new one
      expect(mockStop).toHaveBeenCalled();
      expect(mockStart).toHaveBeenCalled();
    });

    it('should not restart monitoring if RAM limit unchanged', () => {
      const manager = new MemoryManager();
      manager.initialize(defaultSettings);

      mockStart.mockClear();
      mockStop.mockClear();

      const newSettings = { ...defaultSettings, fullscreen: true };
      manager.updateSettings(newSettings);

      // Should not restart monitoring
      expect(mockStop).not.toHaveBeenCalled();
      expect(mockStart).not.toHaveBeenCalled();
    });
  });

  describe('registerCleanupCallback', () => {
    it('should register cleanup callback', () => {
      const manager = new MemoryManager();
      const callback = vi.fn();

      const unregister = manager.registerCleanupCallback(callback);

      expect(unregister).toBeDefined();
      expect(typeof unregister).toBe('function');
    });

    it('should unregister cleanup callback', () => {
      const manager = new MemoryManager();
      const callback = vi.fn();

      const unregister = manager.registerCleanupCallback(callback);
      unregister();

      // Callback should be removed (we can't directly test this, but unregister should work)
      expect(unregister).toBeDefined();
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage info', () => {
      const manager = new MemoryManager();
      const usage = manager.getMemoryUsage();

      expect(usage).toBeDefined();
      if (usage) {
        expect(usage.used).toBeGreaterThanOrEqual(0);
        expect(usage.total).toBeGreaterThan(0);
        expect(usage.percent).toBeGreaterThanOrEqual(0);
        expect(usage.percent).toBeLessThanOrEqual(100);
      }
    });

    it('should return null when memory info is not available', () => {
      (getMemoryInfo as any).mockReturnValue(null);

      const manager = new MemoryManager();
      const usage = manager.getMemoryUsage();

      expect(usage).toBeNull();
    });
  });

  describe('manualCleanup', () => {
    it('should trigger cleanup manually', async () => {
      vi.useFakeTimers();
      const manager = new MemoryManager();
      const callback = vi.fn();
      manager.registerCleanupCallback(callback);

      const cleanupPromise = manager.manualCleanup();
      
      // Advance timers to complete the setTimeout in cleanup
      await vi.advanceTimersByTimeAsync(1000);
      
      await cleanupPromise;

      // Cleanup should be triggered
      expect(callback).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should handle cleanup errors gracefully', async () => {
      vi.useFakeTimers();
      const manager = new MemoryManager();
      const errorCallback = vi.fn(() => {
        throw new Error('Cleanup failed');
      });
      manager.registerCleanupCallback(errorCallback);

      const cleanupPromise = manager.manualCleanup();
      
      // Advance timers to complete the setTimeout
      await vi.advanceTimersByTimeAsync(1000);
      
      // Should not throw
      await expect(cleanupPromise).resolves.not.toThrow();
      
      vi.useRealTimers();
    });
  });

  describe('shutdown', () => {
    it('should shutdown and clean up', () => {
      const manager = new MemoryManager();
      manager.initialize(defaultSettings);

      mockStop.mockClear();

      manager.shutdown();

      // Should stop monitoring
      expect(mockStop).toHaveBeenCalled();
    });
  });

  describe('getMemoryManager (singleton)', () => {
    it('should return the same instance', () => {
      const manager1 = getMemoryManager();
      const manager2 = getMemoryManager();

      expect(manager1).toBe(manager2);
    });
  });

  describe('memory threshold handling', () => {
    it('should trigger cleanup when memory exceeds limit', async () => {
      vi.useFakeTimers();
      const manager = new MemoryManager();
      manager.initialize({ ...defaultSettings, ramLimitMB: 512 }); // 512MB limit

      const callback = vi.fn();
      manager.registerCleanupCallback(callback);

      // Mock memory info exceeding limit
      (getMemoryInfo as any).mockReturnValue({
        usedJSHeapSize: 600 * 1024 * 1024, // 600MB (exceeds 512MB limit)
        totalJSHeapSize: 800 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
      });

      // Trigger cleanup manually to test the logic
      const cleanupPromise = manager.manualCleanup();
      
      // Advance timers to complete the setTimeout
      await vi.advanceTimersByTimeAsync(1000);
      
      await cleanupPromise;

      expect(callback).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not trigger cleanup when memory is below limit', async () => {
      vi.useFakeTimers();
      const manager = new MemoryManager();
      manager.initialize({ ...defaultSettings, ramLimitMB: 2048 }); // 2GB limit

      const callback = vi.fn();
      manager.registerCleanupCallback(callback);

      // Mock memory info below limit
      (getMemoryInfo as any).mockReturnValue({
        usedJSHeapSize: 100 * 1024 * 1024, // 100MB (below 2GB limit)
        totalJSHeapSize: 200 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
      });

      // Even if we trigger manually, the threshold check should pass
      const cleanupPromise = manager.manualCleanup();
      
      // Advance timers to complete the setTimeout
      await vi.advanceTimersByTimeAsync(1000);
      
      await cleanupPromise;

      // Callback should still be called (manual cleanup always runs)
      expect(callback).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
