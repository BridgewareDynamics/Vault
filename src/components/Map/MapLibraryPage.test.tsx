import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapLibraryPage } from './MapLibraryPage';
import { mockElectronAPI } from '../../test-utils/mocks';
import { setCachedMapLibrary } from '../../utils/mapPrefetch';

vi.mock('../Toast/ToastContext', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

const sampleMaps = [
  {
    id: 'map-1',
    title: 'Vault Overview',
    mapFolderPath: '/maps/vault-overview',
    casePath: null,
    modified: new Date('2026-05-18T12:00:00.000Z').getTime(),
    blockCount: 5,
  },
  {
    id: 'map-2',
    title: 'Acme Timeline',
    mapFolderPath: '/maps/acme-timeline',
    casePath: '/cases/acme',
    caseName: 'Acme Investigation',
    modified: new Date('2026-05-20T18:30:00.000Z').getTime(),
    blockCount: 8,
  },
  {
    id: 'map-3',
    title: 'Incident Chain',
    mapFolderPath: '/maps/incident-chain',
    casePath: null,
    modified: new Date('2026-05-23T09:15:00.000Z').getTime(),
    blockCount: 12,
  },
];

describe('MapLibraryPage', () => {
  const onBack = vi.fn();
  const onOpenMap = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setCachedMapLibrary(null);
    mockElectronAPI.listMaps.mockResolvedValue(sampleMaps);
  });

  it('filters maps by search query and storage type', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<MapLibraryPage theme="pastel" onBack={onBack} onOpenMap={onOpenMap} />);
      await Promise.resolve();
    });

    expect(await screen.findByText('Acme Timeline')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search maps'), 'acme');

    expect(screen.getByText('Acme Timeline')).toBeInTheDocument();
    expect(screen.queryByText('Vault Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Incident Chain')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search maps'));
    await user.click(screen.getByRole('button', { name: /vault \(2\)/i }));

    await waitFor(() => {
      expect(screen.getByText('Vault Overview')).toBeInTheDocument();
      expect(screen.getByText('Incident Chain')).toBeInTheDocument();
      expect(screen.queryByText('Acme Timeline')).not.toBeInTheDocument();
    });
  });

  it('opens the most recently updated map from the featured card', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<MapLibraryPage theme="brideware-purple" onBack={onBack} onOpenMap={onOpenMap} />);
      await Promise.resolve();
    });

    expect(await screen.findByText('Incident Chain')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open recent map/i }));

    expect(onOpenMap).toHaveBeenCalledWith('/maps/incident-chain');
  });

  it('shows a single vault map inside the collection view', async () => {
    const user = userEvent.setup();

    mockElectronAPI.listMaps.mockResolvedValue([
      {
        id: 'map-vault',
        title: 'Solo Vault Map',
        mapFolderPath: '/maps/solo-vault',
        casePath: null,
        modified: new Date('2026-05-24T09:00:00.000Z').getTime(),
        blockCount: 4,
      },
      {
        id: 'map-case',
        title: 'Case Only Map',
        mapFolderPath: '/maps/case-only',
        casePath: '/cases/example',
        caseName: 'Example Case',
        modified: new Date('2026-05-21T09:00:00.000Z').getTime(),
        blockCount: 6,
      },
    ]);

    await act(async () => {
      render(<MapLibraryPage theme="pastel" onBack={onBack} onOpenMap={onOpenMap} />);
      await Promise.resolve();
    });

    expect(await screen.findByText('Solo Vault Map')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /vault \(1\)/i }));

    await waitFor(() => {
      expect(screen.getByText('Solo Vault Map')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /open recent map/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete map solo vault map/i })).toBeInTheDocument();
    });
  });

  it('uses the styled delete dialog instead of browser confirm', async () => {
    const user = userEvent.setup();

    mockElectronAPI.deleteMap.mockResolvedValue(undefined);

    await act(async () => {
      render(<MapLibraryPage theme="brideware-purple" onBack={onBack} onOpenMap={onOpenMap} />);
      await Promise.resolve();
    });

    await user.click(await screen.findByRole('button', { name: /delete map incident chain/i }));

    expect(screen.getByRole('heading', { name: 'Delete Map' })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    expect(screen.getByText(/"Incident Chain"/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Map' }));

    await waitFor(() => {
      expect(mockElectronAPI.deleteMap).toHaveBeenCalledWith('/maps/incident-chain');
    });
  });
});
