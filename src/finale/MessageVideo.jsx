import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";
import { FINALE_VIDEO } from "../config";

// Your video message, after the letter: a full-screen countdown (4, 3, 2, 1),
// then the video plays at the center. It closes by itself when it ends.
//   open    → show it (countdown first)
//   onStart → the video is starting (the finale pauses the birthday song)
//   onClose → ended or closed
export default function MessageVideo({ open, onStart, onClose }) {
  return createPortal(
    <AnimatePresence>{open && FINALE_VIDEO && <Player key="message-video" onStart={onStart} onClose={onClose} />}</AnimatePresence>,
    document.body,
  );
}

function Player({ onStart, onClose }) {
  const [count, setCount] = useState(FINALE_VIDEO.countdown ?? 3);
  const [blocked, setBlocked] = useState(false); // the browser refused to autoplay with sound
  const videoRef = useRef(null);
  const counting = count > 0;

  // One tick per second; at 0 the video takes over.
  useEffect(() => {
    if (!counting) return;
    const timer = setTimeout(() => setCount((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, counting]);

  const play = () => {
    const video = videoRef.current;
    if (!video) return;
    // Always with sound: never inherit a muted or lowered default.
    video.muted = false;
    video.volume = 1;
    onStart?.();
    video.play().then(
      () => setBlocked(false),
      () => setBlocked(true), // e.g. iPhone without a fresh tap: show a play button
    );
  };

  useEffect(() => {
    if (!counting) play();
  }, [counting]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Video message"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/97 px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* The video loads during the countdown so it starts instantly. */}
      <motion.div
        className="relative flex h-full max-h-[86dvh] items-center justify-center"
        initial={false}
        animate={{ opacity: counting ? 0 : 1, scale: counting ? 0.94 : 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <video
          ref={videoRef}
          src={FINALE_VIDEO.src}
          preload="auto"
          playsInline
          controls={!counting && !blocked}
          onEnded={onClose}
          className="max-h-[86dvh] w-auto max-w-full rounded-3xl shadow-[0_0_80px_rgba(255,168,197,0.25)] ring-1 ring-white/15"
        />
        {blocked && (
          <button
            type="button"
            onClick={play}
            className="absolute inset-0 m-auto flex size-fit cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-blush-300 via-lilac-300 to-gold-300 px-8 py-4 text-lg font-bold text-plum-900 shadow-[0_0_40px_rgba(255,133,173,0.6)]"
          >
            <Play className="size-5" fill="currentColor" /> {FINALE_VIDEO.tapToPlay}
          </button>
        )}
      </motion.div>

      {/* Countdown */}
      <AnimatePresence>
        {counting && (
          <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-6" exit={{ opacity: 0 }}>
            <motion.p
              className="font-script text-4xl text-blush-100 text-glow sm:text-5xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {FINALE_VIDEO.countdownLine}
            </motion.p>
            <div className="relative flex size-36 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-gold-300/30" />
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={count}
                  className="font-script text-8xl text-gold-200 drop-shadow-[0_0_24px_rgba(247,208,112,0.7)]"
                  initial={{ opacity: 0, scale: 1.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.45 }}
                >
                  {count}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        aria-label="Close video"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 cursor-pointer rounded-full border border-white/15 bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25"
      >
        <X className="size-5" />
      </button>
    </motion.div>
  );
}
