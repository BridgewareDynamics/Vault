import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useEffect } from 'react';
import { ToastContainer } from './ToastContainer';
import { ToastProvider, useToast } from './ToastContext';

describe('ToastContainer', () => {
  it('should render container when there are no toasts', () => {
    render(
      <ToastProvider>
        <ToastContainer />
      </ToastProvider>
    );
    // Container should exist
    const container = document.querySelector('.fixed.bottom-4.right-4');
    expect(container).toBeInTheDocument();
  });

  it('should render multiple toasts', async () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      useEffect(() => {
        showToast('First toast', 'info');
        showToast('Second toast', 'success');
        showToast('Third toast', 'error');
      }, [showToast]);
      return <ToastContainer />;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Wait for toasts to appear
    await waitFor(() => {
      expect(screen.getByText('First toast')).toBeInTheDocument();
    });
    expect(screen.getByText('Second toast')).toBeInTheDocument();
    expect(screen.getByText('Third toast')).toBeInTheDocument();
  });

  it('should handle toast dismissal', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const { showToast, dismissToast, toasts } = useToast();
      useEffect(() => {
        showToast('Test toast', 'info');
      }, [showToast]);
      return (
        <div>
          <ToastContainer />
          {toasts.length > 0 && (
            <button onClick={() => dismissToast(toasts[0]?.id)}>Dismiss</button>
          )}
        </div>
      );
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Wait for toast to appear
    await waitFor(() => {
      expect(screen.getByText('Test toast')).toBeInTheDocument();
    });

    const dismissButton = screen.getByText('Dismiss');
    await user.click(dismissButton);

    // Toast should be removed
    await waitFor(() => {
      expect(screen.queryByText('Test toast')).not.toBeInTheDocument();
    });
  });
});






