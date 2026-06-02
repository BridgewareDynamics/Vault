interface AudioLevelMeterProps {
  level: number;
  isActive: boolean;
  activeClassName?: string;
  idleClassName?: string;
}

export function AudioLevelMeter({
  level,
  isActive,
  activeClassName = 'bg-cyber-cyan-400',
  idleClassName = 'bg-white/15',
}: AudioLevelMeterProps) {
  const bars = 24;
  const clamped = Math.min(1, Math.max(0, level * 1.35));

  return (
    <div className="flex h-16 items-end justify-center gap-1" aria-hidden>
      {Array.from({ length: bars }, (_, index) => {
        const threshold = (index + 1) / bars;
        const lit = isActive && clamped >= threshold * 0.85;
        const height = 18 + (index / bars) * 46;
        return (
          <div
            key={index}
            className={`w-1.5 rounded-full transition-all duration-100 ${lit ? activeClassName : idleClassName}`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}
