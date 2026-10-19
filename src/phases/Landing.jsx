import { motion } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";
import PhaseTransition from "../components/PhaseTransition";
import GlowButton from "../components/GlowButton";
import { LANDING_LINE_1, LANDING_LINE_2 } from "../config";

// Phase 1 — a dark, softly glowing teaser. Text arrives line by line,
// then the Start button fades in.
export default function Landing({ onStart }) {
  return (
    <PhaseTransition className="flex flex-col items-center justify-center gap-10 px-6 text-center">
      {/* Floating, glowing gift */}
      <motion.div
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 160, damping: 12 }}
      >
        <motion.div
          className="relative"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-full bg-blush-400/40 blur-2xl" />
          <Gift className="relative size-16 text-blush-200 drop-shadow-[0_0_14px_rgba(255,133,173,0.9)]" strokeWidth={1.5} />
          <Sparkles className="absolute -right-5 -top-4 size-6 text-gold-300" />
        </motion.div>
      </motion.div>

      <div className="space-y-4">
        {/* Outer element fades in once; inner element pulses forever. */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1.2 }}>
          <motion.h1
            className="font-script text-5xl text-blush-100 text-glow sm:text-7xl"
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {LANDING_LINE_1}
          </motion.h1>
        </motion.div>

        <motion.p
          className="text-lg italic tracking-wide text-lilac-200/80 sm:text-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 1.2 }}
        >
          {LANDING_LINE_2}
        </motion.p>
      </div>

      <GlowButton onClick={onStart} delay={3.2}>
        Start <Sparkles className="size-5" />
      </GlowButton>
    </PhaseTransition>
  );
}
