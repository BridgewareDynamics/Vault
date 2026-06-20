import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, FolderOpen, Map as MapIcon, Mic2, Shield } from 'lucide-react';
import { ActionToolbar } from './ActionToolbar';
import { CardBottomDropBeam, MenuGridBeamNetwork } from './Welcome/MenuEnergyConnector';
import { PdfConverterColumn, type FileConverterCardPalette } from './Welcome/PdfConverterColumn';
import { PdfAuditNovelColumn, type NovelCardPalette } from './Welcome/PdfAuditNovelColumn';
import {
  WelcomeActionCard,
  WelcomeActionCardWrapper,
  type WelcomeMenuCardConfig,
} from './Welcome/WelcomeActionCard';
import { AmbientLavaFrame } from './Shared/AmbientLavaFrame';
import { useSettingsContext } from '../utils/settingsContext';
import { Theme } from '../types';
import { isLightTheme } from '../theme/themeSemantics';
import { warmTranscriptionEntry } from '../utils/transcriptionPrefetch';
import { warmMapEntry } from '../utils/mapPrefetch';
import { warmFileConverterEntry } from '../utils/fileConverterPrefetch';
import { warmNovelEntry } from '../utils/novelPrefetch';
import { warmArchiveEntry } from '../utils/archivePrefetch';

const getAssetPath = (path: string) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

interface WelcomeScreenProps {
  onSelectFile: () => void;
  onOpenArchive: () => void;
  onOpenSecurityChecker: () => void;
  onOpenPDFExtraction?: () => void;
  onOpenFileConverter?: () => void;
  onOpenMap?: () => void;
  onOpenNovel?: () => void;
  onOpenTranscription?: () => void;
}

const generateParticles = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 20,
    duration: Math.random() * 10 + 15,
  }));

export function WelcomeScreen({
  onSelectFile,
  onOpenArchive,
  onOpenSecurityChecker,
  onOpenPDFExtraction,
  onOpenFileConverter,
  onOpenMap,
  onOpenNovel,
  onOpenTranscription,
}: WelcomeScreenProps) {
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'pastel';
  const particles = useMemo(() => generateParticles(50), []);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const mouseRafRef = useRef<number | null>(null);

  useEffect(() => {
    warmArchiveEntry();

    const warmers: Array<() => void> = [];
    if (onOpenTranscription) {
      warmers.push(warmTranscriptionEntry);
    }
    if (onOpenMap) {
      warmers.push(warmMapEntry);
    }
    if (onOpenNovel) {
      warmers.push(warmNovelEntry);
    }
    if (onOpenFileConverter) {
      warmers.push(warmFileConverterEntry);
    }

    if (warmers.length === 0) {
      return;
    }

    const warm = () => warmers.forEach((run) => run());
    const idleId =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(warm, { timeout: 2500 })
        : undefined;
    const timeoutId =
      idleId === undefined ? window.setTimeout(warm, 1200) : undefined;

    return () => {
      if (idleId !== undefined) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [onOpenMap, onOpenNovel, onOpenTranscription, onOpenFileConverter]);

  const isPastel = isLightTheme(theme);
  const bgGradient = isPastel
    ? 'from-slate-50 via-pink-50/30 to-slate-50'
    : 'from-gray-950 via-purple-950/50 to-gray-950';
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';

  const actionCards: WelcomeMenuCardConfig[] = useMemo(() => [
    {
      key: 'pdf-to-png',
      title: 'PDF to PNG',
      description: 'Extract pages from PDF files',
      actionLabel: 'Select file',
      onClick: onOpenPDFExtraction || onSelectFile,
      icon: FileText,
      actionIcon: FileText,
      delay: 0.7,
      pastel: {
        borderClassName: 'border-violet-200/45',
        cardShadow: '0 4px 20px rgba(167, 139, 250, 0.16), 0 0 0 1px rgba(167, 139, 250, 0.1)',
        glowBackground: 'radial-gradient(circle at center, rgba(167, 139, 250, 0.16) 0%, transparent 70%)',
        glowShadow: '0 0 30px rgba(167, 139, 250, 0.22)',
        overlayClassName: 'bg-gradient-to-br from-violet-50/40 via-violet-50/25 to-purple-50/35',
        iconPulse: [
          'drop-shadow(0 2px 8px rgba(167, 139, 250, 0.22))',
          'drop-shadow(0 4px 12px rgba(139, 92, 246, 0.32))',
          'drop-shadow(0 2px 8px rgba(167, 139, 250, 0.22))',
        ],
        iconGlowClassName: 'bg-gradient-to-br from-violet-200/50 to-purple-200/50',
        iconWrapperClassName: 'bg-gradient-to-br from-violet-100/85 to-purple-100/85 border-2 border-violet-200/35',
        iconClassName: 'text-violet-500',
        actionIconClassName: 'text-violet-500',
      },
      dark: {
        beamBackground:
          'linear-gradient(to right, transparent 0%, rgba(124, 58, 237, 0.55) 20%, rgba(167, 139, 250, 0.85) 50%, rgba(124, 58, 237, 0.55) 80%, transparent 100%)',
        beamBoxShadow: '0 0 12px rgba(139, 92, 246, 0.35), 0 0 28px rgba(124, 58, 237, 0.22)',
        frameBackgroundImage:
          'linear-gradient(135deg, rgba(124, 58, 237, 0.95), rgba(139, 92, 246, 0.9), rgba(167, 139, 250, 0.95))',
        buttonShadow: '0 0 30px rgba(139, 92, 246, 0.24), inset 0 0 30px rgba(124, 58, 237, 0.08)',
        glowBackground: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
        glowShadow: '0 0 40px rgba(139, 92, 246, 0.45), 0 0 60px rgba(124, 58, 237, 0.3)',
        iconPulse: [
          'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
          'drop-shadow(0 0 25px rgba(167, 139, 250, 0.85))',
          'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
        ],
        iconGlowClassName: 'bg-gradient-to-br from-violet-500 to-purple-700',
        iconWrapperClassName: 'bg-gradient-to-br from-violet-500/90 to-purple-700/90 border border-violet-300/35',
        iconClassName: 'text-white',
        titleClassName:
          'bg-gradient-to-b from-white via-violet-100 to-violet-300/90 bg-clip-text text-transparent tracking-tight drop-shadow-[0_1px_10px_rgba(167,139,250,0.35)]',
        actionIconClassName: 'text-violet-300',
      },
    },
    ...(onOpenTranscription
      ? [
          {
            key: 'transcription',
            title: 'Transcript',
            description: 'Audio and video speech workflows for Vault case media',
            actionLabel: 'Launch Engine',
            onClick: onOpenTranscription,
            icon: Mic2,
            actionIcon: Mic2,
            delay: 0.75,
            pastel: {
              borderClassName: 'border-rose-200/45',
              cardShadow: '0 4px 24px rgba(251, 113, 133, 0.18), 0 0 0 1px rgba(251, 113, 133, 0.1)',
              glowBackground: 'radial-gradient(circle at center, rgba(251, 113, 133, 0.18) 0%, transparent 72%)',
              glowShadow: '0 0 34px rgba(251, 113, 133, 0.24)',
              overlayClassName: 'bg-gradient-to-br from-rose-50/40 via-rose-50/25 to-pink-50/30',
              iconPulse: [
                'drop-shadow(0 2px 8px rgba(251, 113, 133, 0.24))',
                'drop-shadow(0 4px 12px rgba(244, 63, 94, 0.34))',
                'drop-shadow(0 2px 8px rgba(251, 113, 133, 0.24))',
              ],
              iconGlowClassName: 'bg-gradient-to-br from-rose-200/50 to-pink-200/50',
              iconWrapperClassName:
                'bg-gradient-to-br from-rose-100/85 to-pink-100/85 border-2 border-rose-200/35',
              iconClassName: 'text-rose-500',
              actionIconClassName: 'text-rose-500',
            },
            dark: {
              beamBackground:
                'linear-gradient(to right, transparent 0%, rgba(244, 63, 94, 0.55) 18%, rgba(251, 113, 133, 0.85) 50%, rgba(225, 29, 72, 0.6) 82%, transparent 100%)',
              beamBoxShadow: '0 0 12px rgba(244, 63, 94, 0.32), 0 0 28px rgba(225, 29, 72, 0.18)',
              frameBackgroundImage:
                'linear-gradient(135deg, rgba(225, 29, 72, 0.94), rgba(244, 63, 94, 0.9), rgba(251, 113, 133, 0.94))',
              buttonShadow: '0 0 32px rgba(244, 63, 94, 0.2), inset 0 0 28px rgba(225, 29, 72, 0.08)',
              glowBackground: 'radial-gradient(circle at center, rgba(244, 63, 94, 0.2) 0%, transparent 70%)',
              glowShadow: '0 0 42px rgba(244, 63, 94, 0.4), 0 0 62px rgba(225, 29, 72, 0.26)',
              iconPulse: [
                'drop-shadow(0 0 15px rgba(244, 63, 94, 0.56))',
                'drop-shadow(0 0 25px rgba(251, 113, 133, 0.82))',
                'drop-shadow(0 0 15px rgba(244, 63, 94, 0.56))',
              ],
              iconGlowClassName: 'bg-gradient-to-br from-rose-500 to-rose-700',
              iconWrapperClassName:
                'bg-gradient-to-br from-rose-500/90 to-rose-700/90 border border-rose-300/40',
              iconClassName: 'text-white',
              titleClassName:
                'bg-gradient-to-b from-white via-rose-100 to-rose-300/90 bg-clip-text text-transparent tracking-tight drop-shadow-[0_1px_10px_rgba(251,113,133,0.35)]',
              actionIconClassName: 'text-rose-300',
            },
          },
        ]
      : []),
    {
      key: 'pdf-audit',
      title: 'PDF Audit',
      description: 'Security & redaction analysis',
      actionLabel: 'Run Audit',
      onClick: onOpenSecurityChecker,
      icon: Shield,
      actionIcon: Shield,
      delay: 0.8,
      pastel: {
        borderClassName: 'border-blue-200/40',
        cardShadow: '0 4px 20px rgba(165, 180, 252, 0.15), 0 0 0 1px rgba(165, 180, 252, 0.1)',
        glowBackground: 'radial-gradient(circle at center, rgba(165, 180, 252, 0.15) 0%, transparent 70%)',
        glowShadow: '0 0 30px rgba(165, 180, 252, 0.2)',
        overlayClassName: 'bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-cyan-50/30',
        iconPulse: [
          'drop-shadow(0 2px 8px rgba(165, 180, 252, 0.2))',
          'drop-shadow(0 4px 12px rgba(96, 165, 250, 0.3))',
          'drop-shadow(0 2px 8px rgba(165, 180, 252, 0.2))',
        ],
        iconGlowClassName: 'bg-gradient-to-br from-blue-200/40 via-indigo-200/40 to-cyan-200/40',
        iconWrapperClassName: 'bg-gradient-to-br from-blue-100/80 to-indigo-100/80 border-2 border-blue-200/30',
        iconClassName: 'text-blue-400',
        actionIconClassName: 'text-blue-400',
      },
      dark: {
        beamBackground:
          'linear-gradient(to right, transparent 0%, rgba(59, 130, 246, 0.55) 20%, rgba(34, 211, 238, 0.82) 50%, rgba(59, 130, 246, 0.55) 80%, transparent 100%)',
        beamBoxShadow: '0 0 12px rgba(59, 130, 246, 0.32), 0 0 28px rgba(34, 211, 238, 0.24)',
        frameBackgroundImage:
          'linear-gradient(45deg, rgba(14, 165, 233, 0.95), rgba(59, 130, 246, 0.92), rgba(34, 211, 238, 0.95))',
        buttonShadow: '0 0 30px rgba(59, 130, 246, 0.22), inset 0 0 30px rgba(34, 211, 238, 0.08)',
        glowBackground: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
        glowShadow: '0 0 40px rgba(59, 130, 246, 0.4), 0 0 60px rgba(34, 211, 238, 0.28)',
        iconPulse: [
          'drop-shadow(0 0 15px rgba(59, 130, 246, 0.58))',
          'drop-shadow(0 0 25px rgba(34, 211, 238, 0.82))',
          'drop-shadow(0 0 15px rgba(59, 130, 246, 0.58))',
        ],
        iconGlowClassName: 'bg-gradient-to-br from-sky-500 to-blue-600',
        iconWrapperClassName: 'bg-gradient-to-br from-sky-500/90 to-blue-600/90 border border-cyan-300/40',
        iconClassName: 'text-white',
        titleClassName:
          'bg-gradient-to-b from-white via-sky-100 to-sky-300/90 bg-clip-text text-transparent tracking-tight drop-shadow-[0_1px_10px_rgba(56,189,248,0.35)]',
        actionIconClassName: 'text-cyan-300',
      },
    },
    ...(onOpenMap
      ? [
          {
            key: 'map',
            title: 'Map',
            description: 'Research timeline mind maps',
            actionLabel: 'Open Map',
            onClick: onOpenMap,
            icon: MapIcon,
            actionIcon: MapIcon,
            delay: 0.85,
            pastel: {
              borderClassName: 'border-emerald-200/45',
              cardShadow: '0 4px 24px rgba(110, 231, 183, 0.18), 0 0 0 1px rgba(110, 231, 183, 0.1)',
              glowBackground: 'radial-gradient(circle at center, rgba(110, 231, 183, 0.18) 0%, transparent 72%)',
              glowShadow: '0 0 34px rgba(110, 231, 183, 0.24)',
              overlayClassName: 'bg-gradient-to-br from-emerald-50/40 via-emerald-50/25 to-teal-50/30',
              iconPulse: [
                'drop-shadow(0 2px 8px rgba(110, 231, 183, 0.24))',
                'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.34))',
                'drop-shadow(0 2px 8px rgba(110, 231, 183, 0.24))',
              ],
              iconGlowClassName: 'bg-gradient-to-br from-emerald-200/50 to-teal-200/50',
              iconWrapperClassName: 'bg-gradient-to-br from-emerald-100/85 to-teal-100/85 border-2 border-emerald-200/35',
              iconClassName: 'text-emerald-600',
              actionIconClassName: 'text-emerald-600',
            },
            dark: {
              beamBackground:
                'linear-gradient(to right, transparent 0%, rgba(16, 185, 129, 0.55) 18%, rgba(52, 211, 153, 0.85) 50%, rgba(5, 150, 105, 0.6) 82%, transparent 100%)',
              beamBoxShadow: '0 0 12px rgba(16, 185, 129, 0.32), 0 0 28px rgba(5, 150, 105, 0.18)',
              frameBackgroundImage:
                'linear-gradient(135deg, rgba(5, 150, 105, 0.94), rgba(16, 185, 129, 0.9), rgba(52, 211, 153, 0.94))',
              buttonShadow: '0 0 32px rgba(16, 185, 129, 0.2), inset 0 0 28px rgba(5, 150, 105, 0.08)',
              glowBackground: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
              glowShadow: '0 0 42px rgba(16, 185, 129, 0.4), 0 0 62px rgba(5, 150, 105, 0.26)',
              iconPulse: [
                'drop-shadow(0 0 15px rgba(16, 185, 129, 0.56))',
                'drop-shadow(0 0 25px rgba(52, 211, 153, 0.82))',
                'drop-shadow(0 0 15px rgba(16, 185, 129, 0.56))',
              ],
              iconGlowClassName: 'bg-gradient-to-br from-emerald-500 to-teal-700',
              iconWrapperClassName:
                'bg-gradient-to-br from-emerald-500/90 to-teal-700/90 border border-emerald-300/40',
              iconClassName: 'text-white',
              titleClassName:
                'bg-gradient-to-b from-white via-emerald-100 to-emerald-300/90 bg-clip-text text-transparent tracking-tight drop-shadow-[0_1px_10px_rgba(52,211,153,0.35)]',
              actionIconClassName: 'text-emerald-300',
            },
          },
        ]
      : []),
  ], [onOpenPDFExtraction, onSelectFile, onOpenTranscription, onOpenSecurityChecker, onOpenMap]);

  const fileConverterPalette: FileConverterCardPalette = useMemo(() => ({
    pastel: {
      borderClassName: 'border-cyan-200/45',
      cardShadow: '0 4px 20px rgba(103, 232, 249, 0.18), 0 0 0 1px rgba(103, 232, 249, 0.12)',
      glowBackground: 'radial-gradient(circle at center, rgba(103, 232, 249, 0.18) 0%, transparent 70%)',
      glowShadow: '0 0 30px rgba(103, 232, 249, 0.22)',
      overlayClassName: 'bg-gradient-to-br from-cyan-50/40 via-cyan-50/25 to-sky-50/30',
      iconPulse: [
        'drop-shadow(0 2px 8px rgba(103, 232, 249, 0.24))',
        'drop-shadow(0 4px 12px rgba(34, 211, 238, 0.32))',
        'drop-shadow(0 2px 8px rgba(103, 232, 249, 0.24))',
      ],
      iconGlowClassName: 'bg-gradient-to-br from-cyan-200/50 to-sky-200/50',
      iconWrapperClassName: 'bg-gradient-to-br from-cyan-100/85 to-sky-100/85 border-2 border-cyan-200/35',
      iconClassName: 'text-cyan-500',
      actionIconClassName: 'text-cyan-500',
    },
    dark: {
      beamBackground:
        'linear-gradient(to right, transparent 0%, rgba(6, 182, 212, 0.55) 20%, rgba(34, 211, 238, 0.85) 50%, rgba(6, 182, 212, 0.55) 80%, transparent 100%)',
      beamBoxShadow: '0 0 12px rgba(6, 182, 212, 0.35), 0 0 28px rgba(8, 145, 178, 0.22)',
      frameBackgroundImage:
        'linear-gradient(135deg, rgba(8, 145, 178, 0.95), rgba(6, 182, 212, 0.9), rgba(34, 211, 238, 0.95))',
      buttonShadow: '0 0 30px rgba(6, 182, 212, 0.24), inset 0 0 30px rgba(8, 145, 178, 0.08)',
      glowBackground: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
      glowShadow: '0 0 40px rgba(6, 182, 212, 0.45), 0 0 60px rgba(8, 145, 178, 0.3)',
      iconPulse: [
        'drop-shadow(0 0 15px rgba(6, 182, 212, 0.6))',
        'drop-shadow(0 0 25px rgba(34, 211, 238, 0.85))',
        'drop-shadow(0 0 15px rgba(6, 182, 212, 0.6))',
      ],
      iconGlowClassName: 'bg-gradient-to-br from-cyan-500 to-sky-700',
      iconWrapperClassName: 'bg-gradient-to-br from-cyan-500/90 to-sky-700/90 border border-cyan-300/35',
      iconClassName: 'text-white',
      titleClassName:
        'bg-gradient-to-b from-white via-cyan-100 to-cyan-300/90 bg-clip-text text-transparent tracking-tight drop-shadow-[0_1px_10px_rgba(34,211,238,0.35)]',
      actionIconClassName: 'text-cyan-300',
    },
  }), []);

  const pdfToPngCard = useMemo(
    () => actionCards.find((card) => card.key === 'pdf-to-png'),
    [actionCards],
  );
  const pdfAuditCard = useMemo(
    () => actionCards.find((card) => card.key === 'pdf-audit'),
    [actionCards],
  );
  const middleActionCards = useMemo(
    () => actionCards.filter((card) => card.key !== 'pdf-to-png' && card.key !== 'pdf-audit'),
    [actionCards],
  );

  const novelPalette: NovelCardPalette = useMemo(() => ({
    pastel: {
      borderClassName: 'border-amber-200/40',
      cardShadow: '0 4px 20px rgba(251, 191, 36, 0.18), 0 0 0 1px rgba(251, 191, 36, 0.12)',
      glowBackground: 'radial-gradient(circle at center, rgba(251, 191, 36, 0.18) 0%, transparent 70%)',
      glowShadow: '0 0 30px rgba(251, 191, 36, 0.22)',
      overlayClassName: 'bg-gradient-to-br from-amber-50/30 via-rose-50/20 to-orange-50/30',
      iconPulse: [
        'drop-shadow(0 2px 8px rgba(251, 191, 36, 0.24))',
        'drop-shadow(0 4px 12px rgba(244, 114, 182, 0.32))',
        'drop-shadow(0 2px 8px rgba(251, 191, 36, 0.24))',
      ],
      iconGlowClassName: 'bg-gradient-to-br from-amber-200/40 via-rose-200/40 to-orange-200/40',
      iconWrapperClassName: 'bg-gradient-to-br from-amber-100/80 to-rose-100/80 border-2 border-amber-200/30',
      iconClassName: 'text-amber-600',
      actionIconClassName: 'text-amber-600',
    },
    dark: {
      beamBackground:
        'linear-gradient(to right, transparent 0%, rgba(251, 191, 36, 0.55) 20%, rgba(244, 114, 182, 0.85) 50%, rgba(251, 191, 36, 0.55) 80%, transparent 100%)',
      beamBoxShadow: '0 0 12px rgba(251, 191, 36, 0.35), 0 0 28px rgba(244, 114, 182, 0.22)',
      frameBackgroundImage:
        'linear-gradient(45deg, rgba(251, 191, 36, 0.95), rgba(244, 114, 182, 0.85), rgba(234, 88, 12, 0.95))',
      buttonShadow: '0 0 30px rgba(251, 191, 36, 0.24), inset 0 0 28px rgba(244, 114, 182, 0.08)',
      glowBackground: 'radial-gradient(circle at center, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
      glowShadow: '0 0 40px rgba(251, 191, 36, 0.45), 0 0 60px rgba(244, 114, 182, 0.3)',
      iconPulse: [
        'drop-shadow(0 0 15px rgba(251, 191, 36, 0.6))',
        'drop-shadow(0 0 25px rgba(244, 114, 182, 0.85))',
        'drop-shadow(0 0 15px rgba(251, 191, 36, 0.6))',
      ],
      iconGlowClassName: 'bg-gradient-to-br from-amber-500 to-rose-500',
      iconWrapperClassName: 'bg-gradient-to-br from-amber-500/90 to-rose-500/90 border border-amber-300/35',
      iconClassName: 'text-white',
      titleClassName:
        'bg-gradient-to-b from-white via-amber-100 to-amber-300/90 bg-clip-text text-transparent tracking-tight drop-shadow-[0_1px_10px_rgba(251,191,36,0.35)]',
      actionIconClassName: 'text-amber-300',
    },
  }), []);

  const featuredVaultCard: WelcomeMenuCardConfig = useMemo(() => ({
    key: 'vault',
    title: 'The Vault',
    description: 'Access your case archive',
    actionLabel: 'Open Archive',
    onClick: onOpenArchive,
    icon: FolderOpen,
    actionIcon: FolderOpen,
    delay: 0.95,
    pastel: {
      borderClassName: 'border-pink-200/40',
      cardShadow: '0 4px 20px rgba(251, 182, 206, 0.15), 0 0 0 1px rgba(251, 182, 206, 0.1)',
      glowBackground: 'radial-gradient(circle at center, rgba(251, 182, 206, 0.15) 0%, transparent 70%)',
      glowShadow: '0 0 30px rgba(251, 182, 206, 0.2)',
      overlayClassName: 'bg-gradient-to-br from-pink-50/30 via-rose-50/20 to-purple-50/30',
      iconPulse: [
        'drop-shadow(0 2px 8px rgba(251, 182, 206, 0.2))',
        'drop-shadow(0 4px 12px rgba(244, 114, 182, 0.28))',
        'drop-shadow(0 2px 8px rgba(251, 182, 206, 0.2))',
      ],
      iconGlowClassName: 'bg-gradient-to-br from-pink-200/40 via-rose-200/40 to-purple-200/40',
      iconWrapperClassName: 'bg-gradient-to-br from-pink-100/80 to-purple-100/80 border-2 border-pink-200/30',
      iconClassName: 'text-pink-400',
      actionIconClassName: 'text-pink-400',
    },
    dark: {
      beamBackground:
        'linear-gradient(to right, transparent 0%, rgba(244, 114, 182, 0.55) 20%, rgba(168, 85, 247, 0.82) 50%, rgba(244, 114, 182, 0.55) 80%, transparent 100%)',
      beamBoxShadow: '0 0 12px rgba(244, 114, 182, 0.3), 0 0 28px rgba(168, 85, 247, 0.22)',
      frameBackgroundImage:
        'linear-gradient(45deg, rgba(244, 114, 182, 0.95), rgba(168, 85, 247, 0.88), rgba(236, 72, 153, 0.92))',
      buttonShadow: '0 0 30px rgba(244, 114, 182, 0.2), inset 0 0 28px rgba(168, 85, 247, 0.08)',
      glowBackground: 'radial-gradient(circle at center, rgba(244, 114, 182, 0.18) 0%, transparent 70%)',
      glowShadow: '0 0 40px rgba(244, 114, 182, 0.4), 0 0 60px rgba(168, 85, 247, 0.28)',
      iconPulse: [
        'drop-shadow(0 0 15px rgba(244, 114, 182, 0.58))',
        'drop-shadow(0 0 25px rgba(168, 85, 247, 0.8))',
        'drop-shadow(0 0 15px rgba(244, 114, 182, 0.58))',
      ],
      iconGlowClassName: 'bg-gradient-to-br from-pink-500 to-fuchsia-600',
      iconWrapperClassName: 'bg-gradient-to-br from-pink-500/90 to-fuchsia-600/90 border border-pink-300/40',
      iconClassName: 'text-white',
      titleClassName:
        'bg-gradient-to-b from-white via-pink-100 to-pink-300/90 bg-clip-text text-transparent tracking-tight drop-shadow-[0_1px_10px_rgba(244,114,182,0.35)]',
      actionIconClassName: 'text-pink-300',
    },
  }), [onOpenArchive]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePositionRef.current = { x: event.clientX, y: event.clientY };
      if (mouseRafRef.current === null) {
        mouseRafRef.current = window.requestAnimationFrame(() => {
          setMousePosition(mousePositionRef.current);
          mouseRafRef.current = null;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseRafRef.current !== null) {
        window.cancelAnimationFrame(mouseRafRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`relative flex flex-col min-h-screen bg-gradient-to-br ${bgGradient} overflow-x-hidden`}
      style={{ overflowAnchor: 'none' }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(${primaryRgba}0.1) 1px, transparent 1px),
              linear-gradient(90deg, ${primaryRgba}0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)',
          }}
        />
      </motion.div>

      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute rounded-full ${isPastel ? 'bg-purple-300' : 'bg-cyber-cyan-400'}`}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              boxShadow: `0 0 ${particle.size * 4}px ${secondaryRgba}0.6)`,
            }}
            initial={{ opacity: 0 }}
            animate={{
              y: [0, -80, 0],
              x: [0, Math.sin(particle.id) * 30, 0],
              opacity: [0, 0.3, 0.7, 0.3],
              scale: [1, 1.3, 1],
            }}
            transition={{
              opacity: {
                duration: 1.2,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 0.3 + particle.delay * 0.1,
                times: [0, 0.3, 0.7, 1],
              },
              y: {
                duration: particle.duration,
                repeat: Infinity,
                delay: 1.2 + particle.delay,
                ease: [0.4, 0, 0.6, 1],
              },
              x: {
                duration: particle.duration,
                repeat: Infinity,
                delay: 1.2 + particle.delay,
                ease: [0.4, 0, 0.6, 1],
              },
              scale: {
                duration: particle.duration,
                repeat: Infinity,
                delay: 1.2 + particle.delay,
                ease: [0.4, 0, 0.6, 1],
              },
            }}
          />
        ))}
      </div>

      <motion.div
        className="fixed w-96 h-96 rounded-full pointer-events-none z-[1]"
        style={{
          background: `radial-gradient(circle, ${primaryRgba}0.15) 0%, transparent 70%)`,
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          filter: 'blur(60px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale: [1, 1.15, 1] }}
        transition={{
          opacity: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 },
          scale: { duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.3 },
        }}
      />

      <motion.div
        className={`relative z-10 w-full px-8 pt-8 pb-6 ${
          isPastel
            ? 'border-b border-purple-200/30 bg-gradient-to-r from-white/60 via-pink-50/40 to-white/60 backdrop-blur-xl'
            : 'border-b border-cyber-purple-400/20 bg-gradient-to-r from-gray-900/80 via-purple-900/30 to-gray-900/80 backdrop-blur-2xl'
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-6">
            {isPastel ? (
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.95, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  opacity: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 },
                  scale: { duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 },
                  rotate: { duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 },
                }}
              >
                <div
                  className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-purple-200/60 bg-white shadow-md"
                  style={{
                    boxShadow: '0 10px 22px rgba(216, 180, 254, 0.18), inset 0 1px 8px rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-purple-50 to-pink-100" />
                  <div className="absolute inset-[3px] rounded-full border border-purple-200/60" />
                  <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-white/95 via-purple-100/90 to-pink-100/95" />
                  <FolderOpen className="relative z-10 w-9 h-9 text-purple-500 drop-shadow-sm" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  opacity: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 },
                  scale: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 },
                }}
              >
                <div
                  className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-cyber-purple-400/45 bg-gray-950 shadow-xl"
                  style={{
                    boxShadow: '0 0 16px rgba(139, 92, 246, 0.28), 0 0 26px rgba(34, 211, 238, 0.12), inset 0 1px 8px rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-900 via-purple-950 to-slate-950" />
                  <div className="absolute inset-[3px] rounded-full border border-white/10" />
                  <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-purple-500/18 via-transparent to-cyan-400/14" />
                  <FolderOpen className="relative z-10 w-9 h-9 text-white drop-shadow-[0_0_12px_rgba(139,92,246,0.42)]" />
                </div>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
            >
              {isPastel ? (
                <>
                  <motion.div
                    className="flex items-center gap-2.5 mb-2.5"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.42em] text-purple-500/80">
                      Research Suite
                    </span>
                  </motion.div>
                  <motion.h1
                    className="text-5xl font-semibold leading-none tracking-tight text-gray-800"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      opacity: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.25 },
                      y: { duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay: 0.25 },
                    }}
                    style={{ textShadow: '0 2px 8px rgba(216, 180, 254, 0.2)' }}
                  >
                    Welcome to Vault
                  </motion.h1>
                  <motion.div
                    className="flex items-center gap-3 mt-3.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.35 }}
                  >
                    <span className="h-px w-10 bg-gradient-to-r from-purple-400/70 to-transparent" />
                    <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 font-medium">
                      A Research Organization System
                    </p>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    className="flex items-center gap-2.5 mb-2.5"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-cyber-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.42em] text-cyber-cyan-300/80">
                      Research Suite
                    </span>
                  </motion.div>
                  <motion.h1
                    className="text-5xl font-semibold leading-none tracking-tight bg-gradient-to-b from-white via-purple-100 to-cyber-purple-300/90 bg-clip-text text-transparent"
                    style={{ filter: 'drop-shadow(0 2px 16px rgba(139, 92, 246, 0.28))' }}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      opacity: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.25 },
                      y: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.25 },
                    }}
                  >
                    Welcome to Vault
                  </motion.h1>
                  <motion.div
                    className="flex items-center gap-3 mt-3.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.35 }}
                  >
                    <span className="h-px w-10 bg-gradient-to-r from-cyber-purple-400/80 via-cyber-cyan-400/50 to-transparent" />
                    <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400 font-medium">
                      A Research Organization System
                    </p>
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.25 }}
          >
            <ActionToolbar hideWordEditorButton={true} />
          </motion.div>
        </div>
      </motion.div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-start px-8 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
          className="text-center max-w-7xl w-full pb-16"
        >
          <div
            className="relative flex w-full flex-col items-center overflow-visible"
            style={{ height: 256 + 64 - 40 }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.35 }}
              className="flex justify-center"
            >
              {isPastel ? (
                <div className="relative w-64 h-64 flex items-center justify-center overflow-hidden rounded-full">
                <motion.div
                  className="absolute inset-0 border-4 border-purple-200/30 rounded-full"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1, rotate: 360 }}
                  transition={{
                    opacity: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.45 },
                    scale: { duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.45 },
                    rotate: { duration: 40, repeat: Infinity, ease: 'linear', delay: 1.4 },
                  }}
                  style={{
                    boxShadow: '0 0 20px rgba(216, 180, 254, 0.3), inset 0 0 20px rgba(216, 180, 254, 0.1)',
                  }}
                />
                <motion.div
                  className="absolute inset-8 border-2 border-pink-200/40 rounded-full"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1, rotate: -360 }}
                  transition={{
                    opacity: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 },
                    scale: { duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.5 },
                    rotate: { duration: 35, repeat: Infinity, ease: 'linear', delay: 1.45 },
                  }}
                  style={{
                    boxShadow: '0 0 15px rgba(251, 182, 206, 0.3), inset 0 0 15px rgba(251, 182, 206, 0.1)',
                  }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-200/30 via-pink-200/30 to-blue-200/30 blur-3xl rounded-full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.15, 1] }}
                  transition={{
                    opacity: { duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 0.55 },
                    scale: { duration: 6, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 },
                  }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-pink-200/20 via-blue-200/20 to-purple-200/20 blur-2xl rounded-full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: [0.15, 0.3, 0.15], scale: [1.05, 1.2, 1.05] }}
                  transition={{
                    opacity: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 0.6 },
                    scale: { duration: 7, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 },
                  }}
                />
                <motion.img
                  src={getAssetPath('vault-icon.png')}
                  alt="The Vault"
                  className="w-52 h-52 relative z-10"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, -8, 0],
                    filter: [
                      'drop-shadow(0 4px 12px rgba(216, 180, 254, 0.3)) drop-shadow(0 8px 24px rgba(251, 182, 206, 0.2))',
                      'drop-shadow(0 6px 16px rgba(216, 180, 254, 0.4)) drop-shadow(0 12px 32px rgba(251, 182, 206, 0.3))',
                      'drop-shadow(0 4px 12px rgba(216, 180, 254, 0.3)) drop-shadow(0 8px 24px rgba(251, 182, 206, 0.2))',
                    ],
                  }}
                  transition={{
                    opacity: { duration: 1.1, ease: [0.25, 0.1, 0.25, 1], delay: 0.55 },
                    scale: { duration: 1.1, ease: [0.34, 1.56, 0.64, 1], delay: 0.55 },
                    y: { duration: 6, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 },
                    filter: { duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 0.95 },
                  }}
                />
                </div>
              ) : (
                <div className="relative w-64 h-64 flex items-center justify-center overflow-hidden rounded-full">
                <motion.div
                  className="absolute inset-0 border-4 border-cyber-purple-400/40 rounded-full"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1, rotate: 360 }}
                  transition={{
                    opacity: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.45 },
                    scale: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.45 },
                    rotate: { duration: 30, repeat: Infinity, ease: 'linear', delay: 1.4 },
                  }}
                  style={{ boxShadow: `0 0 30px ${primaryRgba}0.6), inset 0 0 30px ${primaryRgba}0.2)` }}
                />
                <motion.div
                  className="absolute inset-8 border-2 border-cyber-cyan-400/50 rounded-full"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1, rotate: -360 }}
                  transition={{
                    opacity: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 },
                    scale: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 },
                    rotate: { duration: 24, repeat: Infinity, ease: 'linear', delay: 1.45 },
                  }}
                  style={{ boxShadow: `0 0 20px ${secondaryRgba}0.6), inset 0 0 20px ${secondaryRgba}0.2)` }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-purple blur-3xl rounded-full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.25, 1] }}
                  transition={{
                    opacity: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.55 },
                    scale: { duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 },
                  }}
                  style={{ filter: `drop-shadow(0 0 40px ${primaryRgba}0.8))` }}
                />
                <motion.div
                  className="absolute inset-0 bg-cyber-cyan-400/40 blur-2xl rounded-full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1.05, 1.3, 1.05] }}
                  transition={{
                    opacity: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.6 },
                    scale: { duration: 6, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 },
                  }}
                />
                <motion.img
                  src={getAssetPath('vault-icon.png')}
                  alt="The Vault"
                  className="w-52 h-52 relative z-10"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, -12, 0],
                    filter: [
                      `drop-shadow(0 0 20px ${primaryRgba}0.8)) drop-shadow(0 0 40px ${secondaryRgba}0.6))`,
                      `drop-shadow(0 0 30px ${primaryRgba}1)) drop-shadow(0 0 60px ${secondaryRgba}0.8))`,
                      `drop-shadow(0 0 20px ${primaryRgba}0.8)) drop-shadow(0 0 40px ${secondaryRgba}0.6))`,
                    ],
                  }}
                  transition={{
                    opacity: { duration: 1.1, ease: [0.25, 0.1, 0.25, 1], delay: 0.55 },
                    scale: { duration: 1.1, ease: [0.25, 0.1, 0.25, 1], delay: 0.55 },
                    y: { duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 },
                    filter: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 0.95 },
                  }}
                />
                </div>
              )}
            </motion.div>
          </div>

          <div className="relative w-full max-w-7xl overflow-visible">
            <div className="relative">
              <MenuGridBeamNetwork
                isPastel={isPastel}
                primaryRgba={primaryRgba}
                secondaryRgba={secondaryRgba}
                columnCount={actionCards.length === 4 ? 4 : 3}
              />

              <div
                className={`relative z-10 grid grid-cols-1 md:grid-cols-2 ${
                  actionCards.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                } items-start gap-8 lg:pt-10`}
              >
                {pdfToPngCard && onOpenFileConverter ? (
                  <PdfConverterColumn
                    isPastel={isPastel}
                    primaryRgba={primaryRgba}
                    secondaryRgba={secondaryRgba}
                    pdfBeamBackground={pdfToPngCard.dark.beamBackground}
                    pdfBeamBoxShadow={pdfToPngCard.dark.beamBoxShadow}
                    fileConverterPalette={fileConverterPalette}
                    onOpenFileConverter={onOpenFileConverter}
                    delay={pdfToPngCard.delay}
                  >
                    <WelcomeActionCard card={pdfToPngCard} isPastel={isPastel} omitDarkBeamBorder />
                  </PdfConverterColumn>
                ) : pdfToPngCard ? (
                  <WelcomeActionCardWrapper card={pdfToPngCard} isPastel={isPastel} />
                ) : null}
                {middleActionCards.map((card) => (
                  <WelcomeActionCardWrapper key={card.key} card={card} isPastel={isPastel} />
                ))}
                {pdfAuditCard && onOpenNovel ? (
                  <PdfAuditNovelColumn
                    isPastel={isPastel}
                    primaryRgba={primaryRgba}
                    secondaryRgba={secondaryRgba}
                    pdfAuditBeamBackground={pdfAuditCard.dark.beamBackground}
                    pdfAuditBeamBoxShadow={pdfAuditCard.dark.beamBoxShadow}
                    novelPalette={novelPalette}
                    onOpenNovel={onOpenNovel}
                    delay={pdfAuditCard.delay}
                  >
                    <WelcomeActionCard card={pdfAuditCard} isPastel={isPastel} omitDarkBeamBorder />
                  </PdfAuditNovelColumn>
                ) : pdfAuditCard ? (
                  <WelcomeActionCardWrapper key={pdfAuditCard.key} card={pdfAuditCard} isPastel={isPastel} />
                ) : null}
              </div>
            </div>

            <div className="mx-auto mt-8 flex w-full max-w-5xl flex-col items-center lg:-mt-52">
              <CardBottomDropBeam
                isPastel={isPastel}
                primaryRgba={primaryRgba}
                secondaryRgba={secondaryRgba}
                dropHeight={22}
                delayIndex={1}
                className="mb-1 hidden lg:block"
              />
              <div
                className={`grid w-full grid-cols-1 ${
                  actionCards.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                }`}
              >
                <div
                  className={`${
                    actionCards.length === 4
                      ? 'lg:col-start-2 lg:col-span-2'
                      : 'lg:col-start-1 lg:col-span-3'
                  }`}
                >
                  {(() => {
                    const card = featuredVaultCard;
                    const Icon = card.icon;
                    const ActionIcon = card.actionIcon;

                    return (
                      <motion.div
                        key={card.key}
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          duration: 0.9,
                          ease: [0.25, 0.1, 0.25, 1],
                          delay: card.delay,
                        }}
                        className="relative group -translate-y-2 lg:-translate-y-4"
                      >
                        {isPastel ? (
                          <motion.button
                            whileHover={{
                              scale: 1.01,
                              y: -3,
                              transition: {
                                duration: 0.3,
                                ease: [0.4, 0, 0.2, 1],
                              },
                            }}
                            whileTap={{ scale: 0.98 }}
                            onPointerEnter={warmArchiveEntry}
                            onPointerDown={warmArchiveEntry}
                            onClick={card.onClick}
                            className={`w-full relative overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl shadow-lg border-2 transition-all duration-300 z-10 ${card.pastel.borderClassName}`}
                            style={{ boxShadow: card.pastel.cardShadow }}
                          >
                            <motion.div
                              className="absolute inset-0 rounded-3xl pointer-events-none"
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1, transition: { duration: 0.3 } }}
                              style={{
                                background: card.pastel.glowBackground,
                                boxShadow: card.pastel.glowShadow,
                              }}
                            />
                            <motion.div
                              className={`absolute inset-0 rounded-3xl ${card.pastel.overlayClassName}`}
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                            <div className="relative z-10 p-10 md:p-12 flex flex-col items-center gap-6">
                              <motion.div
                                className="relative"
                                animate={{ filter: card.pastel.iconPulse }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                              >
                                <div className={`absolute inset-0 rounded-3xl blur-xl ${card.pastel.iconGlowClassName}`}></div>
                                <motion.div
                                  className={`relative p-6 rounded-3xl shadow-md ${card.pastel.iconWrapperClassName}`}
                                  whileHover={{
                                    scale: 1.08,
                                    rotate: [0, -1, 1, -1, 1, 0],
                                    transition: {
                                      duration: 0.4,
                                      ease: 'easeOut',
                                    },
                                  }}
                                >
                                  <Icon className={`w-12 h-12 ${card.pastel.iconClassName}`} />
                                </motion.div>
                              </motion.div>
                              <div className="text-center max-w-2xl">
                                <h3 className="text-3xl font-bold mb-2 text-gray-800">{card.title}</h3>
                                <p className="text-base text-gray-600">{card.description}</p>
                              </div>
                              <motion.div
                                className="flex items-center gap-3 text-gray-700 font-semibold text-lg"
                                whileHover={{ scale: 1.05 }}
                              >
                                <ActionIcon className={`w-5 h-5 ${card.pastel.actionIconClassName}`} />
                                <span>{card.actionLabel}</span>
                              </motion.div>
                            </div>
                          </motion.button>
                        ) : (
                          <>
                            <div
                              className="absolute -inset-[2px] pointer-events-none z-0 rounded-3xl"
                              style={{
                                background: card.dark.beamBackground,
                                padding: '2px',
                                WebkitMask:
                                  'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                WebkitMaskComposite: 'xor',
                                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                maskComposite: 'exclude',
                                boxShadow: card.dark.beamBoxShadow,
                              }}
                            />
                            <AmbientLavaFrame borderGradient={card.dark.frameBackgroundImage}>
                              <motion.button
                                whileHover={{
                                  scale: 1.02,
                                  y: -4,
                                  transition: {
                                    duration: 0.2,
                                    ease: [0.4, 0, 0.2, 1],
                                  },
                                }}
                                whileTap={{ scale: 0.98 }}
                                onPointerEnter={warmArchiveEntry}
                                onPointerDown={warmArchiveEntry}
                                onClick={card.onClick}
                                className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200 z-10"
                                style={{ boxShadow: card.dark.buttonShadow }}
                              >
                                <motion.div
                                  className="absolute inset-0 rounded-3xl pointer-events-none"
                                  initial={{ opacity: 0 }}
                                  whileHover={{ opacity: 1, transition: { duration: 0.2 } }}
                                  style={{
                                    background: card.dark.glowBackground,
                                    boxShadow: card.dark.glowShadow,
                                  }}
                                />
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"
                                  initial={{ opacity: 0 }}
                                  whileHover={{ opacity: 1 }}
                                  transition={{ duration: 0.2 }}
                                />
                                <div className="relative z-10 p-10 md:p-12 flex flex-col items-center gap-6">
                                  <motion.div
                                    className="relative"
                                    animate={{ filter: card.dark.iconPulse }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                  >
                                    <div className={`absolute inset-0 rounded-3xl blur-2xl opacity-60 ${card.dark.iconGlowClassName}`}></div>
                                    <motion.div
                                      className={`relative p-6 rounded-3xl shadow-2xl ${card.dark.iconWrapperClassName}`}
                                      whileHover={{
                                        scale: 1.1,
                                        rotate: [0, -2, 2, -2, 2, 0],
                                        transition: {
                                          duration: 0.3,
                                          ease: 'easeOut',
                                        },
                                      }}
                                    >
                                      <Icon className={`w-12 h-12 ${card.dark.iconClassName}`} />
                                    </motion.div>
                                  </motion.div>
                                  <div className="text-center max-w-2xl">
                                    <h3 className={`text-3xl font-bold mb-2 ${card.dark.titleClassName}`}>
                                      {card.title}
                                    </h3>
                                    <p className="text-base text-gray-300">{card.description}</p>
                                  </div>
                                  <motion.div
                                    className="flex items-center gap-3 text-white font-semibold text-lg"
                                    whileHover={{ scale: 1.1 }}
                                  >
                                    <ActionIcon className={`w-5 h-5 ${card.dark.actionIconClassName}`} />
                                    <span>{card.actionLabel}</span>
                                  </motion.div>
                                </div>
                              </motion.button>
                            </AmbientLavaFrame>
                          </>
                        )}
                      </motion.div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
