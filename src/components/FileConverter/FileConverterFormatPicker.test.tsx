import { describe, it, expect, vi, beforeEach } from 'vitest';
import type React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileConverterFormatPicker } from './FileConverterFormatPicker';
import { SettingsProvider } from '../../utils/settingsContext';
import { mockElectronAPI } from '../../test-utils/mocks';
import type { FileConverterSource } from '../../types';

function renderPicker(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

describe('FileConverterFormatPicker', () => {
  const source: FileConverterSource = {
    origin: 'external',
    sourcePath: 'C:/evidence/photo.png',
    fileName: 'photo.png',
    category: 'image',
    casePath: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = mockElectronAPI;
    mockElectronAPI.getSettings.mockResolvedValue({ theme: 'brideware-purple' });
  });

  it('opens styled format dropdown and selects an option', () => {
    const onChange = vi.fn();
    renderPicker(
      <FileConverterFormatPicker
        theme="brideware-purple"
        source={source}
        target={{ format: 'png', quality: 85, dpi: 150 }}
        availableFormats={['png', 'jpeg', 'webp']}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Choose output format' }));
    fireEvent.click(screen.getByRole('option', { name: /JPEG/i }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'jpeg' })
    );
  });
});
