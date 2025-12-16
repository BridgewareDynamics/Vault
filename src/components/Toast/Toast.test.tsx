import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from './Toast';
import { Toast as ToastType } from '../../types';

describe('Toast', () => {
  const mockOnDismiss = vi.fn();
  const defaultToast: ToastType = {
    id: 'toast-1',
    message: 'Test message',
    type: 'info',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toast with message', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render success toast with correct styles', () => {
    const successToast: ToastType = {
      ...defaultToast,
      type: 'success',
    };
    const { container } = render(<Toast toast={successToast} onDismiss={mockOnDismiss} />);
    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement.className).toContain('cyber-purple-600');
    expect(toastElement.className).toContain('cyber-purple-500');
  });

  it('should render error toast with correct styles', () => {
    const errorToast: ToastType = {
      ...defaultToast,
      type: 'error',
    };
    const { container } = render(<Toast toast={errorToast} onDismiss={mockOnDismiss} />);
    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement.className).toContain('red-600');
    expect(toastElement.className).toContain('red-500');
  });

  it('should render warning toast with correct styles', () => {
    const warningToast: ToastType = {
      ...defaultToast,
      type: 'warning',
    };
    const { container } = render(<Toast toast={warningToast} onDismiss={mockOnDismiss} />);
    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement.className).toContain('yellow-600');
    expect(toastElement.className).toContain('yellow-500');
  });

  it('should render info toast with correct styles', () => {
    const infoToast: ToastType = {
      ...defaultToast,
      type: 'info',
    };
    const { container } = render(<Toast toast={infoToast} onDismiss={mockOnDismiss} />);
    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement.className).toContain('bg-gradient-purple');
  });

  it('should call onDismiss when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    const closeButton = screen.getByLabelText('Dismiss');
    await user.click(closeButton);
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    expect(mockOnDismiss).toHaveBeenCalledWith('toast-1');
  });

  it('should render close button', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  it('should render with different toast IDs', () => {
    const toast1: ToastType = { id: 'toast-1', message: 'Message 1', type: 'info' };
    const toast2: ToastType = { id: 'toast-2', message: 'Message 2', type: 'success' };
    
    const { rerender } = render(<Toast toast={toast1} onDismiss={mockOnDismiss} />);
    expect(screen.getByText('Message 1')).toBeInTheDocument();
    
    rerender(<Toast toast={toast2} onDismiss={mockOnDismiss} />);
    expect(screen.getByText('Message 2')).toBeInTheDocument();
    expect(screen.queryByText('Message 1')).not.toBeInTheDocument();
  });
});










