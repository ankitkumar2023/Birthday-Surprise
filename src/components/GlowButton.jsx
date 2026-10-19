import { motion } from "framer-motion";

const GLOW_SOFT = "0 0 18px rgba(255, 133, 173, 0.45), 0 0 40px rgba(192, 132, 252, 0.25)";
const GLOW_STRONG = "0 0 30px rgba(255, 133, 173, 0.8), 0 0 70px rgba(192, 132, 252, 0.5)";

// A pill button that pulses with light and grows on hover.
// `delay` holds back its entrance so it can appear after surrounding text.
export default function GlowButton({ children, onClick, delay = 0 }) {
  return (
    // The entrance lives on this wrapper so its delay never slows down the hover effect.
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 180, damping: 14 }}
    >
      <motion.button
        type="button"
        onClick={onClick}
        className="flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-blush-300 via-lilac-300 to-gold-300 px-10 py-4 text-lg font-bold tracking-wide text-plum-900"
        animate={{ boxShadow: [GLOW_SOFT, GLOW_STRONG, GLOW_SOFT] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.12, transition: { type: "spring", stiffness: 300, damping: 12 } }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </motion.button>
    </motion.div>
  );
}
