import { useArchiveContext } from '../../contexts/ArchiveContext';
import { useRegisterVaultActiveCase } from '../../contexts/VaultActiveCaseContext';

/** Keeps archive's open case in sync with global Vault tools. */
export function VaultActiveCaseSync() {
  const { currentCase } = useArchiveContext();
  useRegisterVaultActiveCase(currentCase?.path ?? null, currentCase?.name ?? null);
  return null;
}
