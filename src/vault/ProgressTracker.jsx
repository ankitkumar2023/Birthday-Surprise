import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// One box per memory. Each fills with gold when its memory is unlocked;
// when all are full, a banner shines underneath.
//   total    → number of memories
//   unlocked → array of unlocked memory indexes
//   label / doneLabel → text from MEMORY_VAULT in config.js
export default function ProgressTracker({ total, unlocked, label, doneLabel }) {
  const complete = unlocked.length === total;

  return (
    <motion.div
      className="mx-auto mb-8 flex w-fit flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
    >
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-lilac-200/80">
        {label}
        <span className="tabular-nums text-gold-300">
          {unlocked.length}/{total}
        </span>
      </div>

      <div className="flex gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={unlocked.length}>
        {Array.from({ length: total }, (_, i) => {
          const filled = unlocked.includes(i);
          return (
            <div key={i} className="relative size-7 rounded-md border border-white/20 bg-white/5">
              <AnimatePresence>
                {filled && (
                  <motion.span
                    className="absolute -inset-px overflow-hidden rounded-md bg-linear-to-br from-gold-200 via-gold-400 to-blush-300 shadow-[0_0_14px_rgba(247,208,112,0.8)]"
                    initial={{ scale: 0, rotate: -90, opacity: 0 }}
                    animate={{ scale: [0, 1.35, 1], rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                  >
                    {/* golden shimmer */}
                    <motion.span
                      className="absolute inset-y-0 -left-full w-full bg-linear-to-r from-transparent via-white/70 to-transparent"
                      animate={{ x: ["0%", "200%"] }}
                      transition={{ duration: 1.2, delay: 1 + i * 0.15, repeat: Infinity, repeatDelay: 3.5 }}
                    />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {complete && (
          <motion.p
            className="flex items-center gap-2 overflow-hidden font-script text-2xl text-gold-200 text-glow"
            initial={{ opacity: 0, height: 0, scale: 0.7 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 160, damping: 16 }}
          >
            <Sparkles className="size-5" /> {doneLabel} <Sparkles className="size-5" />
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
