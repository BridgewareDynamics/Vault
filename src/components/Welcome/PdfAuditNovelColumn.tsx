import { motion } from 'framer-motion';
import { BookOpen, type LucideIcon } from 'lucide-react';
import { AmbientLavaFrame } from '../Shared/AmbientLavaFrame';
import { MenuPdfConverterBranch, RoundedBeamFrame } from './MenuEnergyConnector';
import { warmNovelEntry } from '../../utils/novelPrefetch';

export interface NovelCardPalette {
  pastel: {
    borderClassName: string;
    cardShadow: string;
    glowBackground: string;
    glowShadow: string;
    overlayClassName: string;
    iconPulse: string[];
    iconGlowClassName: string;
    iconWrapperClassName: string;
    iconClassName: string;
    actionIconClassName: string;
  };
  dark: {
    beamBackground: string;
    beamBoxShadow: string;
    frameBackgroundImage: string;
    buttonShadow: string;
    glowBackground: string;
    glowShadow: string;
    iconPulse: string[];
    iconGlowClassName: string;
    iconWrapperClassName: string;
    iconClassName: string;
    titleClassName: string;
    actionIconClassName: string;
  };
}

interface PdfAuditNovelColumnProps {
  isPastel: boolean;
  primaryRgba: string;
  secondaryRgba: string;
  pdfAuditBeamBackground: string;
  pdfAuditBeamBoxShadow?: string;
  novelPalette: NovelCardPalette;
  onOpenNovel: () => void;
  children: React.ReactNode;
  delay?: number;
}

const NOVEL_MIN_HEIGHT = 'min-h-[14rem]';
const NOVEL_PADDING = 'p-6 md:p-8';

export function PdfAuditNovelColumn({
  isPastel,
  primaryRgba,
  secondaryRgba,
  pdfAuditBeamBackground,
  pdfAuditBeamBoxShadow,
  novelPalette,
  onOpenNovel,
  children,
  delay = 0.8,
}: PdfAuditNovelColumnProps) {
  const Icon: LucideIcon = BookOpen;
  const ActionIcon: LucideIcon = BookOpen;

  const warmNovel = () => warmNovelEntry();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay }}
      className="relative group flex flex-col"
      onMouseEnter={warmNovel}
      onFocus={warmNovel}
    >
      <RoundedBeamFrame
        isPastel={isPastel}
        primaryRgba={primaryRgba}
        secondaryRgba={secondaryRgba}
        beamBackground={pdfAuditBeamBackground}
        beamBoxShadow={pdfAuditBeamBoxShadow}
        className="flex-1"
      >
        {children}
      </RoundedBeamFrame>

      <MenuPdfConverterBranch
        isPastel={isPastel}
        primaryRgba={primaryRgba}
        secondaryRgba={secondaryRgba}
      />

      {isPastel ? (
        <motion.button
          whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenNovel}
          onFocus={warmNovel}
          className={`w-full ${NOVEL_MIN_HEIGHT} flex flex-col relative overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl shadow-lg border-2 transition-all duration-300 z-10 ${novelPalette.pastel.borderClassName}`}
          style={{ boxShadow: novelPalette.pastel.cardShadow }}
        >
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1, transition: { duration: 0.3 } }}
            style={{
              background: novelPalette.pastel.glowBackground,
              boxShadow: novelPalette.pastel.glowShadow,
            }}
          />
          <motion.div
            className={`absolute inset-0 rounded-3xl ${novelPalette.pastel.overlayClassName}`}
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          <div className={`relative z-10 ${NOVEL_PADDING} flex h-full flex-1 flex-col items-center gap-4`}>
            <motion.div
              className="relative"
              animate={{ filter: novelPalette.pastel.iconPulse }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className={`absolute inset-0 rounded-2xl blur-xl ${novelPalette.pastel.iconGlowClassName}`} />
              <motion.div
                className={`relative p-4 rounded-2xl shadow-md ${novelPalette.pastel.iconWrapperClassName}`}
                whileHover={{ scale: 1.08, transition: { duration: 0.4, ease: 'easeOut' } }}
              >
                <Icon className={`w-9 h-9 ${novelPalette.pastel.iconClassName}`} />
              </motion.div>
            </motion.div>
            <div className="text-center flex flex-1 flex-col justify-center w-full">
              <h3 className="text-xl font-bold mb-1 text-gray-800">Novel</h3>
              <p className="text-sm text-gray-600 min-h-[2.5rem]">
                Spread-based books with covers, case links, and export
              </p>
            </div>
            <motion.div className="flex items-center gap-2 text-gray-700 font-semibold text-base" whileHover={{ scale: 1.05 }}>
              <ActionIcon className={`w-4 h-4 ${novelPalette.pastel.actionIconClassName}`} />
              <span>Open Novel</span>
            </motion.div>
          </div>
        </motion.button>
      ) : (
        <>
          <div
            className="absolute -inset-[2px] pointer-events-none z-0 rounded-3xl bottom-0 top-auto h-[calc(14rem+4px)]"
            style={{
              background: novelPalette.dark.beamBackground,
              padding: '2px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              boxShadow: novelPalette.dark.beamBoxShadow,
            }}
          />
          <AmbientLavaFrame className={NOVEL_MIN_HEIGHT} borderGradient={novelPalette.dark.frameBackgroundImage}>
            <motion.button
              whileHover={{ scale: 1.04, y: -3, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenNovel}
              onFocus={warmNovel}
              className={`w-full ${NOVEL_MIN_HEIGHT} flex flex-col relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200 z-10`}
              style={{ boxShadow: novelPalette.dark.buttonShadow }}
            >
              <motion.div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1, transition: { duration: 0.2 } }}
                style={{
                  background: novelPalette.dark.glowBackground,
                  boxShadow: novelPalette.dark.glowShadow,
                }}
              />
              <div className={`relative z-10 ${NOVEL_PADDING} flex h-full flex-1 flex-col items-center gap-4`}>
                <motion.div
                  className="relative"
                  animate={{ filter: novelPalette.dark.iconPulse }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div
                    className={`absolute inset-0 rounded-2xl blur-2xl opacity-60 ${novelPalette.dark.iconGlowClassName}`}
                  />
                  <motion.div
                    className={`relative p-4 rounded-2xl shadow-2xl ${novelPalette.dark.iconWrapperClassName}`}
                    whileHover={{ scale: 1.1, transition: { duration: 0.3, ease: 'easeOut' } }}
                  >
                    <Icon className={`w-9 h-9 ${novelPalette.dark.iconClassName}`} />
                  </motion.div>
                </motion.div>
                <div className="text-center flex flex-1 flex-col justify-center w-full">
                  <h3 className={`text-xl font-bold mb-1 ${novelPalette.dark.titleClassName}`}>Novel</h3>
                  <p className="text-sm text-gray-300 min-h-[2.5rem]">
                    Spread-based books with covers, case links, and export
                  </p>
                </div>
                <motion.div className="flex items-center gap-2 text-white font-semibold text-base" whileHover={{ scale: 1.1 }}>
                  <ActionIcon className={`w-4 h-4 ${novelPalette.dark.actionIconClassName}`} />
                  <span>Open Novel</span>
                </motion.div>
              </div>
            </motion.button>
          </AmbientLavaFrame>
        </>
      )}
    </motion.div>
  );
}
