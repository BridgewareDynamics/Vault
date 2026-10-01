import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { buildSoftBorderGradient, extractGradientColors, softenRgba } from '../../utils/extractGradientColors';

interface AmbientLavaFrameProps {
  children: ReactNode;
  className?: string;
  /** Raw gradient string or explicit accent colors for lava blobs. */
  colors?: string[];
  borderGradient?: string;
  borderRadiusClass?: string;
  paddingClass?: string;
}

interface AmbientLavaGlowProps {
  colors: string[];
  borderRadiusClass?: string;
  className?: string;
}

interface LavaBlobConfig {
  color: string;
  animationClass: string;
  style: CSSProperties;
}

const LAVA_BLOB_ANIMATION_CLASS = 'animate-lava-drift-a motion-reduce:animate-none';
const LAVA_BLOB_ANIMATION_CLASS_B = 'animate-lava-drift-b motion-reduce:animate-none';
const LAVA_BLOB_ANIMATION_CLASS_C = 'animate-lava-drift-c motion-reduce:animate-none';

function resolvePalette(colors?: string[], borderGradient?: string): string[] {
  if (colors && colors.length > 0) {
    return colors;
  }
  return extractGradientColors(borderGradient ?? '');
}

function buildBlobConfigs(colors: string[]): LavaBlobConfig[] {
  const [primary, secondary, tertiary] = colors;
  const configs: LavaBlobConfig[] = [
    {
      color: softenRgba(primary, 0.55),
      animationClass: LAVA_BLOB_ANIMATION_CLASS,
      style: { width: '55%', height: '55%', left: '-8%', top: '10%' },
    },
    {
      color: softenRgba(secondary ?? primary, 0.5),
      animationClass: LAVA_BLOB_ANIMATION_CLASS_B,
      style: { width: '48%', height: '48%', right: '-6%', bottom: '5%' },
    },
  ];

  if (tertiary) {
    configs.push({
      color: softenRgba(tertiary, 0.42),
      animationClass: LAVA_BLOB_ANIMATION_CLASS_C,
      style: { width: '40%', height: '40%', left: '28%', bottom: '-10%' },
    });
  }

  return configs;
}

/** Drifting glow blobs only — for layering inside an existing bordered container. */
export function AmbientLavaGlow({
  colors,
  borderRadiusClass = 'rounded-3xl',
  className = '',
}: AmbientLavaGlowProps) {
  const blobs = useMemo(() => buildBlobConfigs(colors), [colors]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${borderRadiusClass} ${className}`}
      aria-hidden
    >
      {blobs.map((blob, index) => (
        <div
          key={index}
          className={`absolute rounded-full blur-3xl will-change-transform ${blob.animationClass}`}
          style={{
            ...blob.style,
            background: `radial-gradient(circle at 30% 30%, ${blob.color} 0%, transparent 72%)`,
          }}
        />
      ))}
      <div
        className={`absolute inset-0 ${borderRadiusClass}`}
        style={{
          background:
            'radial-gradient(circle at 50% 120%, rgba(255,255,255,0.04) 0%, transparent 55%)',
        }}
      />
    </div>
  );
}

/**
 * Subtle lava-lamp frame — soft drifting glow blobs with a static accent border.
 * Replaces the old shifting multicolor gradient that visibly jumped on loop reset.
 */
export function AmbientLavaFrame({
  children,
  className = '',
  colors,
  borderGradient,
  borderRadiusClass = 'rounded-3xl',
  paddingClass = 'p-[2px]',
}: AmbientLavaFrameProps) {
  const palette = useMemo(
    () => resolvePalette(colors, borderGradient),
    [colors, borderGradient],
  );
  const border = useMemo(() => buildSoftBorderGradient(palette), [palette]);

  return (
    <div className={`relative overflow-hidden ${paddingClass} ${borderRadiusClass} ${className}`}>
      <div
        className={`pointer-events-none absolute inset-0 ${borderRadiusClass}`}
        style={{ background: border }}
        aria-hidden
      />
      <AmbientLavaGlow colors={palette} borderRadiusClass={borderRadiusClass} />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
