import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  VaultActiveCase,
  VaultActiveCaseContext,
  VaultActiveCaseContextValue,
} from './VaultActiveCaseContext';

interface CaseScopeEntry {
  id: number;
  caseInfo: VaultActiveCase;
}

let scopeCounter = 0;

export function VaultActiveCaseProvider({ children }: { children: ReactNode }) {
  const [scopes, setScopes] = useState<CaseScopeEntry[]>([]);
  const scopesRef = useRef<CaseScopeEntry[]>([]);

  const pushCaseScope = useCallback((caseInfo: VaultActiveCase) => {
    const id = ++scopeCounter;
    setScopes((prev) => {
      const next = [...prev, { id, caseInfo }];
      scopesRef.current = next;
      return next;
    });
    return id;
  }, []);

  const popCaseScope = useCallback((scopeId: number) => {
    setScopes((prev) => {
      const next = prev.filter((entry) => entry.id !== scopeId);
      scopesRef.current = next;
      return next;
    });
  }, []);

  const activeCase = useMemo(() => {
    if (scopes.length === 0) {
      return null;
    }
    return scopes[scopes.length - 1].caseInfo;
  }, [scopes]);

  const value = useMemo(
    (): VaultActiveCaseContextValue => ({ activeCase, pushCaseScope, popCaseScope }),
    [activeCase, pushCaseScope, popCaseScope]
  );

  return (
    <VaultActiveCaseContext.Provider value={value}>{children}</VaultActiveCaseContext.Provider>
  );
}
