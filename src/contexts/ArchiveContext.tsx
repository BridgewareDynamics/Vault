import { createContext, useContext, ReactNode, useState, useCallback, useRef } from 'react';
import { ArchiveCase } from '../types';

interface ArchiveContextValue {
  currentCase: ArchiveCase | null;
  setCurrentCase: (caseItem: ArchiveCase | null) => void;
}

const ArchiveContext = createContext<ArchiveContextValue | undefined>(undefined);

interface ArchiveContextProviderProps {
  children: ReactNode;
}

export function ArchiveContextProvider({ children }: ArchiveContextProviderProps) {
  const [currentCase, setCurrentCase] = useState<ArchiveCase | null>(null);
  // Keep a ref to track the last known case for debugging/reference
  // This helps identify if case is being cleared unintentionally
  const lastCaseRef = useRef<ArchiveCase | null>(null);

  // Wrapped setCurrentCase that tracks state changes
  const setCurrentCaseWithTracking = useCallback((caseItem: ArchiveCase | null) => {
    // #region agent log
    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({ location: 'ArchiveContext.tsx:22', message: 'ArchiveContext setCurrentCase called', data: { caseItemIsNull: caseItem === null, caseItemPath: caseItem?.path, caseItemName: caseItem?.name, previousCasePath: lastCaseRef.current?.path }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }).catch(() => { });
    // #endregion
    // Always update the state - don't prevent legitimate clears
    // But track the last case for debugging purposes
    if (caseItem !== null) {
      lastCaseRef.current = caseItem;
    }
    setCurrentCase(caseItem);
  }, []);

  return (
    <ArchiveContext.Provider value={{ currentCase, setCurrentCase: setCurrentCaseWithTracking }}>
      {children}
    </ArchiveContext.Provider>
  );
}

export function useArchiveContext(): ArchiveContextValue {
  const context = useContext(ArchiveContext);
  if (context === undefined) {
    // Return default values instead of throwing - allows components to work outside ArchivePage
    return { currentCase: null, setCurrentCase: () => {} };
  }
  return context;
}
