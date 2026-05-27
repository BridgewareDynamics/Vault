import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockExpandModal } from './BlockExpandModal';
import { buildChronology } from '../../utils/mapChronology';
import type { MapBlock } from '../../types';

vi.mock('../WordEditor/LexicalEditor', () => ({
  LexicalEditor: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="lexical-editor">{placeholder}</div>
  ),
}));

vi.mock('../Archive/ArchiveFileViewer', () => ({
  ArchiveFileViewer: () => null,
}));

function makeBlock(): MapBlock {
  return {
    id: 'block-1',
    kind: 'timeline',
    title: 'Witness interview summary',
    chronology: buildChronology({ tier: 'year', year: 2024 }),
    notesHtml: '<p>Detailed notes about the timeline event.</p>',
    attachments: [
      {
        id: 'att-1',
        fileName: 'exhibit-a.pdf',
        relativePath: 'assets/exhibit-a.pdf',
        vaultPath: '/vault/exhibit-a.pdf',
        type: 'pdf',
      },
    ],
    position: { x: 0, y: 0 },
    size: { width: 280, height: 186 },
  };
}

describe('BlockExpandModal', () => {
  it('renders the expanded dossier layout with title and stats', () => {
    render(
      <BlockExpandModal
        isOpen
        block={makeBlock()}
        theme="dark"
        onClose={vi.fn()}
        onNotesChange={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Witness interview summary')).toBeInTheDocument();
    expect(screen.getByText('Research notes')).toBeInTheDocument();
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText('exhibit-a.pdf')).toBeInTheDocument();
    expect(screen.getByText(/1 attachment/)).toBeInTheDocument();
  });

  it('closes when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <BlockExpandModal
        isOpen
        block={makeBlock()}
        theme="pastel"
        onClose={onClose}
        onNotesChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Close expanded block' }));
    expect(onClose).toHaveBeenCalled();
  });
});
