import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import Typewriter from "../components/Typewriter";
import { SafeImage } from "../components/SafeMedia";
import AudioPlayer from "./AudioPlayer";
import { useTimeout } from "./hooks";

// The reward at the end of a conversation: the shayari types itself out,
// the photo slowly comes into focus, then a Continue button appears.
// (ConversationModal starts the card's music the moment this appears, and
// fades it out on Continue / ✕ / Esc.)
//   card        → one entry from MEMORY_VAULT.cards
//   continueLabel, onContinue → the button at the end
export default function ShayariReveal({ card, continueLabel, onContinue }) {
  const hasShayari = Boolean(card.shayari?.trim());
  const hasMessage = Boolean(card.message?.trim());
  const [shayariDone, setShayariDone] = useState(!hasShayari);
  const [messageDone, setMessageDone] = useState(!hasMessage);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const later = useTimeout();

  // Give the photo time to fully appear before offering Continue.
  useEffect(() => {
    later(() => setMinTimePassed(true), 4200);
  }, [later]);

  const ready = shayariDone && messageDone && minTimePassed;

  return (
    <div className="relative">
      <FloatingHearts />
      <AudioPlayer className="absolute right-0 top-0 z-20" />

      {/* Cinematic photo reveal: out of darkness and blur, then a slow, endless drift */}
      <motion.div
        className={`relative mx-auto w-full overflow-hidden rounded-2xl border border-gold-300/40 ${card.landscape ? "aspect-4/3 max-w-sm" : "aspect-4/5 max-w-60 sm:max-w-72"}`}
        initial={{ opacity: 0, scale: 0.92, boxShadow: "0 0 0px rgba(247,208,112,0)" }}
        animate={{ opacity: 1, scale: 1, boxShadow: "0 0 60px rgba(247,208,112,0.35)" }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ filter: "blur(28px) brightness(0.35)", scale: 1.35 }}
          animate={{ filter: "blur(0px) brightness(1)", scale: 1.04 }}
          transition={{ duration: 4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="size-full"
            animate={{ scale: [1, 1.1] }}
            transition={{ duration: 18, delay: 4.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          >
            <SafeImage src={card.photo} alt={card.title} className="size-full object-cover object-[50%_30%]" placeholderClassName="size-full" />
          </motion.div>
        </motion.div>

        {/* Golden shimmer sweeping across the frame */}
        <motion.span
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-gold-200/35 to-transparent"
          animate={{ x: ["0%", "400%"] }}
          transition={{ duration: 1.6, delay: 4.2, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
        />
      </motion.div>

      {/* The words */}
      <div className="relative mt-6 min-h-24 text-center">
        {hasShayari && (
          <Typewriter
            text={card.shayari}
            speed={48}
            startDelay={700}
            onDone={() => setShayariDone(true)}
            className="font-script text-2xl leading-snug text-blush-100 text-glow sm:text-[1.7rem]"
          />
        )}
        {hasMessage && shayariDone && (
          <Typewriter
            text={card.message}
            speed={38}
            startDelay={hasShayari ? 600 : 900}
            onDone={() => setMessageDone(true)}
            className={`leading-relaxed text-lilac-200/95 sm:text-lg ${hasShayari ? "mt-5" : ""}`}
          />
        )}
      </div>

      {/* Continue */}
      <div className="mt-6 flex min-h-14 justify-center">
        {ready && (
          <motion.button
            type="button"
            onClick={onContinue}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-blush-300 via-lilac-300 to-gold-300 px-8 py-3.5 text-base font-bold text-plum-900"
            initial={{ opacity: 0, y: 16, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              boxShadow: ["0 0 18px rgba(255,133,173,0.45)", "0 0 40px rgba(247,208,112,0.75)", "0 0 18px rgba(255,133,173,0.45)"],
            }}
            transition={{ type: "spring", stiffness: 200, damping: 14, boxShadow: { duration: 2.4, repeat: Infinity } }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
          >
            {continueLabel} <ArrowRight className="size-5" />
          </motion.button>
        )}
      </div>
    </div>
  );
}

// Little hearts drifting up behind the photo.
function FloatingHearts() {
  const hearts = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: 8 + Math.random() * 84,
        size: 10 + Math.random() * 12,
        duration: 6 + Math.random() * 5,
        delay: 1 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 50,
        color: i % 3 === 0 ? "text-gold-300" : i % 3 === 1 ? "text-blush-300" : "text-lilac-300",
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {hearts.map((h) => (
        <motion.span
          key={h.id}
          className={`absolute bottom-0 ${h.color}`}
          style={{ left: `${h.left}%` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, -420], x: [0, h.drift], opacity: [0, 0.8, 0], rotate: [0, h.drift / 3] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: "easeOut" }}
        >
          <Heart style={{ width: h.size, height: h.size }} fill="currentColor" />
        </motion.span>
      ))}
    </div>
  );
}
