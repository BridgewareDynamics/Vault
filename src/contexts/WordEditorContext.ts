import { createContext, useContext } from 'react';

export interface WordEditorContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  panelWidth: number;
  setPanelWidth: (width: number) => void;
  dividerPosition: number;
  setDividerPosition: (position: number) => void;
  isDividerDragging: boolean;
  setIsDividerDragging: (dragging: boolean) => void;
}

export const WordEditorContext = createContext<WordEditorContextType | undefined>(undefined);

export function useWordEditor() {
  const context = useContext(WordEditorContext);
  if (context === undefined) {
    throw new Error('useWordEditor must be used within a WordEditorProvider');
  }
  return context;
}
