import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseSelectionDialog } from './CaseSelectionDialog';
import { mockElectronAPI } from '../../test-utils/mocks';
import { SettingsProvider } from '../../utils/settingsContext';
import { ToastProvider } from '../Toast/ToastContext';

vi.mock('../../hooks/useCategoryTags', () => ({
  useCategoryTags: () => ({
    getTagById: vi.fn(),
    tags: [],
    createTag: vi.fn(),
    deleteTag: vi.fn(),
  }),
}));

function renderDialog(props: Partial<React.ComponentProps<typeof CaseSelectionDialog>> = {}) {
  const onSelectCase = vi.fn();
  const onClose = vi.fn();

  render(
    <SettingsProvider>
      <ToastProvider>
        <CaseSelectionDialog
          isOpen
          onClose={onClose}
          onSelectCase={onSelectCase}
          confirmLabel="Assign case"
          {...props}
        />
      </ToastProvider>
    </SettingsProvider>
  );

  return { onSelectCase, onClose };
}

describe('CaseSelectionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = mockElectronAPI;
    mockElectronAPI.listArchiveCases.mockResolvedValue([
      { name: 'Alpha Case', path: '/vault/Alpha Case', description: 'First matter' },
      { name: 'Beta Case', path: '/vault/Beta Case', description: 'Second matter' },
    ]);
  });

  it('filters cases by search query', async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => {
      expect(screen.getByText('Alpha Case')).toBeInTheDocument();
      expect(screen.getByText('Beta Case')).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText('Search cases'),
      'alpha'
    );

    expect(screen.getByText('Alpha Case')).toBeInTheDocument();
    expect(screen.queryByText('Beta Case')).not.toBeInTheDocument();
  });

  it('assigns the selected case after confirmation', async () => {
    const user = userEvent.setup();
    const { onSelectCase, onClose } = renderDialog();

    await waitFor(() => {
      expect(screen.getByText('Alpha Case')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Select case Alpha Case' }));
    await user.click(screen.getByRole('button', { name: 'Assign case' }));

    expect(onSelectCase).toHaveBeenCalledWith('/vault/Alpha Case');
    expect(onClose).toHaveBeenCalled();
  });

  it('opens create case flow from footer action', async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => {
      expect(screen.getByText('Alpha Case')).toBeInTheDocument();
    });

    const createButtons = screen.getAllByRole('button', { name: 'Create new case' });
    await user.click(createButtons[0]);

    expect(screen.getByRole('heading', { name: 'Create New Case' })).toBeInTheDocument();
  });
});
