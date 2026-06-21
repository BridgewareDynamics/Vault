import { describe, it, expect } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { ToastContainer } from './ToastContainer';
import { useToast } from './ToastContext';
import { renderWithProviders } from '../../test-utils/render';

describe('ToastContainer', () => {
  it('should render container when there are no toasts', () => {
    renderWithProviders(<ToastContainer />, { withToast: true });
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

    renderWithProviders(<TestComponent />, { withToast: true });

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
        act(() => {
          showToast('Test toast', 'info');
        });
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

    renderWithProviders(<TestComponent />, { withToast: true });

    await waitFor(() => {
      expect(screen.getByText('Test toast')).toBeInTheDocument();
    });

    const dismissButton = screen.getByText('Dismiss');
    await act(async () => {
      await user.click(dismissButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test toast')).not.toBeInTheDocument();
    });
  });
});
