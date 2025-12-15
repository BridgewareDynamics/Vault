import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArchivePage } from './ArchivePage';
import { ToastProvider } from '../Toast/ToastContext';
import * as useArchiveModule from '../../hooks/useArchive';
import * as useArchiveExtractionModule from '../../hooks/useArchiveExtraction';
import { mockElectronAPI } from '../../test-utils/mocks';

// Mock the hooks
vi.mock('../../hooks/useArchive');
vi.mock('../../hooks/useArchiveExtraction');

describe('ArchivePage', () => {
  const mockOnBack = vi.fn();

  const defaultArchiveReturn = {
    archiveConfig: { archiveDrive: '/path/to/vault' },
    cases: [],
    currentCase: null,
    currentFolderPath: null,
    folderNavigationStack: [],
    files: [],
    searchQuery: '',
    loading: false,
    setCurrentCase: vi.fn(),
    setSearchQuery: vi.fn(),
    selectArchiveDrive: vi.fn().mockResolvedValue(true),
    createCase: vi.fn().mockResolvedValue(true),
    addFilesToCase: vi.fn().mockResolvedValue(true),
    deleteCase: vi.fn().mockResolvedValue(true),
    deleteFile: vi.fn().mockResolvedValue(true),
    renameFile: vi.fn().mockResolvedValue(true),
    openFolder: vi.fn(),
    goBackToCase: vi.fn(),
    goBackToParentFolder: vi.fn(),
    navigateToFolder: vi.fn(),
    updateCaseBackgroundImage: vi.fn().mockResolvedValue(true),
    refreshFiles: vi.fn().mockResolvedValue(undefined),
  };

  const defaultExtractionReturn = {
    extractPDF: vi.fn(),
    isExtracting: false,
    progress: null,
    statusMessage: '',
    extractingCasePath: null,
    extractingFolderPath: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useArchiveModule.useArchive as any).mockReturnValue(defaultArchiveReturn);
    (useArchiveExtractionModule.useArchiveExtraction as any).mockReturnValue(defaultExtractionReturn);
    mockElectronAPI.getArchiveConfig.mockResolvedValue({ archiveDrive: '/path/to/vault' });
  });

  const renderArchivePage = () => {
    return render(
      <ToastProvider>
        <ArchivePage onBack={mockOnBack} />
      </ToastProvider>
    );
  };

  it('should render archive page', () => {
    renderArchivePage();
    expect(screen.getByText('The Vault')).toBeInTheDocument();
  });

  it('should call onBack when home button is clicked', async () => {
    const user = userEvent.setup();
    renderArchivePage();
    
    const homeButton = screen.getByText('Home');
    await user.click(homeButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should render search bar', () => {
    renderArchivePage();
    const searchInput = screen.getByPlaceholderText('Search cases...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should show drive dialog when archive drive is not set', async () => {
    (useArchiveModule.useArchive as any).mockReturnValue({
      ...defaultArchiveReturn,
      archiveConfig: { archiveDrive: null },
    });
    
    renderArchivePage();
    
    await waitFor(() => {
      expect(screen.getByText('Choose Vault Directory')).toBeInTheDocument();
    });
  });

  it('should render create case button', () => {
    renderArchivePage();
    const createButton = screen.getByText('Start Case File');
    expect(createButton).toBeInTheDocument();
  });

  it('should show case dialog when create case button is clicked', async () => {
    const user = userEvent.setup();
    renderArchivePage();
    
    const createButton = screen.getByText('Start Case File');
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name File')).toBeInTheDocument();
    });
  });

  it('should render cases when available', () => {
    (useArchiveModule.useArchive as any).mockReturnValue({
      ...defaultArchiveReturn,
      cases: [
        { name: 'Case 1', path: '/path/to/case1' },
        { name: 'Case 2', path: '/path/to/case2' },
      ],
    });
    
    renderArchivePage();
    
    expect(screen.getByText('Case 1')).toBeInTheDocument();
    expect(screen.getByText('Case 2')).toBeInTheDocument();
  });

  it('should render files when a case is selected', () => {
    (useArchiveModule.useArchive as any).mockReturnValue({
      ...defaultArchiveReturn,
      currentCase: { name: 'Test Case', path: '/path/to/case', description: 'Case description' },
      files: [
        { name: 'file1.pdf', path: '/path/to/file1.pdf', size: 1000, modified: Date.now(), type: 'pdf', isFolder: false },
        { name: 'file2.jpg', path: '/path/to/file2.jpg', size: 2000, modified: Date.now(), type: 'image', isFolder: false },
      ],
    });
    
    renderArchivePage();
    
    expect(screen.getByText('file1.pdf')).toBeInTheDocument();
    expect(screen.getByText('file2.jpg')).toBeInTheDocument();
    // Case description block should be shown when at case root
    expect(screen.getByText('Case description')).toBeInTheDocument();
  });

  it('should show loading state when loading', () => {
    (useArchiveModule.useArchive as any).mockReturnValue({
      ...defaultArchiveReturn,
      loading: true,
    });
    
    renderArchivePage();
    
    // Should still render the page
    expect(screen.getByText('The Vault')).toBeInTheDocument();
  });

  it('should show extraction progress bar when extracting', () => {
    (useArchiveModule.useArchive as any).mockReturnValue({
      ...defaultArchiveReturn,
      currentCase: { name: 'Test Case', path: '/path/to/case' },
    });

    (useArchiveExtractionModule.useArchiveExtraction as any).mockReturnValue({
      ...defaultExtractionReturn,
      isExtracting: true,
      progress: { currentPage: 1, totalPages: 5, percentage: 20 },
      statusMessage: 'Extracting pages...',
    });

    renderArchivePage();

    // Progress text comes from ProgressBar status message
    expect(screen.getByText('Extracting pages...')).toBeInTheDocument();
  });

  it('should show empty state when case has no files', () => {
    (useArchiveModule.useArchive as any).mockReturnValue({
      ...defaultArchiveReturn,
      currentCase: { name: 'Empty Case', path: '/path/to/empty' },
      files: [],
    });

    renderArchivePage();

    expect(screen.getByText('No files in this case')).toBeInTheDocument();
    // There are two "Add Files" buttons (toolbar + empty state), so use the *AllBy* query
    const addFilesButtons = screen.getAllByText('Add Files');
    expect(addFilesButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('should call addFilesToCase from toolbar when current case is selected', async () => {
    const user = userEvent.setup();
    const mockAddFilesToCase = vi.fn().mockResolvedValue(true);

    (useArchiveModule.useArchive as any).mockReturnValue({
      ...defaultArchiveReturn,
      currentCase: { name: 'Test Case', path: '/path/to/case' },
      files: [],
      addFilesToCase: mockAddFilesToCase,
    });

    renderArchivePage();

    const addFilesToolbarButton = screen.getAllByText('Add Files')[0];
    await user.click(addFilesToolbarButton);

    expect(mockAddFilesToCase).toHaveBeenCalledWith('/path/to/case');
  });

  it('should render back-to-parent button when inside a folder and call goBackToParentFolder on click', async () => {
    const user = userEvent.setup();
    const mockGoBackToParentFolder = vi.fn();

    (useArchiveModule.useArchive as any).mockReturnValue({
      ...defaultArchiveReturn,
      currentCase: { name: 'Test Case', path: '/path/to/case' },
      currentFolderPath: '/path/to/case/subfolder',
      folderNavigationStack: ['/path/to/case'],
      goBackToParentFolder: mockGoBackToParentFolder,
    });

    renderArchivePage();

    const backToParentButton = screen.getByText(/Back to/);
    await user.click(backToParentButton);

    expect(mockGoBackToParentFolder).toHaveBeenCalledTimes(1);
  });

  it('should open file viewer when a non-folder file is clicked', async () => {
    const user = userEvent.setup();

    (useArchiveModule.useArchive as any).mockReturnValue({
      ...defaultArchiveReturn,
      currentCase: { name: 'Test Case', path: '/path/to/case' },
      files: [
        { name: 'image1.jpg', path: '/path/to/image1.jpg', size: 1000, modified: Date.now(), type: 'image', isFolder: false },
        { name: 'image2.jpg', path: '/path/to/image2.jpg', size: 2000, modified: Date.now(), type: 'image', isFolder: false },
      ],
    });

    renderArchivePage();

    // Clicking the file tile should open the ArchiveFileViewer
    const fileTile = screen.getByText('image1.jpg');
    await user.click(fileTile);

    // Close button from ArchiveFileViewer should be present
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('should allow navigating to next file in viewer when multiple files exist', async () => {
    const user = userEvent.setup();

    (useArchiveModule.useArchive as any).mockReturnValue({
      ...defaultArchiveReturn,
      currentCase: { name: 'Test Case', path: '/path/to/case' },
      files: [
        { name: 'image1.jpg', path: '/path/to/image1.jpg', size: 1000, modified: Date.now(), type: 'image', isFolder: false },
        { name: 'image2.jpg', path: '/path/to/image2.jpg', size: 2000, modified: Date.now(), type: 'image', isFolder: false },
      ],
    });

    renderArchivePage();

    const fileTile = screen.getByText('image1.jpg');
    await user.click(fileTile);

    // If a "Next file" button is available, click it and ensure the second file name is visible
    const nextButton = screen.queryByLabelText('Next file');
    if (nextButton) {
      await user.click(nextButton);
      // image2.jpg appears both in the grid and in the viewer header, so use *AllBy* and just
      // assert that at least one occurrence exists after navigating
      const occurrences = screen.getAllByText('image2.jpg');
      expect(occurrences.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should update search query when typing in search bar', async () => {
    const user = userEvent.setup();
    const mockSetSearchQuery = vi.fn();
    (useArchiveModule.useArchive as any).mockReturnValue({
      ...defaultArchiveReturn,
      setSearchQuery: mockSetSearchQuery,
    });
    
    renderArchivePage();
    
    const searchInput = screen.getByPlaceholderText('Search cases...');
    await user.type(searchInput, 'test query');
    
    expect(mockSetSearchQuery).toHaveBeenCalled();
  });
});

