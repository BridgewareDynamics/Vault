import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WordEditorContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  panelWidth: number;
  setPanelWidth: (width: number) => void;
}

const WordEditorContext = createContext<WordEditorContextType | undefined>(undefined);

const STORAGE_KEY = 'word-editor-panel-width';
const DEFAULT_WIDTH = 500;
const MIN_WIDTH = 400;
const MAX_WIDTH = 80; // percentage of viewport width

export function WordEditorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelWidth, setPanelWidthState] = useState<number>(DEFAULT_WIDTH);

  // Load width from localStorage on mount
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

  return (
    <WordEditorContext.Provider value={{ isOpen, setIsOpen, panelWidth, setPanelWidth }}>
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










