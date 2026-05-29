import type { ModuleHostMode } from '../../types/detachableModules';
import { ModuleDetachButton } from './ModuleDetachButton';

interface ModuleChromeButtonsProps {
  featureLabel: 'Map' | 'Transcript';
  hostMode?: ModuleHostMode;
  onPopOut?: () => void;
  onReattach?: () => void;
  popOutDisabled?: boolean;
  isPastel?: boolean;
}

export function ModuleChromeButtons({
  featureLabel,
  hostMode = 'embedded',
  onPopOut,
  onReattach,
  popOutDisabled = false,
  isPastel = false,
}: ModuleChromeButtonsProps) {
  const isDetached = hostMode === 'detached';

  if (isDetached && onReattach) {
    return (
      <ModuleDetachButton
        mode="reattach"
        featureLabel={featureLabel}
        onClick={onReattach}
        disabled={popOutDisabled}
        isPastel={isPastel}
      />
    );
  }

  if (!isDetached && onPopOut) {
    return (
      <ModuleDetachButton
        mode="detach"
        featureLabel={featureLabel}
        onClick={onPopOut}
        disabled={popOutDisabled}
        isPastel={isPastel}
      />
    );
  }

  return null;
}

export type { ModuleChromeButtonsProps };
