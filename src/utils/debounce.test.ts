import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, debounceWithFlush } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on multiple calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);
      debouncedFn();
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle multiple rapid calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle different wait times', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 500);

      debouncedFn();
      vi.advanceTimersByTime(499);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('debounceWithFlush', () => {
    it('should delay function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on multiple calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);
      debouncedFn();
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should have flush method that executes immediately', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn('arg1');
      expect(fn).not.toHaveBeenCalled();

      debouncedFn.flush();
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg1');

      // Timer should be cleared after flush
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should flush with latest arguments', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      debouncedFn.flush();
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('third');
    });

    it('should handle flush when no pending call', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn.flush();
      expect(fn).not.toHaveBeenCalled();
    });

    it('should handle flush after execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn('arg1');
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      debouncedFn.flush();
      expect(fn).toHaveBeenCalledTimes(1); // Should not call again
    });

    it('should have cancel method that cancels pending execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn('arg1');
      debouncedFn.cancel();

      vi.advanceTimersByTime(100);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should handle cancel when no pending call', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn.cancel();
      expect(fn).not.toHaveBeenCalled();
    });

    it('should handle cancel after multiple calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn.cancel();

      vi.advanceTimersByTime(100);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should handle cancel then new call', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn('first');
      debouncedFn.cancel();
      debouncedFn('second');

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('second');
    });

    it('should handle flush then cancel', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn('arg1');
      debouncedFn.flush();
      expect(fn).toHaveBeenCalledTimes(1);

      debouncedFn.cancel();
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1); // Should not call again
    });

    it('should handle multiple rapid calls with flush', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');
      debouncedFn.flush();

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('third');

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle flush with no arguments', () => {
      const fn = vi.fn();
      const debouncedFn = debounceWithFlush(fn, 100);

      debouncedFn();
      debouncedFn.flush();

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith();
    });
  });
});




