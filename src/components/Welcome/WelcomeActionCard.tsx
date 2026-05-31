import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { warmMapEntry } from '../../utils/mapPrefetch';
import { warmTranscriptionEntry } from '../../utils/transcriptionPrefetch';

export interface WelcomeCardPastelPalette {
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
}

export interface WelcomeCardDarkPalette {
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
}

export interface WelcomeMenuCardConfig {
  key: string;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  icon: LucideIcon;
  actionIcon: LucideIcon;
  delay: number;
  pastel: WelcomeCardPastelPalette;
  dark: WelcomeCardDarkPalette;
}

const ACTION_MENU_CARD_MIN_HEIGHT_CLASS = 'min-h-[22rem]';
const ACTION_MENU_CARD_PADDING_CLASS = 'p-10 md:p-12';
const ACTION_MENU_CARD_BODY_MIN_HEIGHT_CLASS = 'min-h-[6.5rem]';
const ACTION_MENU_CARD_DESCRIPTION_MIN_HEIGHT_CLASS = 'min-h-[3rem]';

interface WelcomeActionCardProps {
  card: WelcomeMenuCardConfig;
  isPastel: boolean;
  omitDarkBeamBorder?: boolean;
}

export function WelcomeActionCard({ card, isPastel, omitDarkBeamBorder = false }: WelcomeActionCardProps) {
  const Icon = card.icon;
  const ActionIcon = card.actionIcon;

  if (isPastel) {
    return (
      <motion.button
        whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
        whileTap={{ scale: 0.98 }}
        onPointerDown={card.key === 'transcription' ? warmTranscriptionEntry : undefined}
        onClick={card.onClick}
        className={`w-full ${ACTION_MENU_CARD_MIN_HEIGHT_CLASS} flex flex-col relative overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl shadow-lg border-2 transition-all duration-300 z-10 ${card.pastel.borderClassName}`}
        style={{ boxShadow: card.pastel.cardShadow }}
      >
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1, transition: { duration: 0.3 } }}
          style={{ background: card.pastel.glowBackground, boxShadow: card.pastel.glowShadow }}
        />
        <motion.div
          className={`absolute inset-0 rounded-3xl ${card.pastel.overlayClassName}`}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        <div
          className={`relative z-10 ${ACTION_MENU_CARD_PADDING_CLASS} flex h-full flex-1 flex-col items-center gap-6`}
        >
          <motion.div
            className="relative"
            animate={{ filter: card.pastel.iconPulse }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className={`absolute inset-0 rounded-3xl blur-xl ${card.pastel.iconGlowClassName}`} />
            <motion.div
              className={`relative p-6 rounded-3xl shadow-md ${card.pastel.iconWrapperClassName}`}
              whileHover={{
                scale: 1.08,
                rotate: [0, -1, 1, -1, 1, 0],
                transition: { duration: 0.4, ease: 'easeOut' },
              }}
            >
              <Icon className={`w-12 h-12 ${card.pastel.iconClassName}`} />
            </motion.div>
          </motion.div>
          <div
            className={`text-center flex flex-1 flex-col justify-center w-full ${ACTION_MENU_CARD_BODY_MIN_HEIGHT_CLASS}`}
          >
            <h3 className="text-2xl font-bold mb-2 text-gray-800">{card.title}</h3>
            <p className={`text-base text-gray-600 ${ACTION_MENU_CARD_DESCRIPTION_MIN_HEIGHT_CLASS}`}>
              {card.description}
            </p>
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
    );
  }

  return (
    <>
      {!omitDarkBeamBorder && (
        <div
          className="absolute -inset-[2px] pointer-events-none z-0 rounded-3xl"
          style={{
            background: card.dark.beamBackground,
            padding: '2px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            boxShadow: card.dark.beamBoxShadow,
          }}
        />
      )}
      <motion.div
        className={`rounded-3xl p-[3px] ${ACTION_MENU_CARD_MIN_HEIGHT_CLASS}`}
        style={{ backgroundImage: card.dark.frameBackgroundImage, backgroundSize: '200% 200%' }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        <motion.button
          whileHover={{ scale: 1.04, y: -4, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }}
          whileTap={{ scale: 0.98 }}
          onPointerDown={card.key === 'transcription' ? warmTranscriptionEntry : undefined}
          onClick={card.onClick}
          className={`w-full ${ACTION_MENU_CARD_MIN_HEIGHT_CLASS} flex flex-col relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200 z-10`}
          style={{ boxShadow: card.dark.buttonShadow }}
        >
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1, transition: { duration: 0.2 } }}
            style={{ background: card.dark.glowBackground, boxShadow: card.dark.glowShadow }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
          <div
            className={`relative z-10 ${ACTION_MENU_CARD_PADDING_CLASS} flex h-full flex-1 flex-col items-center gap-6`}
          >
            <motion.div
              className="relative"
              animate={{ filter: card.dark.iconPulse }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div
                className={`absolute inset-0 rounded-3xl blur-2xl opacity-60 ${card.dark.iconGlowClassName}`}
              />
              <motion.div
                className={`relative p-6 rounded-3xl shadow-2xl ${card.dark.iconWrapperClassName}`}
                whileHover={{
                  scale: 1.1,
                  rotate: [0, -2, 2, -2, 2, 0],
                  transition: { duration: 0.3, ease: 'easeOut' },
                }}
              >
                <Icon className={`w-12 h-12 ${card.dark.iconClassName}`} />
              </motion.div>
            </motion.div>
            <div
              className={`text-center flex flex-1 flex-col justify-center w-full ${ACTION_MENU_CARD_BODY_MIN_HEIGHT_CLASS}`}
            >
              <h3 className={`text-2xl font-bold mb-2 ${card.dark.titleClassName}`}>{card.title}</h3>
              <p className={`text-base text-gray-300 ${ACTION_MENU_CARD_DESCRIPTION_MIN_HEIGHT_CLASS}`}>
                {card.description}
              </p>
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
      </motion.div>
    </>
  );
}

interface WelcomeActionCardWrapperProps {
  card: WelcomeMenuCardConfig;
  isPastel: boolean;
}

export function WelcomeActionCardWrapper({ card, isPastel }: WelcomeActionCardWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: card.delay }}
      className="relative group self-start w-full"
      onPointerEnter={
        card.key === 'map'
          ? warmMapEntry
          : card.key === 'transcription'
            ? warmTranscriptionEntry
            : undefined
      }
    >
      <WelcomeActionCard card={card} isPastel={isPastel} />
    </motion.div>
  );
}
