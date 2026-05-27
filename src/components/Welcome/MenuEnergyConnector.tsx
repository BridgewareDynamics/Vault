import { motion, type Transition } from 'framer-motion';

export type MenuConnectorVariant = 'hero-to-grid' | 'grid-to-feature';

type BeamProfile = 'trunk' | 'rail' | 'drop';

interface BeamTheme {
  whiteHot: string;
  core: string;
  mid: string;
  outer: string;
  flare: string;
  hubGlow: string;
  pulseDuration: number;
  flowDuration: number;
}

const PULSE_DELAY = 1.5;
/** How far the unified trunk rises into the hero zone (px). */
export const MENU_HERO_BEAM_OVERLAP = 64;
/** Default bus center when overlapping hero (icon bottom ≈ 268px, bus ≈ 292px). */
export const MENU_DEFAULT_BUS_OFFSET_TOP = 76;
const BEAM = {
  trunkFilament: 2,
  trunkHalo: 10,
  trunkContainer: 28,
  railFilament: 2,
  railHalo: 12,
  railBandHeight: 16,
  dropFilament: 1.5,
  dropHalo: 8,
  dropContainer: 14,
  junction: 5,
  hub: 12,
  boltTrunk: 2.5,
  boltDrop: 2,
} as const;

function getBeamTheme(isPastel: boolean, primaryRgba: string, _secondaryRgba: string): BeamTheme {
  if (isPastel) {
    return {
      whiteHot: 'rgba(255, 255, 255, 0.98)',
      core: 'rgba(255, 255, 255, 0.92)',
      mid: 'rgba(216, 180, 254, 0.95)',
      outer: 'rgba(196, 181, 253, 0.7)',
      flare: 'rgba(216, 180, 254, 1)',
      hubGlow: '0 0 8px rgba(216, 180, 254, 0.55), 0 0 16px rgba(196, 181, 253, 0.3)',
      pulseDuration: 6,
      flowDuration: 2.4,
    };
  }

  return {
    whiteHot: 'rgba(255, 255, 255, 1)',
    core: 'rgba(255, 255, 255, 0.95)',
    mid: `${primaryRgba}0.95)`,
    outer: `${primaryRgba}0.7)`,
    flare: `${primaryRgba}1)`,
    hubGlow: `0 0 10px ${primaryRgba}0.65), 0 0 20px ${primaryRgba}0.35)`,
    pulseDuration: 5,
    flowDuration: 2,
  };
}

const pulseTransition = (duration: number, delay = PULSE_DELAY): Transition => ({
  duration,
  repeat: Infinity,
  ease: 'easeInOut',
  delay,
});

/** One palette for every beam — white core, purple glow (no cyan/teal band). */
function energyBeamGradient(
  theme: BeamTheme,
  axis: 'vertical' | 'horizontal',
  profile: BeamProfile = 'trunk'
): string {
  const isTrunk = profile === 'trunk' || profile === 'rail';
  if (axis === 'vertical') {
    if (isTrunk) {
      return `linear-gradient(to bottom, ${theme.mid} 0%, ${theme.whiteHot} 10%, ${theme.whiteHot} 90%, ${theme.mid} 100%)`;
    }
    return `linear-gradient(to bottom, ${theme.outer} 0%, ${theme.mid} 18%, ${theme.whiteHot} 50%, ${theme.mid} 82%, ${theme.outer} 100%)`;
  }
  if (isTrunk) {
    return `linear-gradient(to right, ${theme.mid} 0%, ${theme.whiteHot} 10%, ${theme.whiteHot} 90%, ${theme.mid} 100%)`;
  }
  return `linear-gradient(to right, ${theme.outer} 0%, ${theme.mid} 18%, ${theme.whiteHot} 50%, ${theme.mid} 82%, ${theme.outer} 100%)`;
}

function filamentGlow(theme: BeamTheme): string {
  return `0 0 5px ${theme.whiteHot}, 0 0 12px ${theme.flare}, 0 0 20px ${theme.mid}`;
}

interface EnergyBeamLineProps {
  theme: BeamTheme;
  orientation: 'vertical' | 'horizontal';
  length: number | string;
  profile: BeamProfile;
  enterDelay?: number;
}

/** Unified flowing-energy beam — halo + colored shaft + white-hot core. */
function EnergyBeamLine({ theme, orientation, length, profile, enterDelay = 0.7 }: EnergyBeamLineProps) {
  const isVertical = orientation === 'vertical';
  const axis = isVertical ? 'vertical' : 'horizontal';
  const gradient = energyBeamGradient(theme, axis, profile);

  const filamentPx =
    profile === 'drop' ? BEAM.dropFilament : profile === 'rail' && !isVertical ? BEAM.railFilament : BEAM.trunkFilament;
  const haloPx =
    profile === 'drop' ? BEAM.dropHalo : profile === 'rail' && !isVertical ? BEAM.railHalo : BEAM.trunkHalo;

  const containerStyle = isVertical
    ? {
        width: profile === 'drop' ? BEAM.dropContainer : BEAM.trunkContainer,
        height: length,
      }
    : {
        width: length,
        height: profile === 'rail' ? BEAM.railBandHeight : BEAM.dropContainer,
      };

  const haloStyle = isVertical
    ? { width: haloPx, height: '100%', left: '50%', transform: 'translateX(-50%)', top: 0 }
    : { height: haloPx, width: '100%', top: '50%', transform: 'translateY(-50%)', left: 0 };

  const shaftStyle = isVertical
    ? { width: filamentPx, height: '100%', left: '50%', transform: 'translateX(-50%)' }
    : { height: filamentPx, width: '100%', top: '50%', transform: 'translateY(-50%)' };

  const coreStyle = isVertical
    ? { width: 1, height: '100%', left: '50%', transform: 'translateX(-50%)' }
    : { height: 1, width: '100%', top: '50%', transform: 'translateY(-50%)' };

  const isTrunkLike = profile === 'trunk' || profile === 'rail';

  return (
    <div
      className={`absolute inset-0 ${isTrunkLike ? 'overflow-visible' : 'overflow-hidden'}`}
      style={containerStyle}
    >
      <motion.div
        className="absolute rounded-full"
        style={{
          ...haloStyle,
          background: gradient,
          filter: 'blur(4px)',
        }}
        animate={{ opacity: isTrunkLike ? [0.55, 0.72, 0.55] : [0.3, 0.5, 0.3] }}
        transition={pulseTransition(theme.pulseDuration)}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          ...shaftStyle,
          background: gradient,
          boxShadow: filamentGlow(theme),
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isTrunkLike ? [0.96, 1, 0.96] : [0.92, 1, 0.92] }}
        transition={{
          opacity: {
            ...pulseTransition(theme.pulseDuration * 0.85),
            delay: enterDelay,
          },
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          ...coreStyle,
          background: theme.whiteHot,
          boxShadow: `0 0 3px ${theme.whiteHot}, 0 0 8px ${theme.flare}`,
        }}
        animate={{ opacity: [0.9, 1, 0.9] }}
        transition={pulseTransition(theme.pulseDuration * 0.7)}
      />
    </div>
  );
}

interface FlowPulseProps {
  theme: BeamTheme;
  orientation: 'vertical' | 'horizontal';
  delayOffset: number;
  thickness?: number;
  spanParent?: boolean;
}

/** Energy packet — transform-only motion so overflow cannot change page scroll height. */
function FlowPulse({
  theme,
  orientation,
  delayOffset,
  thickness = BEAM.boltTrunk,
  spanParent = false,
}: FlowPulseProps) {
  const isVertical = orientation === 'vertical';
  const gradient = isVertical
    ? `linear-gradient(to bottom, transparent 0%, ${theme.whiteHot} 42%, ${theme.mid} 58%, transparent 100%)`
    : `linear-gradient(to right, transparent 0%, ${theme.whiteHot} 42%, ${theme.mid} 58%, transparent 100%)`;

  const travelEnd = spanParent ? '98%' : '72%';

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        ...(isVertical
          ? {
              width: thickness,
              height: spanParent ? '14%' : 18,
              left: '50%',
              top: 0,
              x: '-50%',
            }
          : {
              width: spanParent ? '14%' : 18,
              height: thickness,
              left: 0,
              top: '50%',
              y: '-50%',
            }),
        background: gradient,
        boxShadow: `0 0 8px ${theme.flare}, 0 0 14px ${theme.mid}`,
        willChange: 'transform, opacity',
      }}
      initial={isVertical ? { y: '0%', opacity: 0 } : { x: '0%', opacity: 0 }}
      animate={
        isVertical
          ? { y: ['0%', travelEnd], opacity: [0, 0.9, 0.9, 0] }
          : { x: ['0%', travelEnd], opacity: [0, 0.9, 0.9, 0] }
      }
      transition={{
        ...(isVertical
          ? {
              y: {
                duration: theme.flowDuration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delayOffset,
              },
            }
          : {
              x: {
                duration: theme.flowDuration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delayOffset,
              },
            }),
        opacity: {
          duration: theme.flowDuration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delayOffset,
          times: [0, 0.08, 0.92, 1],
        },
      }}
    />
  );
}

interface CardDropBeamProps {
  theme: BeamTheme;
  leftPercent: string;
  delayIndex: number;
  busCenterY: number;
}

function CardDropBeam({ theme, leftPercent, delayIndex, busCenterY }: CardDropBeamProps) {
  const dropHeight = 30;

  return (
    <div
      className="absolute overflow-visible"
      style={{
        left: leftPercent,
        top: busCenterY,
        width: BEAM.dropContainer,
        height: dropHeight,
        transform: 'translate(-50%, -1px)',
      }}
    >
      <div
        className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: BEAM.junction,
          height: BEAM.junction,
          background: theme.whiteHot,
          boxShadow: filamentGlow(theme),
        }}
      />
      <EnergyBeamLine
        theme={theme}
        orientation="vertical"
        length="100%"
        profile="drop"
        enterDelay={0.8 + delayIndex * 0.06}
      />
      <FlowPulse
        theme={theme}
        orientation="vertical"
        delayOffset={PULSE_DELAY + delayIndex * 0.2}
        thickness={BEAM.boltDrop}
        spanParent
      />
    </div>
  );
}

interface MenuGridBeamNetworkProps {
  isPastel: boolean;
  primaryRgba: string;
  secondaryRgba: string;
  columnCount: number;
  /** Pull the beam layer up into the hero (px) for one continuous trunk. */
  heroOverlap?: number;
  /** Distance from beam-layer top to horizontal bus center (px). */
  busOffsetTop?: number;
  className?: string;
}

export function MenuGridBeamNetwork({
  isPastel,
  primaryRgba,
  secondaryRgba,
  columnCount,
  heroOverlap = MENU_HERO_BEAM_OVERLAP,
  busOffsetTop = MENU_DEFAULT_BUS_OFFSET_TOP,
  className = '',
}: MenuGridBeamNetworkProps) {
  const theme = getBeamTheme(isPastel, primaryRgba, secondaryRgba);
  const columnCenters = Array.from({ length: columnCount }, (_, i) => `${((i + 0.5) / columnCount) * 100}%`);
  const busCenterY = busOffsetTop;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-[5] hidden overflow-visible lg:block ${className}`}
      style={{ top: -heroOverlap }}
      aria-hidden
    >
      {/* Center trunk — single continuous shaft from hero icon through the bus */}
      <div
        className="absolute left-1/2 top-0 bottom-0 z-10 -translate-x-1/2 overflow-visible"
        style={{ width: BEAM.trunkContainer }}
      >
        <motion.div
          className="absolute left-1/2 top-0 z-0 -translate-x-1/2 rounded-full"
          style={{
            width: 24,
            height: 24,
            background: `radial-gradient(circle, ${theme.whiteHot} 0%, ${theme.mid} 45%, transparent 72%)`,
            filter: 'blur(6px)',
          }}
          animate={{ opacity: [0.35, 0.55, 0.35] }}
          transition={pulseTransition(theme.pulseDuration)}
        />
        <EnergyBeamLine theme={theme} orientation="vertical" length="100%" profile="trunk" enterDelay={0.65} />
        <FlowPulse theme={theme} orientation="vertical" delayOffset={PULSE_DELAY} spanParent />
        <FlowPulse
          theme={theme}
          orientation="vertical"
          delayOffset={PULSE_DELAY + theme.flowDuration * 0.5}
          thickness={BEAM.boltDrop}
          spanParent
        />
      </div>

      {/* Horizontal bus */}
      <div
        className="absolute left-0 right-0 z-20 overflow-visible"
        style={{
          top: busCenterY - BEAM.railBandHeight / 2,
          height: BEAM.railBandHeight,
        }}
      >
        <EnergyBeamLine theme={theme} orientation="horizontal" length="100%" profile="rail" enterDelay={0.8} />
        <FlowPulse
          theme={theme}
          orientation="horizontal"
          delayOffset={PULSE_DELAY + 0.15}
          thickness={BEAM.boltTrunk}
          spanParent
        />
      </div>

      {/* Junction hub — ties vertical trunk to horizontal rail */}
      <motion.div
        className="absolute left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          top: busCenterY,
          width: BEAM.hub,
          height: BEAM.hub,
          background: `radial-gradient(circle, ${theme.whiteHot} 0%, ${theme.mid} 50%, transparent 75%)`,
          boxShadow: theme.hubGlow,
        }}
        animate={{ opacity: [0.85, 1, 0.85], scale: [0.95, 1.05, 0.95] }}
        transition={pulseTransition(theme.pulseDuration)}
      />

      {columnCenters.map((left, index) => (
        <CardDropBeam
          key={left}
          theme={theme}
          leftPercent={left}
          delayIndex={index}
          busCenterY={busCenterY}
        />
      ))}
    </div>
  );
}

interface MenuLightConduitProps {
  isPastel: boolean;
  primaryRgba: string;
  secondaryRgba: string;
  className?: string;
}

export function MenuLightConduit({ isPastel, primaryRgba, secondaryRgba, className = '' }: MenuLightConduitProps) {
  const theme = getBeamTheme(isPastel, primaryRgba, secondaryRgba);

  return (
    <div
      className={`absolute left-1/2 flex w-full -translate-x-1/2 justify-center overflow-hidden pointer-events-none ${className}`}
      style={{
        top: 256 - MENU_HERO_BEAM_OVERLAP,
        height: MENU_HERO_BEAM_OVERLAP + 64,
      }}
      aria-hidden
    >
      <div className="relative overflow-hidden" style={{ width: BEAM.trunkContainer, height: '100%' }}>
        <motion.div
          className="absolute left-1/2 top-0 z-0 h-6 w-6 -translate-x-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme.whiteHot} 0%, ${theme.mid} 40%, transparent 72%)`,
            filter: 'blur(5px)',
            opacity: 0.4,
          }}
          animate={{ opacity: [0.25, 0.45, 0.25] }}
          transition={pulseTransition(theme.pulseDuration)}
        />

        <EnergyBeamLine theme={theme} orientation="vertical" length="100%" profile="trunk" enterDelay={0.65} />
        <FlowPulse theme={theme} orientation="vertical" delayOffset={PULSE_DELAY} spanParent />
        <FlowPulse
          theme={theme}
          orientation="vertical"
          delayOffset={PULSE_DELAY + theme.flowDuration * 0.45}
          thickness={BEAM.boltDrop}
          spanParent
        />
      </div>
    </div>
  );
}

interface MenuEnergyConnectorProps {
  isPastel: boolean;
  primaryRgba: string;
  secondaryRgba: string;
  variant: MenuConnectorVariant;
  className?: string;
}

export function MenuEnergyConnector({ isPastel, primaryRgba, secondaryRgba, className = '' }: MenuEnergyConnectorProps) {
  const theme = getBeamTheme(isPastel, primaryRgba, secondaryRgba);

  return (
    <div
      className={`relative flex justify-center overflow-hidden pointer-events-none ${className}`}
      style={{ height: 48, width: BEAM.dropContainer }}
      aria-hidden
    >
      <EnergyBeamLine theme={theme} orientation="vertical" length="100%" profile="drop" enterDelay={0.92} />
      <FlowPulse theme={theme} orientation="vertical" delayOffset={PULSE_DELAY} thickness={BEAM.boltDrop} spanParent />
    </div>
  );
}

interface MenuHorizontalBeamProps {
  isPastel: boolean;
  primaryRgba: string;
  secondaryRgba: string;
  className?: string;
}

export function MenuHorizontalBeam(props: MenuHorizontalBeamProps) {
  return (
    <MenuGridBeamNetwork
      isPastel={props.isPastel}
      primaryRgba={props.primaryRgba}
      secondaryRgba={props.secondaryRgba}
      columnCount={4}
      className={props.className}
    />
  );
}

export function MenuHeroLightEmitter() {
  return null;
}

export const MenuHeroAnchor = MenuHeroLightEmitter;
