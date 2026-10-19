import { useMemo } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Lock, MessageCircleHeart, Sparkles } from "lucide-react";
import { SafeImage } from "../components/SafeMedia";

// Tall shapes of different heights make the grid look like masonry while
// keeping portrait photos uncropped. `landscape: true` in config.js gives a
// card a wide shape; `shape: "aspect-square"` (any Tailwind aspect class) overrides both.
const SHAPES = ["aspect-4/5", "aspect-3/4", "aspect-9/16", "aspect-9/16", "aspect-3/4"];

const OPEN_GLOW = ["0 0 0px rgba(255,133,173,0)", "0 0 34px rgba(255,133,173,0.55)", "0 0 0px rgba(255,133,173,0)"];

// One memory in the vault grid.
//   status       → "locked" (waiting for the previous card), "open" (ready to chat),
//                  or "done" (photo revealed)
//   celebrating  → true right after it's finished: the lock shatters, sparks fly
//   onOpen(index)
export default function MemoryCard({ card, index, status, celebrating, onOpen, enterDelay = 0 }) {
  const shape = card.shape ?? (card.landscape ? "aspect-4/3" : SHAPES[index % SHAPES.length]);
  const number = String(index + 1).padStart(2, "0");
  const done = status === "done";
  const open = status === "open";

  // 3D tilt that follows the mouse (desktop only; touch has no hover).
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [9, -9]), { stiffness: 220, damping: 20 });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-9, 9]), { stiffness: 220, damping: 20 });

  const tilt = (e) => {
    if (e.pointerType !== "mouse" || status === "locked") return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const resetTilt = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const label = done
    ? `Open memory: ${card.title}`
    : open
      ? `Memory ${number}: ${card.title}. Tap to start the conversation`
      : `Memory ${number} is locked`;

  return (
    <motion.div
      className="relative mb-4 break-inside-avoid perspective-[900px]"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: enterDelay, type: "spring", stiffness: 110, damping: 15 }}
    >
      <motion.button
        type="button"
        onClick={() => {
          resetTilt();
          onOpen(index);
        }}
        onPointerMove={tilt}
        onPointerLeave={resetTilt}
        aria-label={label}
        className={`group relative block w-full overflow-hidden rounded-2xl border text-left ${
          done ? "border-gold-300/40" : open ? "border-blush-300/40" : "border-white/10"
        } ${status === "locked" ? "cursor-not-allowed" : "cursor-pointer"} bg-plum-800/60`}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{
          boxShadow: done ? "0 10px 40px rgba(247,208,112,0.18)" : open ? OPEN_GLOW : "0 0 0px rgba(0,0,0,0)",
          opacity: status === "locked" ? 0.6 : 1,
        }}
        transition={{
          // The "ready" card breathes with light; hover / tap stay springy.
          boxShadow: open ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.6 },
          default: { type: "spring", stiffness: 300, damping: 20 },
        }}
        whileHover={status === "locked" ? { x: [0, -4, 4, 0] } : { y: -8, scale: 1.02 }}
        whileTap={status === "locked" ? undefined : { scale: 0.96 }}
      >
        {/* The photo. When done it shares a layoutId with the viewer, so it grows into it. */}
        <motion.div layoutId={done ? `memory-media-${index}` : undefined} className={`relative overflow-hidden ${shape}`}>
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={done ? { filter: "blur(0px)", scale: 1 } : { filter: "blur(22px)", scale: 1.3 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <SafeImage
              src={card.photo}
              alt={done ? card.title : ""}
              className="size-full object-cover object-[50%_30%] transition-transform duration-700 group-hover:scale-105"
              placeholderClassName="size-full"
            />
          </motion.div>

          {/* Front of a card that isn't finished yet */}
          <AnimatePresence>
            {!done && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-linear-to-b from-plum-950/55 via-plum-900/65 to-plum-950/85 p-3 text-center"
                exit={{ opacity: 0, transition: { duration: 0.6 } }}
              >
                {/* Lock → chat bubble when the card becomes available */}
                <div className="relative size-12">
                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.span
                        key="open"
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-blush-300/20 ring-1 ring-blush-300/50"
                        initial={{ scale: 0, rotate: -40 }}
                        animate={{ scale: [1, 1.1, 1], rotate: 0 }}
                        transition={{ scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }, rotate: { type: "spring", stiffness: 200, damping: 12 } }}
                      >
                        <MessageCircleHeart className="size-6 text-blush-200" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="locked"
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10"
                        exit={{ scale: 1.6, rotate: 25, opacity: 0, transition: { duration: 0.5 } }}
                      >
                        <Lock className="size-5 text-white/45" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-lilac-200/80">Memory {number}</span>
                <span className="text-2xl">{card.icon}</span>
                {open && <span className="px-1 font-script text-lg leading-tight text-blush-100">{card.title}</span>}
                <span className="mt-1 text-xs text-blush-100/70 transition-colors group-hover:text-blush-100">
                  {open ? "Tap karke baat shuru karo 💬" : "Pehle pichhli memory kholo 🔒"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Finished: a shine sweep on hover, and the title */}
          {done && (
            <>
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              <motion.div
                className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent p-3 pt-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <span className="text-xs text-gold-200">
                  {card.icon} Memory {number}
                </span>
                <p className="font-script text-xl leading-tight text-white">{card.title}</p>
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.button>

      <AnimatePresence>{celebrating && <UnlockExplosion />}</AnimatePresence>
    </motion.div>
  );
}

const SHARD_COLORS = ["#f7d070", "#ff85ad", "#c084fc", "#fde68a", "#ffffff"];

// The lock bursting apart over the card, with a ring of sparks and a label.
export function UnlockExplosion({ label = "Memory unlocked" }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const distance = 70 + Math.random() * 70;
        return { dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance, color: SHARD_COLORS[i % SHARD_COLORS.length], size: 4 + Math.random() * 6 };
      }),
    [],
  );

  return (
    <motion.div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" exit={{ opacity: 0, transition: { duration: 0.5 } }}>
      {[
        { clip: "inset(0 50% 0 0)", x: -60, rotate: -40 },
        { clip: "inset(0 0 0 50%)", x: 60, rotate: 40 },
      ].map((half, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ clipPath: half.clip }}
          initial={{ scale: 1.4, opacity: 1 }}
          animate={{ x: half.x, y: 50, rotate: half.rotate, opacity: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <Lock className="size-12 text-gold-200 drop-shadow-[0_0_10px_rgba(247,208,112,1)]" />
        </motion.span>
      ))}

      <motion.span
        className="absolute size-24 rounded-full border-2 border-gold-300"
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: s.size, height: s.size, background: s.color, boxShadow: `0 0 10px ${s.color}` }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: s.dx, y: s.dy, opacity: 0, scale: 0.3 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      ))}

      <motion.span
        className="absolute flex items-center gap-1.5 rounded-full border border-gold-300/60 bg-plum-950/80 px-4 py-2 text-sm font-semibold text-gold-200 shadow-[0_0_30px_rgba(247,208,112,0.5)] backdrop-blur"
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 14 }}
      >
        {label} <Sparkles className="size-4" />
      </motion.span>
    </motion.div>
  );
}
