import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteTranscriptionDialog } from './DeleteTranscriptionDialog';
import type { TranscriptionListEntry } from '../../types';

function makeEntry(): TranscriptionListEntry {
  return {
    id: 'tx-1',
    title: 'Deposition audio batch',
    transcriptionFolderPath: '/vault/transcriptions/tx-1',
    casePath: null,
    modified: Date.now() - 1000 * 60 * 60 * 5,
    sourceCount: 3,
    status: 'ready',
    excerpt: 'Opening statement transcript excerpt.',
  };
}

describe('DeleteTranscriptionDialog', () => {
  it('renders workspace details and warning copy', () => {
    render(
      <DeleteTranscriptionDialog
        isOpen
        theme="dark"
        entry={makeEntry()}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Deposition audio batch')).toBeInTheDocument();
    expect(screen.getByText('Opening statement transcript excerpt.')).toBeInTheDocument();
    expect(screen.getByText(/Permanently removes the transcript folder/)).toBeInTheDocument();
  });

  it('calls confirm and cancel handlers', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteTranscriptionDialog
        isOpen
        theme="pastel"
        entry={makeEntry()}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete Transcript' }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
