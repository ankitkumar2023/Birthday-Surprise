import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Music, Pause, X } from "lucide-react";
import { SafeImage } from "../components/SafeMedia";
import AudioPlayer, { playMemoryAudio, stopMemoryAudio, useMemoryAudio, useStopAudioOnUnmount } from "./AudioPlayer";
import { useModal } from "./hooks";
import { playSound } from "./sounds";

const SWIPE_DISTANCE = 80; // px of horizontal drag that counts as a swipe

// Re-opening an unlocked memory: blurred backdrop, letterbox bars, the photo
// grows out of its card (shared layoutId with MemoryCard), and the shayari
// sits beneath it. Music only plays if she taps "Play the music".
// ← / → or a swipe browse unlocked memories; Esc closes.
//   index    → card being viewed, or null when closed
//   position → { current, total } for the "2 of 4" label
export default function MemoryPhotoModal({ cards, index, position, onClose, onNavigate }) {
  const card = index === null ? null : cards[index];
  return createPortal(
    <AnimatePresence>
      {card && <Viewer key="memory-viewer" card={card} index={index} position={position} onClose={onClose} onNavigate={onNavigate} />}
    </AnimatePresence>,
    document.body,
  );
}

function Viewer({ card, index, position, onClose, onNavigate }) {
  const canBrowse = position.total > 1;
  useStopAudioOnUnmount();

  const go = (step) => {
    playSound("click");
    stopMemoryAudio();
    onNavigate(step);
  };
  const close = () => {
    playSound("click");
    onClose();
  };

  useModal(true, (e) => {
    if (e.key === "Escape") close();
    if (canBrowse && e.key === "ArrowRight") go(1);
    if (canBrowse && e.key === "ArrowLeft") go(-1);
  });

  const roundButton =
    "z-20 cursor-pointer rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/25 sm:p-3";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={card.title}
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/80 px-4 py-[8vh] backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={close}
    >
      {/* Letterbox bars */}
      {[
        { className: "top-0", from: "-100%" },
        { className: "bottom-0", from: "100%" },
      ].map((bar) => (
        <motion.div
          key={bar.className}
          className={`pointer-events-none fixed inset-x-0 z-10 h-[5vh] bg-black ${bar.className}`}
          initial={{ y: bar.from }}
          animate={{ y: 0 }}
          exit={{ y: bar.from }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}

      <motion.button
        type="button"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        className={`${roundButton} fixed right-4 top-[calc(5vh+1rem)]`}
        whileHover={{ rotate: 90, scale: 1.1 }}
        whileTap={{ scale: 0.85 }}
      >
        <X className="size-5" />
      </motion.button>

      {canBrowse && (
        <>
          <NavButton className={`${roundButton} fixed left-2 top-1/2 -translate-y-1/2 sm:left-6`} label="Previous memory" onClick={() => go(-1)}>
            <ChevronLeft className="size-6" />
          </NavButton>
          <NavButton className={`${roundButton} fixed right-2 top-1/2 -translate-y-1/2 sm:right-6`} label="Next memory" onClick={() => go(1)}>
            <ChevronRight className="size-6" />
          </NavButton>
        </>
      )}

      <AnimatePresence mode="wait">
        <Slide key={index} card={card} index={index} position={position} canBrowse={canBrowse} onSwipe={go} />
      </AnimatePresence>
    </motion.div>
  );
}

function Slide({ card, index, position, canBrowse, onSwipe }) {
  const audio = useMemoryAudio();
  const isPlaying = audio.playing && audio.src === card.audio;
  const words = [card.shayari, card.message].filter((t) => t?.trim());

  return (
    <motion.figure
      onClick={(e) => e.stopPropagation()}
      className="relative my-auto flex w-full max-w-2xl flex-col items-center px-8 sm:px-14"
      initial={{ opacity: 0, scale: 0.92, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -12 }}
      transition={{ type: "spring", stiffness: 170, damping: 22 }}
      drag={canBrowse ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      onDragEnd={(_, info) => {
        if (info.offset.x < -SWIPE_DISTANCE) onSwipe(1);
        if (info.offset.x > SWIPE_DISTANCE) onSwipe(-1);
      }}
    >
      {/* Shares its layoutId with the card, so the photo grows out of the grid. */}
      <motion.div
        layoutId={`memory-media-${index}`}
        className="relative overflow-hidden rounded-2xl border border-gold-300/30 shadow-[0_0_90px_rgba(255,133,173,0.3)]"
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
      >
        <motion.div animate={{ scale: [1, 1.06] }} transition={{ duration: 14, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}>
          <SafeImage
            src={card.photo}
            alt={card.title}
            className="block max-h-[52vh] max-w-full object-contain"
            placeholderClassName="aspect-4/5 w-[70vw] max-w-sm"
          />
        </motion.div>
      </motion.div>

      <motion.figcaption
        className="mt-5 text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
          {card.icon} Memory {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="mt-2 font-script text-3xl text-blush-100 text-glow sm:text-4xl">{card.title}</h3>
        {words.map((text, i) => (
          <p
            key={i}
            className={`mt-4 whitespace-pre-line ${i === 0 && card.shayari?.trim() ? "font-script text-xl leading-snug text-blush-100 sm:text-2xl" : "leading-relaxed text-lilac-200/90"}`}
          >
            {text}
          </p>
        ))}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm">
          {card.audio && (
            <motion.button
              type="button"
              onClick={() => (isPlaying ? stopMemoryAudio() : playMemoryAudio(card.audio, card.audioSettings))}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold text-blush-100 backdrop-blur transition-colors hover:bg-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
            >
              {isPlaying ? <Pause className="size-4" /> : <Music className="size-4" />}
              {isPlaying ? "Pause the music" : "Play the music"}
            </motion.button>
          )}
          <AudioPlayer />
          {canBrowse && (
            <span className="text-lilac-200/60">
              {position.current} of {position.total} unlocked
            </span>
          )}
        </div>
      </motion.figcaption>
    </motion.figure>
  );
}

function NavButton({ children, className, label, onClick }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={className}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.88 }}
    >
      {children}
    </motion.button>
  );
}
