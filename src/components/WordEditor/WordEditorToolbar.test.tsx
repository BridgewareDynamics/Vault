import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordEditorToolbar } from './WordEditorToolbar';

describe('WordEditorToolbar', () => {
  const mockOnFontSizeChange = vi.fn();
  const mockOnAlignmentChange = vi.fn();
  const mockOnToggleBold = vi.fn();
  const mockOnToggleItalic = vi.fn();
  const mockOnToggleUnderline = vi.fn();
  const mockOnUndo = vi.fn();
  const mockOnRedo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Font Size', () => {
    it('should render font size selector', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
        />
      );

      expect(screen.getByText('Size:')).toBeInTheDocument();
    });

    it('should display current font size', () => {
      render(
        <WordEditorToolbar
          fontSize={18}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('18');
    });

    it('should call onFontSizeChange when font size changes', async () => {
      const user = userEvent.setup();
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      await user.selectOptions(select, '20');

      expect(mockOnFontSizeChange).toHaveBeenCalledTimes(1);
      expect(mockOnFontSizeChange).toHaveBeenCalledWith(20);
    });

    it('should have all font size options', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      const options = Array.from(select.options).map(opt => Number(opt.value));
      const expectedSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
      
      expect(options).toEqual(expectedSizes);
    });
  });

  describe('Text Alignment', () => {
    it('should render all alignment buttons', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
        />
      );

      expect(screen.getByLabelText('Align left')).toBeInTheDocument();
      expect(screen.getByLabelText('Align center')).toBeInTheDocument();
      expect(screen.getByLabelText('Align right')).toBeInTheDocument();
      expect(screen.getByLabelText('Justify')).toBeInTheDocument();
    });

    it('should highlight active alignment', () => {
      const { rerender } = render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
        />
      );

      let leftButton = screen.getByLabelText('Align left');
      expect(leftButton.className).toContain('bg-cyber-purple-500/20');

      rerender(
        <WordEditorToolbar
          fontSize={14}
          textAlign="center"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
        />
      );

      const centerButton = screen.getByLabelText('Align center');
      expect(centerButton.className).toContain('bg-cyber-purple-500/20');
    });

    it('should call onAlignmentChange when alignment button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
        />
      );

      const centerButton = screen.getByLabelText('Align center');
      await user.click(centerButton);

      expect(mockOnAlignmentChange).toHaveBeenCalledTimes(1);
      expect(mockOnAlignmentChange).toHaveBeenCalledWith('center');
    });

    it('should handle all alignment options', async () => {
      const user = userEvent.setup();
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
        />
      );

      const alignments: Array<{value: 'left' | 'center' | 'right' | 'justify', label: string}> = [
        { value: 'left', label: 'Align left' },
        { value: 'center', label: 'Align center' },
        { value: 'right', label: 'Align right' },
        { value: 'justify', label: 'Justify' },
      ];
      
      for (const alignment of alignments) {
        const button = screen.getByLabelText(alignment.label);
        await user.click(button);
        expect(mockOnAlignmentChange).toHaveBeenCalledWith(alignment.value);
        mockOnAlignmentChange.mockClear();
      }
    });
  });

  describe('Formatting Buttons', () => {
    it('should render bold button when onToggleBold is provided', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onToggleBold={mockOnToggleBold}
        />
      );

      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    });

    it('should not render bold button when onToggleBold is not provided', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
        />
      );

      expect(screen.queryByLabelText('Bold')).not.toBeInTheDocument();
    });

    it('should call onToggleBold when bold button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onToggleBold={mockOnToggleBold}
        />
      );

      const boldButton = screen.getByLabelText('Bold');
      await user.click(boldButton);

      expect(mockOnToggleBold).toHaveBeenCalledTimes(1);
    });

    it('should render italic button when onToggleItalic is provided', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onToggleItalic={mockOnToggleItalic}
        />
      );

      expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    });

    it('should call onToggleItalic when italic button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onToggleItalic={mockOnToggleItalic}
        />
      );

      const italicButton = screen.getByLabelText('Italic');
      await user.click(italicButton);

      expect(mockOnToggleItalic).toHaveBeenCalledTimes(1);
    });

    it('should render underline button when onToggleUnderline is provided', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onToggleUnderline={mockOnToggleUnderline}
        />
      );

      expect(screen.getByLabelText('Underline')).toBeInTheDocument();
    });

    it('should call onToggleUnderline when underline button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onToggleUnderline={mockOnToggleUnderline}
        />
      );

      const underlineButton = screen.getByLabelText('Underline');
      await user.click(underlineButton);

      expect(mockOnToggleUnderline).toHaveBeenCalledTimes(1);
    });

    it('should render all formatting buttons when all handlers are provided', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onToggleBold={mockOnToggleBold}
          onToggleItalic={mockOnToggleItalic}
          onToggleUnderline={mockOnToggleUnderline}
        />
      );

      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
      expect(screen.getByLabelText('Italic')).toBeInTheDocument();
      expect(screen.getByLabelText('Underline')).toBeInTheDocument();
    });
  });

  describe('Undo/Redo', () => {
    it('should render undo button when onUndo is provided', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onUndo={mockOnUndo}
        />
      );

      expect(screen.getByLabelText('Undo')).toBeInTheDocument();
    });

    it('should not render undo button when onUndo is not provided', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
        />
      );

      expect(screen.queryByLabelText('Undo')).not.toBeInTheDocument();
    });

    it('should call onUndo when undo button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onUndo={mockOnUndo}
        />
      );

      const undoButton = screen.getByLabelText('Undo');
      await user.click(undoButton);

      expect(mockOnUndo).toHaveBeenCalledTimes(1);
    });

    it('should render redo button when onRedo is provided', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onRedo={mockOnRedo}
        />
      );

      expect(screen.getByLabelText('Redo')).toBeInTheDocument();
    });

    it('should call onRedo when redo button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onRedo={mockOnRedo}
        />
      );

      const redoButton = screen.getByLabelText('Redo');
      await user.click(redoButton);

      expect(mockOnRedo).toHaveBeenCalledTimes(1);
    });

    it('should render both undo and redo when both handlers are provided', () => {
      render(
        <WordEditorToolbar
          fontSize={14}
          textAlign="left"
          onFontSizeChange={mockOnFontSizeChange}
          onAlignmentChange={mockOnAlignmentChange}
          onUndo={mockOnUndo}
          onRedo={mockOnRedo}
        />
      );

      expect(screen.getByLabelText('Undo')).toBeInTheDocument();
      expect(screen.getByLabelText('Redo')).toBeInTheDocument();
    });
  });
});


