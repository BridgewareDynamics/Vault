import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewMapNameDialog } from './NewMapNameDialog';

describe('NewMapNameDialog', () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies a suggestion and confirms the selected map name', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(
        <NewMapNameDialog
          isOpen
          theme="pastel"
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      await Promise.resolve();
    });

    await user.click(screen.getByRole('button', { name: 'Incident Timeline' }));
    expect(screen.getByLabelText('New map name')).toHaveValue('Incident Timeline');

    await user.click(screen.getByRole('button', { name: /create map/i }));

    expect(onConfirm).toHaveBeenCalledWith('Incident Timeline');
  });

  it('closes when escape is pressed in the name field', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(
        <NewMapNameDialog
          isOpen
          theme="brideware-purple"
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      await Promise.resolve();
    });

    await user.type(screen.getByLabelText('New map name'), '{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
