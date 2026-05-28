import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockElectronAPI } from '../../test-utils/mocks';

vi.mock('../WordEditor/LexicalEditor', () => ({
  LexicalEditor: () => <div data-testid="mock-lexical-editor" />,
}));

vi.mock('./MapBlockColorPicker', () => ({
  MapBlockColorPicker: ({
    onSurfaceColorChange,
    onBorderColorChange,
  }: {
    onSurfaceColorChange: (color?: string) => void;
    onBorderColorChange: (color?: string) => void;
  }) => (
    <div data-testid="mock-color-picker">
      <button type="button" onClick={() => onSurfaceColorChange('#7C3AED')}>
        Choose Royal Velvet for card fill
      </button>
      <button type="button">Edit Border</button>
      <button type="button" onClick={() => onBorderColorChange('#14B8A6')}>
        Choose Aurora Mint for border
      </button>
    </div>
  ),
}));

vi.mock('./MapVaultLibraryPanel', () => ({
  MapVaultLibraryPanel: ({
    isOpen,
    onAttachFile,
  }: {
    isOpen: boolean;
    onAttachFile: (attachment: {
      sourcePath: string;
      fileName: string;
      origin: 'vault';
      type: 'pdf';
    }) => void;
  }) =>
    isOpen ? (
      <button
        type="button"
        onClick={() =>
          onAttachFile({
            sourcePath: '/vault/Acme Case/Evidence/report.pdf',
            fileName: 'report.pdf',
            origin: 'vault',
            type: 'pdf',
          })
        }
      >
        Attach report.pdf
      </button>
    ) : null,
}));

vi.mock('./mapTheme', () => ({
  useMapTheme: () => ({
    card: 'card',
    cardHover: 'card-hover',
    button: 'button',
    heading: 'heading',
    muted: 'muted',
    primary: 'primary',
    isPastel: false,
  }),
}));

import { CreateBlockDialog } from './CreateBlockDialog';

describe('CreateBlockDialog', () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    onSubmit.mockReset();
    mockElectronAPI.selectMapAttachments.mockResolvedValue([]);
    mockElectronAPI.copyMapAttachmentToAssets.mockResolvedValue({
      relativePath: 'assets/copied.pdf',
      vaultPath: '/maps/case-map/assets/copied.pdf',
      fileName: 'local-file.pdf',
      type: 'pdf',
    });
  });

  function renderDialog(linkedCasePath: string | null = null) {
    render(
      <CreateBlockDialog
        isOpen
        onClose={onClose}
        theme="brideware-purple"
        mapFolderPath="/maps/case-map"
        linkedCasePath={linkedCasePath}
        onSubmit={onSubmit}
      />
    );
  }

  it('renders the create dialog without hanging', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Block' })).toBeInTheDocument();
  });

  it('attaches Vault PDFs as linked files from the case library', async () => {
    renderDialog('/vault/Acme Case');

    fireEvent.click(screen.getByRole('button', { name: 'Files' }));
    fireEvent.click(screen.getByRole('button', { name: /Browse Vault case library/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Attach report\.pdf/i }));

    expect(screen.getByText('Vault link will be added on save')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Create Block' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(mockElectronAPI.copyMapAttachmentToAssets).not.toHaveBeenCalled();
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      attachments: [
        {
          fileName: 'report.pdf',
          relativePath: '/vault/Acme Case/Evidence/report.pdf',
          vaultPath: '/vault/Acme Case/Evidence/report.pdf',
          type: 'pdf',
        },
      ],
    });
  });

  it('copies locally picked files into map assets on save', async () => {
    mockElectronAPI.selectMapAttachments.mockResolvedValue(['C:/Users/test/Documents/local-file.pdf']);

    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Files' }));
    fireEvent.click(screen.getByRole('button', { name: /Add local files/i }));

    await waitFor(() => {
      expect(screen.getByText('Will be copied into block on save')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Block' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(mockElectronAPI.copyMapAttachmentToAssets).toHaveBeenCalledWith(
      '/maps/case-map',
      'C:/Users/test/Documents/local-file.pdf',
      expect.any(String)
    );
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      attachments: [
        {
          fileName: 'local-file.pdf',
          relativePath: 'assets/copied.pdf',
          vaultPath: '/maps/case-map/assets/copied.pdf',
          type: 'pdf',
        },
      ],
    });
  });

  it('saves card fill and border colors from the color studio', async () => {
    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose Royal Velvet for card fill' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose Aurora Mint for border' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Block' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      surfaceColor: '#7C3AED',
      borderColor: '#14B8A6',
    });
  });
});
