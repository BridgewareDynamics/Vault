import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

// Mock electron-log
vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    transports: {
      file: {
        level: '',
        maxSize: 0,
      },
      console: {
        level: '',
      },
    },
  },
}));

// Mock electron app
vi.mock('electron', () => ({
  app: {
    isPackaged: false,
  },
}));

describe('logger (main process)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have all logger methods', () => {
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should call logger methods', async () => {
    const electronLog = await import('electron-log');

    logger.log('test log');
    logger.info('test info');
    logger.warn('test warn');
    logger.error('test error');
    logger.debug('test debug');

    expect(electronLog.default.info).toHaveBeenCalledWith('test log');
    expect(electronLog.default.info).toHaveBeenCalledWith('test info');
    expect(electronLog.default.warn).toHaveBeenCalledWith('test warn');
    expect(electronLog.default.error).toHaveBeenCalledWith('test error');
    // Debug may or may not be called depending on isDev
    if (process.env.NODE_ENV === 'development') {
      expect(electronLog.default.debug).toHaveBeenCalledWith('test debug');
    }
  });

  it('should handle multiple arguments', async () => {
    const electronLog = await import('electron-log');

    logger.log('arg1', 'arg2', { key: 'value' });
    logger.error('error', new Error('test'));

    expect(electronLog.default.info).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
    expect(electronLog.default.error).toHaveBeenCalledWith('error', expect.any(Error));
  });
});







