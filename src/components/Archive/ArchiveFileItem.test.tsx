import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { ArchiveFileItem } from './ArchiveFileItem';
import { ArchiveFile } from '../../types';
import { SettingsProvider } from '../../utils/settingsContext';
import { mockElectronAPI } from '../../test-utils/mocks';

describe('ArchiveFileItem', () => {
  const mockOnClick = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnExtract = vi.fn();
  const mockOnRename = vi.fn();
  const mockOnTranscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = mockElectronAPI;
    mockElectronAPI.getSettings.mockResolvedValue({
      hardwareAcceleration: true,
      ramLimitMB: 2048,
      fullscreen: false,
      extractionQuality: 'high',
      thumbnailSize: 200,
      performanceMode: 'auto',
      showOnboarding: true,
      theme: 'brideware-purple',
    });
  });

  const renderArchiveFileItem = (props: ComponentProps<typeof ArchiveFileItem>) =>
    render(
      <SettingsProvider>
        <ArchiveFileItem {...props} />
      </SettingsProvider>
    );

  const createMockFile = (overrides?: Partial<ArchiveFile>): ArchiveFile => ({
    name: 'test.pdf',
    path: '/path/to/test.pdf',
    size: 1000,
    modified: Date.now(),
    type: 'pdf',
    isFolder: false,
    ...overrides,
  });

  it('should render file name', () => {
    const file = createMockFile();
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
    });
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  it('should render file type badge', () => {
    const file = createMockFile({ type: 'pdf' });
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
    });
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('should render thumbnail when provided', () => {
    const file = createMockFile({ thumbnail: 'data:image/png;base64,test' });
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
    });
    const img = screen.getByAltText('test.pdf');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,test');
  });

  it('should render icon when thumbnail is not provided', () => {
    const file = createMockFile({ thumbnail: undefined });
    const { container } = renderArchiveFileItem({
      file,
      onClick: mockOnClick,
    });
    // Should have an icon (svg)
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const file = createMockFile();
    const { container } = renderArchiveFileItem({
      file,
      onClick: mockOnClick,
    });
    
    const fileElement = container.querySelector('.border-gray-700');
    if (fileElement) {
      await user.click(fileElement);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should render different icons for different file types', () => {
    const imageFile = createMockFile({ type: 'image', name: 'test.jpg' });
    const { rerender, container } = renderArchiveFileItem({
      file: imageFile,
      onClick: mockOnClick,
    });
    
    // Check for image icon
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    
    const videoFile = createMockFile({ type: 'video', name: 'test.mp4' });
    rerender(
      <SettingsProvider>
        <ArchiveFileItem
          file={videoFile}
          onClick={mockOnClick}
        />
      </SettingsProvider>
    );
    
    const otherFile = createMockFile({ type: 'other', name: 'test.txt' });
    rerender(
      <SettingsProvider>
        <ArchiveFileItem
          file={otherFile}
          onClick={mockOnClick}
        />
      </SettingsProvider>
    );
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const file = createMockFile();
    const { container } = renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onDelete: mockOnDelete,
    });
    
    // Hover to show delete button
    const fileElement = container.querySelector('.group');
    if (fileElement) {
      await user.hover(fileElement);
      
      await waitFor(() => {
        const deleteButton = screen.getByLabelText('Delete file');
        expect(deleteButton).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText('Delete file');
      await user.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    }
  });

  it('should call onRename when rename button is clicked', async () => {
    const user = userEvent.setup();
    const file = createMockFile();
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onRename: mockOnRename,
    });
    
    const renameButton = screen.getByLabelText('Rename file');
    await user.click(renameButton);
    
    expect(mockOnRename).toHaveBeenCalledTimes(1);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should show extract button for PDF files when onExtract is provided', async () => {
    const user = userEvent.setup();
    const file = createMockFile({ type: 'pdf' });
    const { container } = renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onExtract: mockOnExtract,
    });
    
    // Hover to show extract button
    const fileElement = container.querySelector('.group');
    if (fileElement) {
      await user.hover(fileElement);
      
      await waitFor(() => {
        const extractButton = screen.getByLabelText('Extract PDF');
        expect(extractButton).toBeInTheDocument();
      });
    }
  });

  it('should call onExtract when extract button is clicked', async () => {
    const user = userEvent.setup();
    const file = createMockFile({ type: 'pdf' });
    const { container } = renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onExtract: mockOnExtract,
    });
    
    // Hover to show extract button
    const fileElement = container.querySelector('.group');
    if (fileElement) {
      await user.hover(fileElement);
      
      await waitFor(() => {
        const extractButton = screen.getByLabelText('Extract PDF');
        expect(extractButton).toBeInTheDocument();
      });
      
      const extractButton = screen.getByLabelText('Extract PDF');
      await user.click(extractButton);
      expect(mockOnExtract).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    }
  });

  it('should call onTranscribe for video files', async () => {
    const user = userEvent.setup();
    const file = createMockFile({ type: 'video', name: 'interview.mp4' });
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onTranscribe: mockOnTranscribe,
    });

    const transcribeButton = screen.getAllByLabelText('Transcribe media')[0];
    await user.click(transcribeButton);

    expect(mockOnTranscribe).toHaveBeenCalledTimes(1);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should show PDF options dropdown when PDF options button is clicked', async () => {
    const user = userEvent.setup();
    const file = createMockFile({ type: 'pdf' });
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onExtract: mockOnExtract,
    });
    
    const optionsButton = screen.getByLabelText('PDF options');
    await user.click(optionsButton);
    
    // Dropdown should appear
    await waitFor(() => {
      expect(screen.getByText('Convert to Images')).toBeInTheDocument();
    });
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    const file = createMockFile({ type: 'pdf' });
    render(
      <SettingsProvider>
        <div>
          <ArchiveFileItem
            file={file}
            onClick={mockOnClick}
            onExtract={mockOnExtract}
          />
          <div data-testid="outside">Outside</div>
        </div>
      </SettingsProvider>
    );
    
    // Open dropdown
    const optionsButton = screen.getByLabelText('PDF options');
    await user.click(optionsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Convert to Images')).toBeInTheDocument();
    });
    
    // Click outside
    const outside = screen.getByTestId('outside');
    await user.click(outside);
    
    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByText('Convert to Images')).not.toBeInTheDocument();
    });
  });

  it('should not show extract button for non-PDF files', () => {
    const file = createMockFile({ type: 'image' });
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onExtract: mockOnExtract,
    });
    
    expect(screen.queryByLabelText('Extract PDF')).not.toBeInTheDocument();
  });

  it('should not show PDF options button for non-PDF files', () => {
    const file = createMockFile({ type: 'image' });
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onExtract: mockOnExtract,
    });
    
    expect(screen.queryByLabelText('PDF options')).not.toBeInTheDocument();
  });

  it('should not render delete button when onDelete is not provided', () => {
    const file = createMockFile();
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
    });
    
    expect(screen.queryByLabelText('Delete file')).not.toBeInTheDocument();
  });

  it('should not render rename button when onRename is not provided', () => {
    const file = createMockFile();
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
    });
    
    expect(screen.queryByLabelText('Rename file')).not.toBeInTheDocument();
  });

  it('should show PDF options dropdown when only onRunAudit is provided', async () => {
    const user = userEvent.setup();
    const mockOnRunAudit = vi.fn();
    const file = createMockFile({ type: 'pdf' });
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onRunAudit: mockOnRunAudit,
    });
    
    const optionsButton = screen.getByLabelText('PDF options');
    await user.click(optionsButton);
    
    await waitFor(() => {
      expect(screen.getByText('PDF Audit')).toBeInTheDocument();
    });
    expect(screen.queryByText('Start Page Extraction')).not.toBeInTheDocument();
  });

  it('should call onRunAudit when PDF Audit is clicked from dropdown', async () => {
    const user = userEvent.setup();
    const mockOnRunAudit = vi.fn();
    const file = createMockFile({ type: 'pdf' });
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onExtract: mockOnExtract,
      onRunAudit: mockOnRunAudit,
    });
    
    const optionsButton = screen.getByLabelText('PDF options');
    await user.click(optionsButton);
    
    await waitFor(() => {
      expect(screen.getByText('PDF Audit')).toBeInTheDocument();
    });
    
    const auditButton = screen.getByText('PDF Audit');
    await user.click(auditButton);
    
    expect(mockOnRunAudit).toHaveBeenCalledTimes(1);
    expect(mockOnExtract).not.toHaveBeenCalled();
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should show both PDF Audit and Start Page Extraction in dropdown when both callbacks are provided', async () => {
    const user = userEvent.setup();
    const mockOnRunAudit = vi.fn();
    const file = createMockFile({ type: 'pdf' });
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onExtract: mockOnExtract,
      onRunAudit: mockOnRunAudit,
    });
    
    const optionsButton = screen.getByLabelText('PDF options');
    await user.click(optionsButton);
    
    await waitFor(() => {
      expect(screen.getByText('PDF Audit')).toBeInTheDocument();
      expect(screen.getByText('Convert to Images')).toBeInTheDocument();
    });
  });

  it('requests thumbnail when item becomes visible', async () => {
    const onRequestThumbnail = vi.fn();
    const observers: Array<{ callback: IntersectionObserverCallback; target: Element | null }> = [];

    class MockIntersectionObserver {
      callback: IntersectionObserverCallback;
      target: Element | null = null;

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        observers.push({ callback, target: null });
      }

      observe(element: Element) {
        this.target = element;
        const entry = observers[observers.length - 1];
        entry.target = element;
      }

      disconnect() {
        // no-op
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const file = createMockFile();
    renderArchiveFileItem({
      file,
      onClick: mockOnClick,
      onRequestThumbnail,
    });

    expect(observers).toHaveLength(1);
    const [{ callback, target }] = observers;
    expect(target).toBeTruthy();

    callback(
      [{ isIntersecting: true, target: target as Element } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(onRequestThumbnail).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});













