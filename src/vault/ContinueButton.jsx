import { motion } from "framer-motion";
import { Gift } from "lucide-react";

const GLOW_SOFT = "0 0 24px rgba(247,208,112,0.5), 0 0 60px rgba(255,133,173,0.35)";
const GLOW_STRONG = "0 0 45px rgba(247,208,112,0.9), 0 0 110px rgba(255,133,173,0.6)";

// The giant glowing button that appears once every memory is unlocked.
// It floats, pulses, and its gradient slowly flows.
//   calm → hold still (e.g. while a video plays, so playback stays smooth)
export default function ContinueButton({ onClick, children, calm = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 2.2, type: "spring", stiffness: 120, damping: 12 }}
    >
      {/* Floating */}
      <motion.div animate={calm ? { y: 0 } : { y: [0, -10, 0] }} transition={{ duration: 3, repeat: calm ? 0 : Infinity, ease: "easeInOut" }}>
        <motion.button
          type="button"
          onClick={onClick}
          className="relative flex cursor-pointer items-center gap-3 rounded-full bg-linear-to-r from-gold-300 via-blush-300 to-lilac-300 bg-size-[200%_100%] px-8 py-5 text-lg font-bold tracking-wide text-plum-900 sm:px-12 sm:py-6 sm:text-2xl"
          style={{ boxShadow: GLOW_SOFT }}
          animate={calm ? { scale: 1 } : { scale: [1, 1.04, 1], backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{
            scale: { duration: 2.2, repeat: calm ? 0 : Infinity, ease: "easeInOut" },
            backgroundPosition: { duration: 6, repeat: Infinity, ease: "linear" },
          }}
          whileHover={{ scale: 1.12, transition: { type: "spring", stiffness: 300, damping: 12 } }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Pulsing glow: a fixed shadow layer that only fades (cheap to draw) */}
          {!calm && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ boxShadow: GLOW_STRONG }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          {/* Expanding halo ring */}
          {!calm && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-gold-200"
              animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <Gift className="size-6 sm:size-7" />
          {children}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
