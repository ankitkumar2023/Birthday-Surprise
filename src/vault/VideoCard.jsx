import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Lock, Maximize2 } from "lucide-react";
import { Placeholder } from "../components/SafeMedia";
import { UnlockExplosion } from "./MemoryCard";


// A bonus video in the vault grid.
//   status → "locked" (memories still to go), "ready" (a glowing gift she taps
//            to unlock), or "open" (plays inline as a silent, looping preview)
//   celebrating → just unlocked: the lock bursts apart
//   paused → true while the viewer is open (one video decoding at a time)
//   onOpen(index) → unlocks a "ready" card / opens an "open" one in the viewer
export default function VideoCard({ video, index, number, status, celebrating, paused, onOpen, enterDelay = 0 }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const open = status === "open";

  // Only decode while the card is actually visible.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [failed]);

  // Play only once opened, on screen, and while the viewer isn't showing a video.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !paused && onScreen) el.play().catch(() => {});
    else el.pause();
  }, [open, paused, onScreen]);

  const label =
    status === "locked" ? `Bonus video ${number} is locked` : status === "ready" ? `Unlock bonus video ${number}` : `Open video: ${video.title}`;

  return (
    <motion.div
      className="relative mb-4 break-inside-avoid"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: enterDelay, type: "spring", stiffness: 110, damping: 15 }}
    >
      {/* "Ready" glow: a fixed shadow that only fades in and out. Animating the
          box-shadow itself repaints every frame and makes other videos stutter. */}
      {status === "ready" && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_0_34px_rgba(247,208,112,0.55)]"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <motion.button
        type="button"
        onClick={() => status !== "locked" && onOpen(index)}
        aria-label={label}
        className={`group relative block w-full overflow-hidden rounded-2xl border bg-plum-800/60 text-left ${
          status === "locked" ? "cursor-not-allowed border-white/10" : "cursor-pointer border-gold-300/40"
        }`}
        style={{ boxShadow: open ? "0 10px 40px rgba(247,208,112,0.18)" : "none" }}
        animate={{ opacity: status === "locked" ? 0.6 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        whileHover={status === "locked" ? { x: [0, -4, 4, 0] } : { y: -8 }}
        whileTap={status === "locked" ? undefined : { scale: 0.97 }}
      >
        {/* No filter or scale on the video once it plays — those re-render every frame. */}
        <div className="relative overflow-hidden">
          {failed ? (
            <Placeholder src={video.src} kind="video" className="aspect-9/16" />
          ) : (
            <video
              ref={ref}
              src={video.src}
              muted
              loop
              playsInline
              preload={open ? "auto" : "metadata"}
              onError={() => setFailed(true)}
              className={`block w-full ${open ? "h-auto" : "aspect-9/16 scale-125 object-cover blur-xl"}`}
            />
          )}
        </div>

        <AnimatePresence>
          {!open ? (
            <motion.div
              key="front"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-linear-to-b from-plum-950/55 via-plum-900/65 to-plum-950/85 p-3 text-center"
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
            >
              {status === "ready" ? (
                <motion.span
                  className="flex size-12 items-center justify-center rounded-full bg-gold-300/20 ring-1 ring-gold-300/60"
                  animate={{ scale: [1, 1.12, 1], rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Gift className="size-6 text-gold-200" />
                </motion.span>
              ) : (
                <span className="flex size-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                  <Lock className="size-5 text-white/45" />
                </span>
              )}
              <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-lilac-200/80">Bonus {number}</span>
              <span className="text-2xl">{video.icon}</span>
              <span className={`mt-1 text-xs ${status === "ready" ? "font-semibold text-gold-200" : "text-blush-100/70"}`}>
                {status === "ready" ? "Ek bonus surprise! Tap karke kholo 🎁" : "Saari memories kholo, phir ye khulega 🔒"}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="title"
              className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-linear-to-t from-black/75 to-transparent p-3 pt-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div>
                <span className="text-xs text-gold-200">
                  {video.icon} Bonus {number}
                </span>
                <p className="font-script text-xl leading-tight text-white">{video.title}</p>
              </div>
              {!failed && (
                <span className="shrink-0 rounded-full border border-white/20 bg-white/10 p-2 text-white backdrop-blur">
                  <Maximize2 className="size-4" />
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>{celebrating && <UnlockExplosion label="Bonus unlocked" />}</AnimatePresence>
    </motion.div>
  );
}
