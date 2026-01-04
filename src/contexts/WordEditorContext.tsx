import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WordEditorContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  panelWidth: number;
  setPanelWidth: (width: number) => void;
  dividerPosition: number;
  setDividerPosition: (position: number) => void;
  isDividerDragging: boolean;
  setIsDividerDragging: (dragging: boolean) => void;
}

const WordEditorContext = createContext<WordEditorContextType | undefined>(undefined);

const STORAGE_KEY = 'word-editor-panel-width';
const DIVIDER_STORAGE_KEY = 'word-editor-divider-position';
const DEFAULT_WIDTH = 500;
const MIN_WIDTH = 400;
const MAX_WIDTH = 80; // percentage of viewport width
const DEFAULT_DIVIDER_POSITION = 50; // 50% (equal split)
const MIN_DIVIDER_POSITION = 20; // 20% minimum for Archive
const MAX_DIVIDER_POSITION = 80; // 80% maximum (leaves 20% for Editor)

export function WordEditorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelWidth, setPanelWidthState] = useState<number>(DEFAULT_WIDTH);
  const [dividerPosition, setDividerPositionState] = useState<number>(DEFAULT_DIVIDER_POSITION);
  const [isDividerDragging, setIsDividerDragging] = useState(false);

  // Load width and divider position from localStorage on mount
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem(STORAGE_KEY);
      if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        // Validate width is within bounds
        if (!isNaN(width) && width >= MIN_WIDTH) {
          // Check max width based on viewport
          const maxWidthPx = (window.innerWidth * MAX_WIDTH) / 100;
          setPanelWidthState(Math.min(width, maxWidthPx));
        }
      }
    } catch (error) {
      console.warn('Failed to load word editor panel width from localStorage:', error);
    }

    try {
      const savedPosition = localStorage.getItem(DIVIDER_STORAGE_KEY);
      if (savedPosition) {
        const position = parseFloat(savedPosition);
        // Validate position is within bounds
        if (!isNaN(position) && position >= MIN_DIVIDER_POSITION && position <= MAX_DIVIDER_POSITION) {
          setDividerPositionState(position);
        }
      }
    } catch (error) {
      console.warn('Failed to load divider position from localStorage:', error);
    }
  }, []);

  // Save width to localStorage when it changes
  const setPanelWidth = (width: number) => {
    // Enforce min/max constraints
    const maxWidthPx = (window.innerWidth * MAX_WIDTH) / 100;
    const constrainedWidth = Math.max(MIN_WIDTH, Math.min(width, maxWidthPx));
    setPanelWidthState(constrainedWidth);

    try {
      localStorage.setItem(STORAGE_KEY, constrainedWidth.toString());
    } catch (error) {
      console.warn('Failed to save word editor panel width to localStorage:', error);
    }
  };

  // Save divider position to localStorage when it changes
  const setDividerPosition = (position: number) => {
    // Enforce min/max constraints
    const constrainedPosition = Math.max(MIN_DIVIDER_POSITION, Math.min(position, MAX_DIVIDER_POSITION));
    setDividerPositionState(constrainedPosition);

    try {
      localStorage.setItem(DIVIDER_STORAGE_KEY, constrainedPosition.toString());
    } catch (error) {
      console.warn('Failed to save divider position to localStorage:', error);
    }
  };

  return (
    <WordEditorContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      panelWidth, 
      setPanelWidth,
      dividerPosition,
      setDividerPosition,
      isDividerDragging,
      setIsDividerDragging
    }}>
      {children}
    </WordEditorContext.Provider>
  );
}

export function useWordEditor() {
  const context = useContext(WordEditorContext);
  if (context === undefined) {
    throw new Error('useWordEditor must be used within a WordEditorProvider');
  }
  return context;
}










