import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from './ToastContext';
import { TOAST_DURATION } from '../../utils/constants';

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide toast context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    expect(result.current.toasts).toEqual([]);
    expect(result.current.showToast).toBeDefined();
    expect(result.current.dismissToast).toBeDefined();
    expect(result.current.updateToast).toBeDefined();
    expect(result.current.success).toBeDefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.info).toBeDefined();
    expect(result.current.warning).toBeDefined();
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within ToastProvider');
    
    consoleSpy.mockRestore();
  });

  it('should create toast with showToast', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('Test message', 'info');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('info');
    expect(result.current.toasts[0].duration).toBe(TOAST_DURATION);
  });

  it('should create toast with custom duration', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('Test message', 'info', 5000);
    });

    expect(result.current.toasts[0].duration).toBe(5000);
  });

  it('should create toast with duration 0 (no auto-dismiss)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('Test message', 'info', 0);
    });

    expect(result.current.toasts[0].duration).toBe(0);
    expect(result.current.toasts).toHaveLength(1);
  });

  it('should update existing toast', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    let toastId: string;
    act(() => {
      toastId = result.current.showToast('Original message', 'info');
    });

    act(() => {
      result.current.updateToast(toastId, 'Updated message', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Updated message');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('should dismiss toast', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    let toastId: string;
    act(() => {
      toastId = result.current.showToast('Test message', 'info');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismissToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should create success toast with success helper', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.success('Success message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Success message');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('should create error toast with error helper', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.error('Error message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Error message');
    expect(result.current.toasts[0].type).toBe('error');
  });

  it('should create info toast with info helper', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.info('Info message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Info message');
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('should create warning toast with warning helper', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.warning('Warning message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Warning message');
    expect(result.current.toasts[0].type).toBe('warning');
  });

  it('should auto-dismiss toast after duration', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    let toastId: string;
    act(() => {
      toastId = result.current.showToast('Test message', 'info', 1000);
    });

    expect(result.current.toasts).toHaveLength(1);

    // Fast-forward time - this should trigger the setTimeout callback
    await act(async () => {
      vi.advanceTimersByTime(1000);
      // Run all pending timers
      await vi.runAllTimersAsync();
    });

    // Check that toast was dismissed
    expect(result.current.toasts).toHaveLength(0);
  });

  it('should not auto-dismiss toast with duration 0', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('Test message', 'info', 0);
    });

    expect(result.current.toasts).toHaveLength(1);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION);
    });

    // Toast should still be there
    expect(result.current.toasts).toHaveLength(1);
  });

  it('should generate unique toast IDs', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    let id1: string, id2: string, id3: string;
    act(() => {
      id1 = result.current.showToast('Message 1', 'info');
      id2 = result.current.showToast('Message 2', 'info');
      id3 = result.current.showToast('Message 3', 'info');
    });

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });
});









