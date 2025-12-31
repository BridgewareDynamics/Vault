import { createContext, useContext, useState, ReactNode } from 'react';

interface WordEditorContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const WordEditorContext = createContext<WordEditorContextType | undefined>(undefined);

export function WordEditorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <WordEditorContext.Provider value={{ isOpen, setIsOpen }}>
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










