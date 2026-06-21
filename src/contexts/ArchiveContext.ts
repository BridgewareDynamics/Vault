import { createContext, useContext } from 'react';
import { ArchiveCase } from '../types';

export interface ArchiveContextValue {
  currentCase: ArchiveCase | null;
  setCurrentCase: (caseItem: ArchiveCase | null) => void;
}

export const ArchiveContext = createContext<ArchiveContextValue | undefined>(undefined);

export function useArchiveContext(): ArchiveContextValue {
  const context = useContext(ArchiveContext);
  if (context === undefined) {
    // Return default values instead of throwing - allows components to work outside ArchivePage
    return { currentCase: null, setCurrentCase: () => {} };
  }
  return context;
}
