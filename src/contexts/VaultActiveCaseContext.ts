import { useContext, useEffect, createContext } from 'react';

export interface VaultActiveCase {
  path: string;
  name: string;
}

export interface VaultActiveCaseContextValue {
  activeCase: VaultActiveCase | null;
  pushCaseScope: (caseInfo: VaultActiveCase) => number;
  popCaseScope: (scopeId: number) => void;
}

export const VaultActiveCaseContext = createContext<VaultActiveCaseContextValue | undefined>(
  undefined
);

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
