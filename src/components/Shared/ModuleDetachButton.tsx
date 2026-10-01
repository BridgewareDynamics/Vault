import { motion } from 'framer-motion';
import { ExternalLink, Minimize2 } from 'lucide-react';

interface ModuleDetachButtonProps {
  mode: 'detach' | 'reattach';
  featureLabel: 'Map' | 'Transcript' | 'File Converter' | 'Novel';
  onClick: () => void;
  disabled?: boolean;
  isPastel?: boolean;
}

export function ModuleDetachButton({
  mode,
  featureLabel,
  onClick,
  disabled = false,
  isPastel = false,
}: ModuleDetachButtonProps) {
  const isDetach = mode === 'detach';
  const label = isDetach ? 'Pop out' : 'Dock to Vault';
  const ariaLabel = isDetach
    ? `Open ${featureLabel} in separate window`
    : `Return ${featureLabel} to main window`;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.05, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        isPastel
          ? 'border-purple-200/60 bg-white/80 text-gray-700 hover:bg-pink-50'
          : 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
      }`}
      aria-label={ariaLabel}
      title={
        isDetach
          ? `Open ${featureLabel} in a movable window so you can use other Vault tools in parallel`
          : `Return ${featureLabel} to the main Vault window`
      }
    >
      {isDetach ? (
        <ExternalLink className="h-4 w-4 shrink-0" />
      ) : (
        <Minimize2 className="h-4 w-4 shrink-0" />
      )}
      <span>{label}</span>
    </motion.button>
  );
}
