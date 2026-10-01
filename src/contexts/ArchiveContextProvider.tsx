import { ReactNode, useState, useCallback, useRef, useMemo } from 'react';
import { ArchiveCase } from '../types';
import { ArchiveContext } from './ArchiveContext';

interface ArchiveContextProviderProps {
  children: ReactNode;
}

export function ArchiveContextProvider({ children }: ArchiveContextProviderProps) {
  const [currentCase, setCurrentCase] = useState<ArchiveCase | null>(null);
  // Keep a ref to track the last known case for debugging/reference
  // This helps identify if case is being cleared unintentionally
  const lastCaseRef = useRef<ArchiveCase | null>(null);

  // Wrapped setCurrentCase that tracks state changes
  const setCurrentCaseWithTracking = useCallback((caseItem: ArchiveCase | null) => {// Always update the state - don't prevent legitimate clears
    // But track the last case for debugging purposes
    if (caseItem !== null) {
      lastCaseRef.current = caseItem;
    }
    setCurrentCase(caseItem);
  }, []);

  const value = useMemo(
    () => ({ currentCase, setCurrentCase: setCurrentCaseWithTracking }),
    [currentCase, setCurrentCaseWithTracking],
  );

  return (
    <ArchiveContext.Provider value={value}>
      {children}
    </ArchiveContext.Provider>
  );
}
