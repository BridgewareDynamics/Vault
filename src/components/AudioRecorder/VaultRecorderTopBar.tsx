import { VaultRecorderDock } from './VaultRecorderDock';

interface VaultRecorderTopBarProps {
  visible: boolean;
}

/** Floating recorder control for full-screen modules without ActionToolbar. */
export function VaultRecorderTopBar({ visible }: VaultRecorderTopBarProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-[70] flex items-center gap-2"
      aria-label="Global audio recorder"
    >
      <div className="pointer-events-auto">
        <VaultRecorderDock />
      </div>
    </div>
  );
}
