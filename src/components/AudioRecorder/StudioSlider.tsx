interface StudioSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  hint?: string;
  onChange: (value: number) => void;
  valueClassName?: string;
  trackClassName?: string;
}

export function StudioSlider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  disabled = false,
  hint,
  onChange,
  valueClassName = 'text-cyan-200',
}: StudioSliderProps) {
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        <span className={`font-mono text-xs tabular-nums ${valueClassName}`}>
          {value}
          {unit}
        </span>
      </div>
      <div className="relative flex h-2 w-full items-center">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="vault-studio-range relative z-[1] h-2 w-full cursor-pointer appearance-none bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, rgb(139 92 246 / 0.55) 0%, rgb(139 92 246 / 0.55) ${percent}%, rgb(255 255 255 / 0.1) ${percent}%, rgb(255 255 255 / 0.1) 100%)`,
          }}
        />
      </div>
      {hint ? <p className="text-xs opacity-70">{hint}</p> : null}
    </div>
  );
}
