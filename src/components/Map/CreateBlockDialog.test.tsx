import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateBlockDialog } from './CreateBlockDialog';
import { mockElectronAPI } from '../../test-utils/mocks';

const mockLexicalEditorHandle = {
  getContent: vi.fn(() => '<p>Notes</p>'),
};

vi.mock('../WordEditor/LexicalEditor', () => ({
  LexicalEditor: React.forwardRef((_props: Record<string, unknown>, ref: React.ForwardedRef<unknown>) => {
    React.useImperativeHandle(ref, () => mockLexicalEditorHandle, []);
    return <div data-testid="mock-lexical-editor" />;
  }),
}));

describe('CreateBlockDialog', () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    onSubmit.mockReset();
    mockLexicalEditorHandle.getContent.mockReturnValue('<p>Notes</p>');
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

  it('attaches Vault PDFs as linked files from the case library', async () => {
    const user = userEvent.setup();
    mockElectronAPI.getFileThumbnail.mockResolvedValue('data:image/png;base64,preview');

    mockElectronAPI.listArchiveCases.mockResolvedValue([
      {
        name: 'Acme Case',
        path: '/vault/Acme Case',
        description: 'Primary investigation',
      },
    ]);

    mockElectronAPI.listCaseFiles.mockImplementation(async (folderPath: string) => {
      if (folderPath === '/vault/Acme Case') {
        return [
          {
            name: 'Evidence',
            path: '/vault/Acme Case/Evidence',
            size: 0,
            modified: 1,
            isFolder: true,
          },
        ];
      }

      if (folderPath === '/vault/Acme Case/Evidence') {
        return [
          {
            name: 'report.pdf',
            path: '/vault/Acme Case/Evidence/report.pdf',
            size: 2048,
            modified: 2,
          },
        ];
      }

      return [];
    });

    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Files' }));
    await user.click(screen.getByRole('button', { name: /Browse Vault case library/i }));
    await user.click(await screen.findByRole('button', { name: /Acme Case/i }));
    await user.click(await screen.findByRole('button', { name: /Evidence/i }));
    expect(
      await screen.findByText('Drag this preview into the block attachments area or press Attach.')
    ).toBeInTheDocument();
    const attachButtons = await screen.findAllByRole('button', { name: /Attach report\.pdf/i });
    await user.click(attachButtons[0]);

    expect(screen.getByText('Vault link will be added on save')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create Block' }));

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

  it('still copies locally picked files into map assets on save', async () => {
    const user = userEvent.setup();

    mockElectronAPI.selectMapAttachments.mockResolvedValue(['C:/Users/test/Documents/local-file.pdf']);
    mockElectronAPI.copyMapAttachmentToAssets.mockResolvedValue({
      relativePath: 'assets/copied.pdf',
      vaultPath: '/maps/case-map/assets/copied.pdf',
      fileName: 'local-file.pdf',
      type: 'pdf',
    });

    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Files' }));
    await user.click(screen.getByRole('button', { name: /Add local files/i }));

    expect(screen.getByText('Will be copied into block on save')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create Block' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(mockElectronAPI.copyMapAttachmentToAssets).toHaveBeenCalledTimes(1);
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

  it('saves independent card fill and border colors from the color studio', async () => {
    const user = userEvent.setup();

    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Details' }));
    await user.click(screen.getByRole('button', { name: 'Choose Royal Velvet for card fill' }));
    await user.click(screen.getByRole('button', { name: 'Edit Border' }));
    await user.click(screen.getByRole('button', { name: 'Choose Aurora Mint for border' }));
    await user.click(screen.getByRole('button', { name: 'Create Block' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      surfaceColor: '#7C3AED',
      borderColor: '#14B8A6',
    });
  });
});
