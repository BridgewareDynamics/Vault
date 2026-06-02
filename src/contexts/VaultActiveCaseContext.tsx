import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface VaultActiveCase {
  path: string;
  name: string;
}

interface CaseScopeEntry {
  id: number;
  caseInfo: VaultActiveCase;
}

interface VaultActiveCaseContextValue {
  activeCase: VaultActiveCase | null;
  pushCaseScope: (caseInfo: VaultActiveCase) => number;
  popCaseScope: (scopeId: number) => void;
}

const VaultActiveCaseContext = createContext<VaultActiveCaseContextValue | undefined>(undefined);

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
    () => ({ activeCase, pushCaseScope, popCaseScope }),
    [activeCase, pushCaseScope, popCaseScope]
  );

  return (
    <VaultActiveCaseContext.Provider value={value}>{children}</VaultActiveCaseContext.Provider>
  );
}

export function useVaultActiveCase(): VaultActiveCaseContextValue {
  const ctx = useContext(VaultActiveCaseContext);
  if (!ctx) {
    return {
      activeCase: null,
      pushCaseScope: () => 0,
      popCaseScope: () => {},
    };
  }
  return ctx;
}

/** Registers the current module/archive case for global tools (recorder, etc.). */
export function useRegisterVaultActiveCase(
  casePath: string | null | undefined,
  caseName: string | null | undefined
) {
  const { pushCaseScope, popCaseScope } = useVaultActiveCase();

  const path = casePath ?? null;
  const name = caseName?.trim() || null;

  useEffect(() => {
    if (!path) {
      return;
    }
    const scopeId = pushCaseScope({ path, name: name || 'Case' });
    return () => popCaseScope(scopeId);
  }, [path, name, pushCaseScope, popCaseScope]);
}
