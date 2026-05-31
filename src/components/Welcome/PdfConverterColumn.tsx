import { motion } from 'framer-motion';
import { FileCog, type LucideIcon } from 'lucide-react';
import {
  MenuPdfConverterBranch,
  RoundedBeamFrame,
} from './MenuEnergyConnector';
import { warmFileConverterEntry } from '../../utils/fileConverterPrefetch';

export interface FileConverterCardPalette {
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

interface PdfConverterColumnProps {
  isPastel: boolean;
  primaryRgba: string;
  secondaryRgba: string;
  pdfBeamBackground: string;
  pdfBeamBoxShadow?: string;
  fileConverterPalette: FileConverterCardPalette;
  onOpenFileConverter: () => void;
  children: React.ReactNode;
  delay?: number;
}

const FILE_CONVERTER_MIN_HEIGHT = 'min-h-[14rem]';
const FILE_CONVERTER_PADDING = 'p-6 md:p-8';

export function PdfConverterColumn({
  isPastel,
  primaryRgba,
  secondaryRgba,
  pdfBeamBackground,
  pdfBeamBoxShadow,
  fileConverterPalette,
  onOpenFileConverter,
  children,
  delay = 0.7,
}: PdfConverterColumnProps) {
  const Icon: LucideIcon = FileCog;
  const ActionIcon: LucideIcon = FileCog;

  const warmConverter = () => warmFileConverterEntry();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay }}
      className="relative group flex flex-col"
      onMouseEnter={warmConverter}
      onFocus={warmConverter}
    >
      <RoundedBeamFrame
        isPastel={isPastel}
        primaryRgba={primaryRgba}
        secondaryRgba={secondaryRgba}
        beamBackground={pdfBeamBackground}
        beamBoxShadow={pdfBeamBoxShadow}
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
          onClick={onOpenFileConverter}
          onFocus={warmConverter}
          className={`w-full ${FILE_CONVERTER_MIN_HEIGHT} flex flex-col relative overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl shadow-lg border-2 transition-all duration-300 z-10 ${fileConverterPalette.pastel.borderClassName}`}
          style={{ boxShadow: fileConverterPalette.pastel.cardShadow }}
        >
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1, transition: { duration: 0.3 } }}
            style={{
              background: fileConverterPalette.pastel.glowBackground,
              boxShadow: fileConverterPalette.pastel.glowShadow,
            }}
          />
          <motion.div
            className={`absolute inset-0 rounded-3xl ${fileConverterPalette.pastel.overlayClassName}`}
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          <div
            className={`relative z-10 ${FILE_CONVERTER_PADDING} flex h-full flex-1 flex-col items-center gap-4`}
          >
            <motion.div
              className="relative"
              animate={{ filter: fileConverterPalette.pastel.iconPulse }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div
                className={`absolute inset-0 rounded-2xl blur-xl ${fileConverterPalette.pastel.iconGlowClassName}`}
              />
              <motion.div
                className={`relative p-4 rounded-2xl shadow-md ${fileConverterPalette.pastel.iconWrapperClassName}`}
                whileHover={{ scale: 1.08, transition: { duration: 0.4, ease: 'easeOut' } }}
              >
                <Icon className={`w-9 h-9 ${fileConverterPalette.pastel.iconClassName}`} />
              </motion.div>
            </motion.div>
            <div className="text-center flex flex-1 flex-col justify-center w-full">
              <h3 className="text-xl font-bold mb-1 text-gray-800">File Converter</h3>
              <p className="text-sm text-gray-600 min-h-[2.5rem]">
                Convert evidence to any supported format
              </p>
            </div>
            <motion.div
              className="flex items-center gap-2 text-gray-700 font-semibold text-base"
              whileHover={{ scale: 1.05 }}
            >
              <ActionIcon className={`w-4 h-4 ${fileConverterPalette.pastel.actionIconClassName}`} />
              <span>Open Converter</span>
            </motion.div>
          </div>
        </motion.button>
      ) : (
        <>
          <div
            className="absolute -inset-[2px] pointer-events-none z-0 rounded-3xl bottom-0 top-auto h-[calc(14rem+4px)]"
            style={{
              background: fileConverterPalette.dark.beamBackground,
              padding: '2px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              boxShadow: fileConverterPalette.dark.beamBoxShadow,
            }}
          />
          <motion.div
            className={`rounded-3xl p-[3px] ${FILE_CONVERTER_MIN_HEIGHT}`}
            style={{
              backgroundImage: fileConverterPalette.dark.frameBackgroundImage,
              backgroundSize: '200% 200%',
            }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <motion.button
              whileHover={{ scale: 1.04, y: -3, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenFileConverter}
              onFocus={warmConverter}
              className={`w-full ${FILE_CONVERTER_MIN_HEIGHT} flex flex-col relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200 z-10`}
              style={{ boxShadow: fileConverterPalette.dark.buttonShadow }}
            >
              <motion.div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1, transition: { duration: 0.2 } }}
                style={{
                  background: fileConverterPalette.dark.glowBackground,
                  boxShadow: fileConverterPalette.dark.glowShadow,
                }}
              />
              <div
                className={`relative z-10 ${FILE_CONVERTER_PADDING} flex h-full flex-1 flex-col items-center gap-4`}
              >
                <motion.div
                  className="relative"
                  animate={{ filter: fileConverterPalette.dark.iconPulse }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div
                    className={`absolute inset-0 rounded-2xl blur-2xl opacity-60 ${fileConverterPalette.dark.iconGlowClassName}`}
                  />
                  <motion.div
                    className={`relative p-4 rounded-2xl shadow-2xl ${fileConverterPalette.dark.iconWrapperClassName}`}
                    whileHover={{ scale: 1.1, transition: { duration: 0.3, ease: 'easeOut' } }}
                  >
                    <Icon className={`w-9 h-9 ${fileConverterPalette.dark.iconClassName}`} />
                  </motion.div>
                </motion.div>
                <div className="text-center flex flex-1 flex-col justify-center w-full">
                  <h3
                    className={`text-xl font-bold mb-1 ${fileConverterPalette.dark.titleClassName}`}
                  >
                    File Converter
                  </h3>
                  <p className="text-sm text-gray-300 min-h-[2.5rem]">
                    Convert evidence to any supported format
                  </p>
                </div>
                <motion.div
                  className="flex items-center gap-2 text-white font-semibold text-base"
                  whileHover={{ scale: 1.1 }}
                >
                  <ActionIcon className={`w-4 h-4 ${fileConverterPalette.dark.actionIconClassName}`} />
                  <span>Open Converter</span>
                </motion.div>
              </div>
            </motion.button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
