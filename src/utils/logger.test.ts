import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('logger (renderer)', () => {
  const originalConsole = { ...console };
  const originalElectronAPI = window.electronAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.debug = vi.fn();
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
    (window as any).electronAPI = originalElectronAPI;
  });

  it('should log to console in development mode', () => {
    // In test environment, import.meta.env.DEV should be true
    logger.log('test log');
    logger.info('test info');
    logger.warn('test warn');
    logger.error('test error');
    logger.debug('test debug');

    // Should log to console in dev mode
    expect(console.log).toHaveBeenCalledWith('test log');
    expect(console.info).toHaveBeenCalledWith('test info');
    expect(console.warn).toHaveBeenCalledWith('test warn');
    expect(console.error).toHaveBeenCalledWith('test error');
    expect(console.debug).toHaveBeenCalledWith('test debug');
  });

  it('should route logs to main process in production when API available', async () => {
    const mockLogToMain = vi.fn().mockResolvedValue(undefined);
    (window as any).electronAPI = {
      logToMain: mockLogToMain,
    };

    // Mock import.meta.env to simulate production
    const originalEnv = import.meta.env;
    (import.meta as any).env = { ...originalEnv, DEV: false, MODE: 'production' };

    // Re-import logger to get production behavior
    vi.resetModules();
    const { logger: prodLogger } = await import('./logger');

    await prodLogger.log('prod log');
    await prodLogger.info('prod info');
    await prodLogger.warn('prod warn');
    await prodLogger.error('prod error');
    await prodLogger.debug('prod debug');

    // Should call logToMain in production
    expect(mockLogToMain).toHaveBeenCalledWith('log', 'prod log');
    expect(mockLogToMain).toHaveBeenCalledWith('info', 'prod info');
    expect(mockLogToMain).toHaveBeenCalledWith('warn', 'prod warn');
    expect(mockLogToMain).toHaveBeenCalledWith('error', 'prod error');
    expect(mockLogToMain).toHaveBeenCalledWith('debug', 'prod debug');

    // Restore
    (import.meta as any).env = originalEnv;
  });

  it('should always log errors to console even in production', async () => {
    const mockLogToMain = vi.fn().mockResolvedValue(undefined);
    (window as any).electronAPI = {
      logToMain: mockLogToMain,
    };

    const originalEnv = import.meta.env;
    (import.meta as any).env = { ...originalEnv, DEV: false, MODE: 'production' };

    vi.resetModules();
    const { logger: prodLogger } = await import('./logger');

    await prodLogger.error('error message');

    // Error should always be logged to console
    expect(console.error).toHaveBeenCalledWith('error message');
    // And also routed to main process
    expect(mockLogToMain).toHaveBeenCalledWith('error', 'error message');

    (import.meta as any).env = originalEnv;
  });

  it('should fallback to console when IPC fails', async () => {
    const mockLogToMain = vi.fn().mockRejectedValue(new Error('IPC failed'));
    (window as any).electronAPI = {
      logToMain: mockLogToMain,
    };

    const originalEnv = import.meta.env;
    (import.meta as any).env = { ...originalEnv, DEV: false, MODE: 'production' };

    vi.resetModules();
    const { logger: prodLogger } = await import('./logger');

    await prodLogger.log('fallback test');

    // Should fallback to console when IPC fails
    expect(console.log).toHaveBeenCalledWith('fallback test');

    (import.meta as any).env = originalEnv;
  });

  it('should fallback to console when Electron API is not available', () => {
    (window as any).electronAPI = undefined;

    logger.log('no api log');
    logger.info('no api info');

    // Should fallback to console
    expect(console.log).toHaveBeenCalledWith('no api log');
    expect(console.info).toHaveBeenCalledWith('no api info');
  });
});



