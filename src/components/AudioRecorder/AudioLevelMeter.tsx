interface AudioLevelMeterProps {
  level: number;
  isActive: boolean;
  activeClassName?: string;
  idleClassName?: string;
  peakClassName?: string;
}

export function AudioLevelMeter({
  level,
  isActive,
  activeClassName = 'bg-cyber-cyan-400',
  idleClassName = 'bg-white/15',
  peakClassName = 'bg-amber-400',
}: AudioLevelMeterProps) {
  const bars = 28;
  const clamped = Math.min(1, Math.max(0, level * 1.25));

  return (
    <div
      className="flex h-[4.5rem] items-end justify-center gap-[3px] px-1"
      aria-hidden
      role="presentation"
    >
      {Array.from({ length: bars }, (_, index) => {
        const threshold = (index + 1) / bars;
        const lit = isActive && clamped >= threshold * 0.88;
        const isPeak = lit && clamped > 0.92 && index >= bars - 4;
        const baseHeight = 28 + (index / (bars - 1)) * 72;

        return (
          <div
            key={index}
            className="flex h-full w-[5px] items-end justify-center"
          >
            <div
              className={`w-full origin-bottom rounded-full ${
                lit ? (isPeak ? peakClassName : activeClassName) : idleClassName
              }`}
              style={{
                height: `${baseHeight}%`,
                opacity: lit ? 1 : 0.35,
                transform: lit ? 'scaleY(1)' : 'scaleY(0.45)',
                transition: 'opacity 80ms ease-out, transform 80ms ease-out',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
