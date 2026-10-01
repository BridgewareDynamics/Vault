import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

export type BookPageFlipPivot = 'left' | 'right';

interface BookPageFlipAnimationProps {
  direction: 'next' | 'prev';
  pivot: BookPageFlipPivot;
  isCoverOpening?: boolean;
  pageWidthPx: number;
  pageHeightPx: number;
  children: ReactNode;
  backContent?: ReactNode;
  onComplete?: () => void;
  style?: CSSProperties;
}

const FLIP_DURATION = 0.72;

export function BookPageFlipAnimation({
  direction,
  pivot,
  isCoverOpening = false,
  pageWidthPx,
  pageHeightPx,
  children,
  backContent,
  onComplete,
  style,
}: BookPageFlipAnimationProps) {
  const completedRef = useRef(false);
  const isNext = direction === 'next';
  const origin = pivot === 'left' ? 'right center' : 'left center';
  const initialRotateY = isNext ? (isCoverOpening ? -88 : 0) : 178;
  const animateRotateY = isNext ? -178 : 0;

  useEffect(() => {
    completedRef.current = false;
  }, [direction, pivot, isCoverOpening]);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  };

  return (
    <motion.div
      className="pointer-events-none absolute top-0 z-30"
      style={{
        width: pageWidthPx,
        height: pageHeightPx,
        transformStyle: 'preserve-3d',
        transformOrigin: origin,
        ...style,
      }}
      initial={{
        rotateY: initialRotateY,
        rotateX: 0,
        z: 0,
      }}
      animate={{
        rotateY: animateRotateY,
        rotateX: isNext ? -5 : 5,
        z: 24,
      }}
      transition={{
        duration: FLIP_DURATION,
        ease: [0.42, 0.04, 0.22, 1],
      }}
      onAnimationComplete={() => finish()}
    >
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
        }}
      >
        {children}
      </div>
      {backContent && (
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            transform: 'rotateY(180deg)',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          {backContent}
        </div>
      )}
    </motion.div>
  );
}

export const BOOK_FLIP_DURATION_MS = Math.round(FLIP_DURATION * 1000) + 80;
